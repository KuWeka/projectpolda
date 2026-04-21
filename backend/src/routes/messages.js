const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { QueryBuilder, parsePagination } = require('../utils/queryBuilder');
const { validateInputLength, sanitizeInput } = require('../utils/validators');
const { invalidateAllDashboardCaches } = require('../utils/dashboardCache');

/**
 * Map message response format
 */
const mapMessage = (row) => ({
  ...row,
  created: row.created_at,
  updated: row.created_at,
  expand: { sender_id: { name: row.sender_name } },
});

/**
 * GET /api/messages
 * Get messages from a chat
 * Query: chat_id (required), sort (asc/desc), page, perPage, limit, offset
 */
router.get('/', auth, asyncHandler(async (req, res) => {
  const { chat_id, sort, page, perPage, limit, offset } = req.query;

  // Validate chat_id is provided
  if (!chat_id) {
    return res.status(400).json({
      success: false,
      message: 'Chat ID harus diisi'
    });
  }

  // Verify user has access to this chat
  const [chatExists] = await pool.query(
    `SELECT id FROM chats WHERE id = ? AND (user_id = ? OR technician_id = ?)`,
    [chat_id, req.user.id, req.user.id]
  );

  if (chatExists.length === 0 && req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Tidak memiliki izin untuk mengakses chat ini'
    });
  }

  // Mark incoming messages as read when chat messages are fetched by recipient.
  if (req.user.role !== 'Admin') {
    const [readResult] = await pool.query(
      `UPDATE messages
       SET is_read = 1
       WHERE chat_id = ?
         AND sender_id != ?
         AND is_read = 0`,
      [chat_id, req.user.id]
    );

    if (readResult?.affectedRows > 0) {
      req.app.get('io').to(`chat:${chat_id}`).emit('messages_read', {
        chat_id,
        reader_id: req.user.id,
        read_count: readResult.affectedRows,
      });
    }
  }

  const pagination = parsePagination(page, perPage, limit, offset);

  const baseQuery = `
      SELECT m.*, u.name AS sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
    `;

  const qb = new QueryBuilder(baseQuery);
  qb.where('m.chat_id = ?', chat_id);

  // Default sort is DESC (newest first), can be overridden with sort=asc
  const sortDirection = sort === 'asc' ? 'ASC' : 'DESC';
  qb.orderBy('m.created_at', sortDirection);

  // Get total count
  const countQuery = qb.buildCountQuery();
  const [[{ total }]] = await pool.query(countQuery.query, countQuery.params);

  // Apply pagination and get data
  qb.paginate(pagination.limit, pagination.offset);
  const { query, params } = qb.build();
  const [rows] = await pool.query(query, params);

  const items = rows.map(mapMessage);

  if (pagination.page) {
    return res.json({
      success: true,
      items,
      totalItems: total,
      page: pagination.page,
      perPage: pagination.perPage
    });
  }

  res.json({
      success: true,
      items,
      total
    });
}));

/**
 * POST /api/messages
 * Send message to chat
 * Body: { chat_id, message_content }
 */
router.post('/', auth, asyncHandler(async (req, res) => {
  const { chat_id, message_content } = req.body;
  const sender_id = req.user.id;
  const sender_role = req.user.role;

  // Validation
  if (!chat_id) {
    return res.status(400).json({
      success: false,
      message: 'Chat ID harus diisi'
    });
  }

  if (!message_content || message_content.toString().trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Pesan tidak boleh kosong'
    });
  }

  const contentValidation = validateInputLength(message_content.toString(), 1, 5000);
  if (!contentValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Pesan ' + contentValidation.error,
    });
  }

  // Verify chat exists and user has access
  const [chatExists] = await pool.query(
    `SELECT id FROM chats WHERE id = ? AND (user_id = ? OR technician_id = ?)`,
    [chat_id, req.user.id, req.user.id]
  );

  if (chatExists.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Chat tidak ditemukan atau tidak memiliki akses'
    });
  }

  // Insert message
  const sanitizedContent = sanitizeInput(message_content.toString());

  const [result] = await pool.query(
    'INSERT INTO messages (chat_id, sender_id, sender_role, message_content) VALUES (?, ?, ?, ?)',
    [chat_id, sender_id, sender_role, sanitizedContent]
  );

  // Update chat's last message
  await pool.query('UPDATE chats SET last_message = ?, updated_at = NOW() WHERE id = ?', [sanitizedContent, chat_id]);
  await invalidateAllDashboardCaches();

  // Create response payload
  const payload = {
    id: result.insertId,
    chat_id,
    sender_id,
    sender_role,
    message_content: sanitizedContent,
    created_at: new Date(),
    created: new Date(),
    updated: new Date(),
    expand: { sender_id: { name: req.user.name } },
  };

  // Emit to Socket.IO
  req.app.get('io').to(`chat:${chat_id}`).emit('new_message', payload);

  res.status(201).json({
    success: true,
    message: 'Pesan berhasil dikirim',
    data: payload
  });
}));

/**
 * DELETE /api/messages/:id
 * Delete message (Admin only)
 */
router.delete('/:id', auth, role('Admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [message] = await pool.query('SELECT chat_id FROM messages WHERE id = ?', [id]);
  
  if (message.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Pesan tidak ditemukan'
    });
  }

  await pool.query('DELETE FROM messages WHERE id = ?', [id]);
  await invalidateAllDashboardCaches();

  // Emit deletion to Socket.IO
  req.app.get('io').to(`chat:${message[0].chat_id}`).emit('message_deleted', { id, chat_id: message[0].chat_id });

  res.json({
    success: true,
    message: 'Pesan berhasil dihapus'
  });
}));

module.exports = router;
