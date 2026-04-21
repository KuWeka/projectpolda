const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { cache } = require('../utils/cache');

class TicketService {
  static buildKey(prefix, payload = {}) {
    const serialized = Object.entries(payload)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join('|');
    return `${prefix}${serialized ? `:${serialized}` : ''}`;
  }

  static async invalidateTicketCaches(ticketId = null) {
    if (ticketId) {
      await cache.del(`ticket:${ticketId}`);
    }
    await cache.delByPattern('tickets:list:*');
    await cache.del('tickets:stats');
  }

  /**
   * Get tickets with filtering and pagination
   */
  static async getTickets(filters = {}, pagination = {}) {
    const { page = 1, perPage = 20 } = pagination;
    const offset = (page - 1) * perPage;

    let query = `
      SELECT t.*, u.name as reporter_name, tech.name as technician_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters.urgency) {
      query += ' AND t.urgency = ?';
      params.push(filters.urgency);
    }

    if (filters.user_id) {
      query += ' AND t.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.assigned_technician_id !== undefined) {
      if (filters.assigned_technician_id === null || filters.assigned_technician_id === '') {
        query += ' AND (t.assigned_technician_id IS NULL OR t.assigned_technician_id = "")';
      } else {
        query += ' AND t.assigned_technician_id = ?';
        params.push(filters.assigned_technician_id);
      }
    }

    if (filters.search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT t.*, u.name as reporter_name, tech.name as technician_name\n      FROM tickets t', 'SELECT COUNT(*) as total FROM tickets t');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Apply sorting and pagination
    const sortField = filters.sort || 'created_at';
    const sortOrder = filters.order || 'DESC';
    query += ` ORDER BY t.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(perPage, offset);

    const listCacheKey = this.buildKey('tickets:list', {
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
      tickets: rows,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) }
    };

    await cache.set(listCacheKey, payload, 60);

    return payload;
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(id) {
    const cacheKey = `ticket:${id}`;
    let ticket = await cache.get(cacheKey);
    if (ticket) return ticket;
    const [rows] = await pool.query(`
      SELECT t.*, u.name as reporter_name, tech.name as technician_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE t.id = ?
    `, [id]);
    ticket = rows[0] || null;
    if (ticket) await cache.set(cacheKey, ticket, 3600); // cache for 1 hour
    return ticket;
  }

  /**
   * Create new ticket
   */
  static async createTicket(ticketData) {
    const id = uuidv4();
    const ticketNumber = await this.generateTicketNumber();

    const ticket = {
      id,
      ticket_number: ticketNumber,
      title: ticketData.title,
      description: ticketData.description,
      urgency: ticketData.urgency,
      category: ticketData.category,
      status: 'Open',
      user_id: ticketData.user_id,
      assigned_technician_id: null,
      solution: null,
      closed_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await pool.query(`
      INSERT INTO tickets (id, ticket_number, title, description, urgency, category,
                          status, user_id, assigned_technician_id, solution, closed_at,
                          created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ticket.id, ticket.ticket_number, ticket.title, ticket.description,
      ticket.urgency, ticket.category, ticket.status, ticket.user_id,
      ticket.assigned_technician_id, ticket.solution, ticket.closed_at,
      ticket.created_at, ticket.updated_at
    ]);

    await this.invalidateTicketCaches(id);

    return ticket;
  }

  /**
   * Update ticket
   */
  static async updateTicket(id, updateData) {
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
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    await this.invalidateTicketCaches(id);

    return this.getTicketById(id);
  }

  /**
   * Delete ticket
   */
  static async deleteTicket(id) {
    await pool.query('DELETE FROM tickets WHERE id = ?', [id]);
    await this.invalidateTicketCaches(id);
  }

  /**
   * Generate unique ticket number
   */
  static async generateTicketNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get the next sequence number for this month
    const [rows] = await pool.query(`
      SELECT COUNT(*) as count FROM tickets
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
    `, [year, date.getMonth() + 1]);

    const sequence = String(rows[0].count + 1).padStart(4, '0');
    return `TKT-${year}${month}-${sequence}`;
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStats() {
    const cacheKey = 'tickets:stats';
    const cachedStats = await cache.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN urgency = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN urgency = 'High' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN urgency = 'Medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN urgency = 'Low' THEN 1 ELSE 0 END) as low
      FROM tickets
    `);

    await cache.set(cacheKey, stats[0], 60);

    return stats[0];
  }
}

module.exports = TicketService;