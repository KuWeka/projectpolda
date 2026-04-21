-- Idempotent migration: add performance indexes for chats and messages on existing databases

DELIMITER //

DROP PROCEDURE IF EXISTS add_index_if_missing //
CREATE PROCEDURE add_index_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND index_name = p_index_name
  ) THEN
    SET @stmt = p_alter_sql;
    PREPARE sql_stmt FROM @stmt;
    EXECUTE sql_stmt;
    DEALLOCATE PREPARE sql_stmt;
  END IF;
END //

DELIMITER ;

CALL add_index_if_missing('chats', 'idx_chats_user_id', 'ALTER TABLE chats ADD INDEX idx_chats_user_id (user_id)');
CALL add_index_if_missing('chats', 'idx_chats_technician_id', 'ALTER TABLE chats ADD INDEX idx_chats_technician_id (technician_id)');
CALL add_index_if_missing('chats', 'idx_chats_ticket_id', 'ALTER TABLE chats ADD INDEX idx_chats_ticket_id (ticket_id)');
CALL add_index_if_missing('chats', 'idx_chats_updated_at', 'ALTER TABLE chats ADD INDEX idx_chats_updated_at (updated_at)');

CALL add_index_if_missing('users', 'idx_users_role_is_active', 'ALTER TABLE users ADD INDEX idx_users_role_is_active (role, is_active)');

CALL add_index_if_missing('tickets', 'idx_tickets_status_created_at', 'ALTER TABLE tickets ADD INDEX idx_tickets_status_created_at (status, created_at)');
CALL add_index_if_missing('tickets', 'idx_tickets_status_closed_at', 'ALTER TABLE tickets ADD INDEX idx_tickets_status_closed_at (status, closed_at)');

CALL add_index_if_missing('messages', 'idx_messages_chat_id_created_at', 'ALTER TABLE messages ADD INDEX idx_messages_chat_id_created_at (chat_id, created_at)');
CALL add_index_if_missing('messages', 'idx_messages_sender_id', 'ALTER TABLE messages ADD INDEX idx_messages_sender_id (sender_id)');
CALL add_index_if_missing('messages', 'idx_messages_created_at', 'ALTER TABLE messages ADD INDEX idx_messages_created_at (created_at)');

DROP PROCEDURE IF EXISTS add_index_if_missing;
