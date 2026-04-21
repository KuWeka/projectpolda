#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const lockPath = path.join(root, 'package-lock.json');
const outputDir = path.join(root, 'artifacts');
const outputPath = path.join(outputDir, 'sbom-lite.cdx.json');

if (!fs.existsSync(lockPath)) {
  console.error('package-lock.json not found.');
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const packages = lock.packages || {};

const components = Object.entries(packages)
  .filter(([name]) => name && name !== '')
  .map(([name, info]) => ({
    type: 'library',
    name: name.replace(/^node_modules\//, ''),
    version: info.version || 'unknown',
    purl: info.version ? `pkg:npm/${name.replace(/^node_modules\//, '')}@${info.version}` : undefined,
  }));

const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [{ name: 'sbom-lite-generator', version: '1.0.0' }],
    component: {
      type: 'application',
      name: 'helpdesk-backend',
      version: require(path.join(root, 'package.json')).version,
    },
  },
  components,
};

fs.writeFileSync(outputPath, JSON.stringify(sbom, null, 2));
console.log(`SBOM generated at ${outputPath}`);
