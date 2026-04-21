const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { QueryBuilder, parsePagination } = require('../utils/queryBuilder');
const { invalidateAllDashboardCaches } = require('../utils/dashboardCache');

/**
 * Normalize chat response format
 */
const normalizeChat = (row) => ({
  ...row,
  created: row.created_at,
  updated: row.updated_at,
  expand: {
    user_id: { name: row.user_name },
    technician_id: { name: row.tech_name },
    ticket_id: row.ticket_id ? { id: row.ticket_id, ticket_number: row.ticket_number } : null,
  },
});

/**
 * GET /api/chats
 * Get chats list
 * Query: page, perPage, limit, offset, user_id, technician_id, ticket_id
 */
router.get('/', auth, asyncHandler(async (req, res) => {
  const { page, perPage, limit, offset, user_id, technician_id, ticket_id } = req.query;

  const pagination = parsePagination(page, perPage, limit, offset);

  const baseQuery = `
      SELECT c.*, 
             u.name as user_name,
             t.name as tech_name,
             tk.ticket_number
      FROM chats c
      JOIN users u ON c.user_id = u.id
      JOIN users t ON c.technician_id = t.id
      LEFT JOIN tickets tk ON c.ticket_id = tk.id
    `;

  const qb = new QueryBuilder(baseQuery);

  // Apply role-based filtering
  if (req.user.role === 'User') {
    qb.where('c.user_id = ?', req.user.id);
  } else if (req.user.role === 'Teknisi') {
    qb.where('c.technician_id = ?', req.user.id);
  }

  // Apply additional filters
  if (user_id && req.user.role === 'Admin') {
    qb.where('c.user_id = ?', user_id);
  }

  if (technician_id && req.user.role === 'Admin') {
    qb.where('c.technician_id = ?', technician_id);
  }

  if (ticket_id) {
    qb.where('c.ticket_id = ?', ticket_id);
  }

  qb.orderBy('c.updated_at', 'DESC');

  // Get total count
  const countQuery = qb.buildCountQuery();
  const [[{ total }]] = await pool.query(countQuery.query, countQuery.params);

  // Apply pagination and get data
  qb.paginate(pagination.limit, pagination.offset);
  const { query, params } = qb.build();
  const [rows] = await pool.query(query, params);

  const mapped = rows.map(normalizeChat);

  if (pagination.page) {
    return res.json({
      success: true,
      items: mapped,
      totalItems: total,
      page: pagination.page,
      perPage: pagination.perPage
    });
  }

  res.json({
      success: true,
      items: mapped,
      total
    });
}));

/**
 * GET /api/chats/:id
 * Get chat by ID
 */
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `
    SELECT c.*, 
           u.name as user_name,
           t.name as tech_name,
           tk.ticket_number
    FROM chats c
    JOIN users u ON c.user_id = u.id
    JOIN users t ON c.technician_id = t.id
    LEFT JOIN tickets tk ON c.ticket_id = tk.id
    WHERE c.id = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Chat tidak ditemukan'
    });
  }

  const chat = normalizeChat(rows[0]);

  // Permission check
  if (req.user.role === 'User' && chat.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Tidak memiliki izin mengakses chat ini'
    });
  }

  if (req.user.role === 'Teknisi' && chat.technician_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Tidak memiliki izin mengakses chat ini'
    });
  }

  res.json({
    success: true,
    chat
  });
}));

/**
 * POST /api/chats
 * Create new chat
 * Body: { technician_id, ticket_id? }
 */
router.post('/', auth, asyncHandler(async (req, res) => {
  const { technician_id, ticket_id } = req.body;
  const user_id = req.user.id;

  // Validation
  if (!technician_id) {
    return res.status(400).json({
      success: false,
      message: 'Technician ID harus diisi'
    });
  }

  // Verify technician exists
  const [techExists] = await pool.query('SELECT id FROM users WHERE id = ? AND role = ?', [technician_id, 'Teknisi']);
  if (techExists.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Teknisi tidak ditemukan'
    });
  }

  const id = uuidv4();

  await pool.query(
    'INSERT INTO chats (id, user_id, technician_id, ticket_id, status) VALUES (?, ?, ?, ?, ?)',
    [id, user_id, technician_id, ticket_id || null, 'Open']
  );

  await invalidateAllDashboardCaches();

  // Notify via Socket.IO
  const io = req.app.get('io');
  io.to(`chat:${id}`).emit('chat_created', { 
    id, 
    user_id, 
    technician_id, 
    ticket_id: ticket_id || null, 
    status: 'Open',
    created_at: new Date()
  });

  io.to('technicians').emit('new_chat_available', { 
    chat_id: id, 
    technician_id,
    user_id,
    ticket_id: ticket_id || null
  });

  res.status(201).json({
    success: true,
    message: 'Chat berhasil dibuat',
    id
  });
}));

/**
 * PATCH /api/chats/:id
 * Update chat (status, etc)
 * Body: { status?, updated? }
 */
router.patch('/:id', auth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, updated } = req.body;

  const sets = [];
  const args = [];

  const validStatuses = ['Open', 'Closed', 'Paused'];
  if (status !== undefined) {
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`
      });
    }
    sets.push('status = ?');
    args.push(status);
  }

  if (updated !== undefined) {
    sets.push('updated_at = ?');
    args.push(updated);
  }

  if (sets.length === 0) {
    return res.json({
      success: true,
      message: 'Tidak ada perubahan'
    });
  }

  args.push(id);
  await pool.query(`UPDATE chats SET ${sets.join(', ')} WHERE id = ?`, args);

  await invalidateAllDashboardCaches();

  // Emit update via Socket.IO
  const io = req.app.get('io');
  io.to(`chat:${id}`).emit('chat_updated', { 
    id, 
    status: status || undefined, 
    updated: updated || new Date()
  });

  res.json({
    success: true,
    message: 'Chat berhasil diperbarui'
  });
}));

/**
 * DELETE /api/chats/:id
 * Delete chat (Admin only)
 */
router.delete('/:id', auth, role('Admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  await pool.query('DELETE FROM chats WHERE id = ?', [id]);

  await invalidateAllDashboardCaches();

  // Notify via Socket.IO
  const io = req.app.get('io');
  io.to(`chat:${id}`).emit('chat_deleted', { id });

  res.json({
    success: true,
    message: 'Chat berhasil dihapus'
  });
}));

module.exports = router;
