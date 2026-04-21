#!/usr/bin/env node

const { cache } = require('../src/utils/cache');

async function main() {
  await cache.connect();

  if (!cache.isConnected) {
    console.log('Redis not connected, nothing to clear.');
    process.exit(0);
  }

  const deleted = await cache.delByPattern('*');
  console.log(`Cleared ${deleted} cache key(s).`);

  await cache.disconnect();
}

main().catch((error) => {
  console.error('Cache clear failed:', error.message);
  process.exit(1);
});
