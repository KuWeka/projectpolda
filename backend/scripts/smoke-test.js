#!/usr/bin/env node

const DEFAULT_BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3001/api';
const INCLUDE_READY = String(process.env.SMOKE_INCLUDE_READY || 'false').toLowerCase() === 'true';
const REQUEST_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 10000);

const endpoints = [
  { path: '/health/live', expectedStatus: 200 },
  { path: '/health/metrics', expectedStatus: 200 },
];

if (INCLUDE_READY) {
  endpoints.push({ path: '/health/ready', expectedStatus: 200 });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function run() {
  console.log(`Running smoke test against ${DEFAULT_BASE_URL}`);

  for (const endpoint of endpoints) {
    const url = `${DEFAULT_BASE_URL}${endpoint.path}`;
    const response = await fetchWithTimeout(url, { method: 'GET' });

    if (response.status !== endpoint.expectedStatus) {
      const body = await response.text();
      throw new Error(`Smoke test failed for ${endpoint.path}: expected ${endpoint.expectedStatus}, got ${response.status}. Body: ${body}`);
    }

    if (endpoint.path === '/health/metrics') {
      const metricsBody = await response.text();
      if (!metricsBody.includes('helpdesk_http_requests_total')) {
        throw new Error('Metrics endpoint responded without expected metric helpdesk_http_requests_total');
      }
    }

    console.log(`OK ${endpoint.path} -> ${response.status}`);
  }

  console.log('Smoke test passed.');
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
