#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

function mustExist(relPath, base = backendRoot) {
  const target = path.resolve(base, relPath);
  if (!fs.existsSync(target)) {
    throw new Error(`Missing required file: ${path.relative(repoRoot, target)}`);
  }
}

function mustContain(filePath, text) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(text)) {
    throw new Error(`File ${path.relative(repoRoot, filePath)} does not contain expected text: ${text}`);
  }
}

function run() {
  mustExist('PHASE_7_GUIDE.md');
  mustExist('SUPPLY_CHAIN_SECURITY.md');
  mustExist('scripts/generate-sbom-lite.js');
  mustExist('scripts/supply-chain-readiness.js');

  mustExist('.github/workflows/backend-supply-chain.yml', repoRoot);

  const pkg = path.resolve(backendRoot, 'package.json');
  mustContain(pkg, '"security:sbom"');
  mustContain(pkg, '"phase7:readiness"');

  const dockerIgnore = path.resolve(backendRoot, '.dockerignore');
  mustContain(dockerIgnore, 'backups/');
  mustContain(dockerIgnore, '*.sarif');

  console.log('Supply-chain readiness checks passed.');
}

try {
  run();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
