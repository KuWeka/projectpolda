const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { cache } = require('../utils/cache');

class UserService {
  static buildKey(prefix, payload = {}) {
    const serialized = Object.entries(payload)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join('|');
    return `${prefix}${serialized ? `:${serialized}` : ''}`;
  }

  static async invalidateUserCaches(userId = null) {
    if (userId) {
      await cache.del(`user:${userId}`);
    }
    await cache.delByPattern('users:list:*');
  }

  /**
   * Get users with filtering and pagination
   */
  static async getUsers(filters = {}, pagination = {}) {
    const { page = 1, perPage = 20 } = pagination;
    const offset = (page - 1) * perPage;

    let query = `
      SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active,
             u.division_id, u.language, u.theme, u.created_at, u.updated_at,
             d.name AS division_name
      FROM users u
      LEFT JOIN divisions d ON u.division_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (filters.role) {
      query += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(filters.is_active);
    }

    if (filters.search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active,\n             u.division_id, u.language, u.theme, u.created_at, u.updated_at,\n             d.name AS division_name\n      FROM users u', 'SELECT COUNT(*) as total FROM users u');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Apply sorting and pagination
    const sortField = filters.sort || 'created_at';
    const sortOrder = filters.order || 'DESC';
    query += ` ORDER BY u.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(perPage, offset);

    const listCacheKey = this.buildKey('users:list', {
      page,
      perPage,
      ...filters,
    });

    const cached = await cache.get(listCacheKey);
    if (cached) {
      return cached;
    }

    const [rows] = await pool.query(query, params);

    const payload = {
      users: rows,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) }
    };

    await cache.set(listCacheKey, payload, 60);

    return payload;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id) {
    const cacheKey = `user:${id}`;
    let user = await cache.get(cacheKey);
    if (user) return user;
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active,
             u.division_id, u.language, u.theme, u.created_at, u.updated_at,
             d.name AS division_name
      FROM users u
      LEFT JOIN divisions d ON u.division_id = d.id
      WHERE u.id = ?
    `, [id]);
    user = rows[0] || null;
    if (user) await cache.set(cacheKey, user, 3600); // cache for 1 hour
    return user;
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    const id = uuidv4();

    // Hash password if provided
    let passwordHash = null;
    if (userData.password) {
      const salt = await bcrypt.genSalt(12);
      passwordHash = await bcrypt.hash(userData.password, salt);
    }

    const user = {
      id,
      name: userData.name,
      email: userData.email,
      username: userData.username || null,
      password_hash: passwordHash,
      phone: userData.phone || null,
      role: userData.role,
      division_id: userData.division_id || null,
      language: userData.language || 'ID',
      theme: userData.theme || 'light',
      is_active: userData.is_active !== undefined ? userData.is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    await pool.query(`
      INSERT INTO users (id, name, email, username, password_hash, phone, role,
                        division_id, language, theme, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, user.name, user.email, user.username, user.password_hash,
      user.phone, user.role, user.division_id, user.language, user.theme,
      user.is_active, user.created_at, user.updated_at
    ]);

    // Invalidate user caches
    await this.invalidateUserCaches(id);

    // Return user without password hash
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password_hash;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  static async updateUser(id, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = ?');
    params.push(new Date());
    params.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    await this.invalidateUserCaches(id);

    return this.getUserById(id);
  }

  /**
   * Delete user (soft delete by setting is_active = false)
   */
  static async deleteUser(id) {
    await pool.query(
      'UPDATE users SET is_active = false, updated_at = ? WHERE id = ?',
      [new Date(), id]
    );
    await this.invalidateUserCaches(id);
  }

  /**
   * Check if email exists
   */
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM users WHERE email = ?';
    const params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username, excludeId = null) {
    if (!username) return false;

    let query = 'SELECT id FROM users WHERE username = ?';
    const params = [username];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }
}

module.exports = UserService;