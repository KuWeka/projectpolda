#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'helpdesk_db';

const indexMigrations = [
  {
    table: 'chats',
    index: 'idx_chats_user_id',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_user_id (user_id)'
  },
  {
    table: 'chats',
    index: 'idx_chats_technician_id',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_technician_id (technician_id)'
  },
  {
    table: 'chats',
    index: 'idx_chats_ticket_id',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_ticket_id (ticket_id)'
  },
  {
    table: 'chats',
    index: 'idx_chats_updated_at',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_updated_at (updated_at)'
  },
  {
    table: 'users',
    index: 'idx_users_role_is_active',
    sql: 'ALTER TABLE users ADD INDEX idx_users_role_is_active (role, is_active)'
  },
  {
    table: 'tickets',
    index: 'idx_tickets_status_created_at',
    sql: 'ALTER TABLE tickets ADD INDEX idx_tickets_status_created_at (status, created_at)'
  },
  {
    table: 'tickets',
    index: 'idx_tickets_status_closed_at',
    sql: 'ALTER TABLE tickets ADD INDEX idx_tickets_status_closed_at (status, closed_at)'
  },
  {
    table: 'messages',
    index: 'idx_messages_chat_id_created_at',
    sql: 'ALTER TABLE messages ADD INDEX idx_messages_chat_id_created_at (chat_id, created_at)'
  },
  {
    table: 'messages',
    index: 'idx_messages_sender_id',
    sql: 'ALTER TABLE messages ADD INDEX idx_messages_sender_id (sender_id)'
  },
  {
    table: 'messages',
    index: 'idx_messages_created_at',
    sql: 'ALTER TABLE messages ADD INDEX idx_messages_created_at (created_at)'
  },
];

async function addIndexIfMissing(connection, migration) {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      LIMIT 1
    `,
    [migration.table, migration.index]
  );

  if (rows.length > 0) {
    console.log(`- Skipping ${migration.index} (already exists)`);
    return;
  }

  await connection.query(migration.sql);
  console.log(`- Added ${migration.index}`);
}

async function main() {
  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    console.log(`Applying index migrations on ${dbHost}:${dbPort}/${dbName}...`);

    for (const migration of indexMigrations) {
      await addIndexIfMissing(connection, migration);
    }

    console.log('All index migrations completed successfully.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Migration error:', error && error.message ? error.message : error);
  if (error && error.code) {
    console.error('Error code:', error.code);
  }
  if (error && error.sqlMessage) {
    console.error('SQL message:', error.sqlMessage);
  }
  if (error && error.sqlState) {
    console.error('SQL state:', error.sqlState);
  }
  if (error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
