#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '3306';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'helpdesk_db';
const dumpCmd = process.env.DB_DUMP_CMD || 'mysqldump';

const backupsDir = path.resolve(__dirname, '../backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupsDir, `${dbName}-${timestamp}.sql`);

const args = [
  `-h${dbHost}`,
  `-P${dbPort}`,
  `-u${dbUser}`,
  `-p${dbPassword}`,
  '--single-transaction',
  '--routines',
  '--triggers',
  dbName,
];

console.log(`Starting database backup for ${dbName}...`);
const out = fs.createWriteStream(backupFile, { encoding: 'utf8' });

const child = spawn(dumpCmd, args, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

child.stdout.pipe(out);

let stderr = '';
child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error('Backup failed.', stderr || `Exit code ${code}`);
    process.exit(code || 1);
  }

  const size = fs.statSync(backupFile).size;
  console.log(`Backup completed: ${backupFile}`);
  console.log(`Backup size: ${(size / 1024 / 1024).toFixed(2)} MB`);
});
