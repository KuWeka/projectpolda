#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'helpdesk_db';

const schemaPath = path.resolve(__dirname, '..', 'sql', 'schema.sql');
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
const logsPath = path.resolve(__dirname, '..', 'logs');

function splitSqlStatements(content) {
  return content
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function ensureDatabase(connection) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
}

async function applySchema(connection, schemaSql) {
  const statements = splitSqlStatements(schemaSql);

  for (const statement of statements) {
    // The schema file contains explicit CREATE/USE for helpdesk_db; ignore USE and normalize DB name.
    if (/^USE\s+/i.test(statement)) {
      continue;
    }

    if (/^CREATE\s+DATABASE\s+/i.test(statement)) {
      continue;
    }

    await connection.query(statement);
  }
}

async function main() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('==========================================');
  console.log('Helpdesk IT - Database Setup (Node)');
  console.log('==========================================');
  console.log(`Host: ${dbHost}`);
  console.log(`Port: ${dbPort}`);
  console.log(`User: ${dbUser}`);
  console.log(`Database: ${dbName}`);

  const adminConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    multipleStatements: false,
  });

  try {
    await adminConnection.query('SELECT 1');
    console.log('Database connection successful');

    await ensureDatabase(adminConnection);
    console.log('Database ensured');
  } finally {
    await adminConnection.end();
  }

  const dbConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    multipleStatements: false,
  });

  try {
    await applySchema(dbConnection, schemaSql);
    console.log('Schema migration completed');
  } finally {
    await dbConnection.end();
  }

  fs.mkdirSync(uploadsPath, { recursive: true });
  fs.mkdirSync(logsPath, { recursive: true });
  console.log('Directories ensured: uploads, logs');

  console.log('==========================================');
  console.log('Setup completed successfully');
  console.log('==========================================');
}

main().catch((error) => {
  console.error('Database setup failed:', error && error.message ? error.message : error);
  if (error && error.code) {
    console.error('Error code:', error.code);
  }
  process.exit(1);
});
