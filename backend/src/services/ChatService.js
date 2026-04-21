const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

class ChatService {
  /**
   * Get chats with filtering and pagination
   */
  static async getChats(filters = {}, pagination = {}) {
    const { page = 1, perPage = 20 } = pagination;
    const offset = (page - 1) * perPage;

    let query = `
      SELECT c.*, u.name as user_name, t.name as tech_name, tk.ticket_number
      FROM chats c
      JOIN users u ON c.user_id = u.id
      JOIN users t ON c.technician_id = t.id
      LEFT JOIN tickets tk ON c.ticket_id = tk.id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (filters.user_id) {
      query += ' AND c.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.technician_id) {
      query += ' AND c.technician_id = ?';
      params.push(filters.technician_id);
    }

    if (filters.ticket_id) {
      query += ' AND c.ticket_id = ?';
      params.push(filters.ticket_id);
    }

    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT c.*, u.name as user_name, t.name as tech_name, tk.ticket_number\n      FROM chats c', 'SELECT COUNT(*) as total FROM chats c');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Apply pagination
    query += ' ORDER BY c.updated_at DESC LIMIT ? OFFSET ?';
    params.push(perPage, offset);

    const [rows] = await pool.query(query, params);

    const chats = rows.map(row => this.normalizeChat(row));

    return {
      chats,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) }
    };
  }

  /**
   * Get chat by ID
   */
  static async getChatById(id) {
    const [rows] = await pool.query(`
      SELECT c.*, u.name as user_name, t.name as tech_name, tk.ticket_number
      FROM chats c
      JOIN users u ON c.user_id = u.id
      JOIN users t ON c.technician_id = t.id
      LEFT JOIN tickets tk ON c.ticket_id = tk.id
      WHERE c.id = ?
    `, [id]);

    return rows[0] ? this.normalizeChat(rows[0]) : null;
  }

  /**
   * Create new chat
   */
  static async createChat(chatData, userId) {
    const id = uuidv4();

    const chat = {
      id,
      ticket_id: chatData.ticket_id || null,
      user_id: userId,
      technician_id: chatData.technician_id,
      title: chatData.title,
      description: chatData.description || '',
      status: 'Active',
      created_at: new Date(),
      updated_at: new Date()
    };

    await pool.query(`
      INSERT INTO chats (id, ticket_id, user_id, technician_id, title, description,
                        status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      chat.id, chat.ticket_id, chat.user_id, chat.technician_id,
      chat.title, chat.description, chat.status, chat.created_at, chat.updated_at
    ]);

    return this.getChatById(id);
  }

  /**
   * Update chat
   */
  static async updateChat(id, updateData) {
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
      `UPDATE chats SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return this.getChatById(id);
  }

  /**
   * Delete chat
   */
  static async deleteChat(id) {
    await pool.query('DELETE FROM chats WHERE id = ?', [id]);
  }

  /**
   * Check if user can access chat
   */
  static async canAccessChat(chatId, userId, userRole) {
    const [rows] = await pool.query(
      'SELECT user_id, technician_id FROM chats WHERE id = ?',
      [chatId]
    );

    if (rows.length === 0) return false;

    const chat = rows[0];
    return chat.user_id === userId ||
           chat.technician_id === userId ||
           userRole === 'Admin';
  }

  /**
   * Normalize chat response format
   */
  static normalizeChat(row) {
    return {
      ...row,
      created: row.created_at,
      updated: row.updated_at,
      expand: {
        user_id: { name: row.user_name },
        technician_id: { name: row.tech_name },
        ticket_id: row.ticket_id ? { id: row.ticket_id, ticket_number: row.ticket_number } : null,
      },
    };
  }
}

module.exports = ChatService;