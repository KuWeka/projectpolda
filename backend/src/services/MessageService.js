const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

class MessageService {
  /**
   * Get messages for a chat
   */
  static async getMessages(chatId, pagination = {}) {
    const { page = 1, perPage = 50 } = pagination;
    const offset = (page - 1) * perPage;

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM messages WHERE chat_id = ?',
      [chatId]
    );
    const total = countResult[0].total;

    // Get messages with pagination
    const [rows] = await pool.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `, [chatId, perPage, offset]);

    return {
      messages: rows,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) }
    };
  }

  /**
   * Create new message
   */
  static async createMessage(messageData, senderId) {
    const id = uuidv4();

    const message = {
      id,
      chat_id: messageData.chat_id,
      sender_id: senderId,
      content: messageData.content,
      message_type: messageData.message_type || 'text',
      attachment_url: messageData.attachment_url || null,
      created_at: new Date()
    };

    await pool.query(`
      INSERT INTO messages (id, chat_id, sender_id, content, message_type,
                           attachment_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      message.id, message.chat_id, message.sender_id, message.content,
      message.message_type, message.attachment_url, message.created_at
    ]);

    // Update chat's updated_at
    await pool.query(
      'UPDATE chats SET updated_at = ? WHERE id = ?',
      [new Date(), message.chat_id]
    );

    return message;
  }

  /**
   * Get message by ID
   */
  static async getMessageById(id) {
    const [rows] = await pool.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [id]);

    return rows[0] || null;
  }

  /**
   * Delete message
   */
  static async deleteMessage(id) {
    await pool.query('DELETE FROM messages WHERE id = ?', [id]);
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadCount(userId) {
    const [rows] = await pool.query(`
      SELECT COUNT(*) as unread_count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE (c.user_id = ? OR c.technician_id = ?)
        AND m.sender_id != ?
        AND m.created_at > (
          SELECT COALESCE(MAX(last_read_at), '1970-01-01')
          FROM chat_reads
          WHERE chat_id = c.id AND user_id = ?
        )
    `, [userId, userId, userId, userId]);

    return rows[0].unread_count;
  }

  /**
   * Mark chat as read for user
   */
  static async markAsRead(chatId, userId) {
    await pool.query(`
      INSERT INTO chat_reads (chat_id, user_id, last_read_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE last_read_at = VALUES(last_read_at)
    `, [chatId, userId, new Date()]);
  }

  /**
   * Get recent messages across all user's chats
   */
  static async getRecentMessages(userId, limit = 10) {
    const [rows] = await pool.query(`
      SELECT m.*, c.title as chat_title, u.name as sender_name
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN users u ON m.sender_id = u.id
      WHERE c.user_id = ? OR c.technician_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `, [userId, userId, limit]);

    return rows;
  }
}

module.exports = MessageService;