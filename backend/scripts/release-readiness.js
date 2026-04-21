#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const requiredFileGroups = [
  ['PHASE_3_GUIDE.md', 'documentations/archived-md/backend/PHASE_3_GUIDE.md'],
  ['PHASE_4_GUIDE.md', 'documentations/archived-md/backend/PHASE_4_GUIDE.md'],
  ['PHASE_5_GUIDE.md', 'documentations/archived-md/backend/PHASE_5_GUIDE.md'],
  ['src/routes/health.js'],
  ['scripts/smoke-test.js'],
  ['scripts/synthetic-check.js'],
  ['scripts/deploy-staging.sh'],
  ['scripts/rollback-staging.sh'],
  ['scripts/backup-db.js'],
  ['scripts/restore-db.sh'],
];

const requiredWorkflows = [
  '.github/workflows/backend-ci.yml',
  '.github/workflows/backend-ops.yml',
  '.github/workflows/backend-release-governance.yml',
];

const requiredEnvKeys = [
  'APP_VERSION',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
];

function exists(relPath) {
  return fs.existsSync(path.resolve(root, '..', relPath)) || fs.existsSync(path.resolve(root, relPath));
}

function checkFiles() {
  const missing = requiredFileGroups
    .filter((alternatives) => !alternatives.some((candidate) => exists(`backend/${candidate}`) || exists(candidate)))
    .map((alternatives) => alternatives.join(' OR '));

  if (missing.length) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }
}

function checkWorkflows() {
  const missing = requiredWorkflows.filter((f) => !exists(f));
  if (missing.length) {
    throw new Error(`Missing required workflows: ${missing.join(', ')}`);
  }
}

function checkEnvTemplate() {
  const envExamplePath = path.resolve(root, '.env.example');
  const content = fs.readFileSync(envExamplePath, 'utf8');

  const missingKeys = requiredEnvKeys.filter((key) => !new RegExp(`^${key}=`, 'm').test(content));
  if (missingKeys.length) {
    throw new Error(`Missing required .env.example keys: ${missingKeys.join(', ')}`);
  }
}

function checkPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(root, 'package.json'), 'utf8'));
  const semverLike = /^\d+\.\d+\.\d+$/;
  if (!semverLike.test(pkg.version)) {
    throw new Error(`Invalid package.json version format: ${pkg.version}`);
  }
}

function run() {
  checkFiles();
  checkWorkflows();
  checkEnvTemplate();
  checkPackageVersion();
  console.log('Release readiness checks passed.');
}

try {
  run();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
