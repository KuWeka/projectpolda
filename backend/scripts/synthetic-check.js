#!/usr/bin/env node

const baseUrl = process.env.STAGING_BASE_URL || process.env.SMOKE_BASE_URL || 'http://localhost:3001';
const timeoutMs = Number(process.env.SYNTHETIC_TIMEOUT_MS || 10000);

const targets = [
  { path: '/api/health/live', expectedStatus: 200 },
  { path: '/api/health/metrics', expectedStatus: 200, assertText: 'helpdesk_http_requests_total' },
  { path: '/api/health/version', expectedStatus: 200, assertJsonKeys: ['success', 'data'] },
];

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

(async () => {
  console.log(`Running synthetic checks against ${baseUrl}`);

  for (const target of targets) {
    const url = `${baseUrl}${target.path}`;
    const response = await fetchWithTimeout(url, timeoutMs);

    if (response.status !== target.expectedStatus) {
      const body = await response.text();
      throw new Error(`Unexpected status for ${target.path}: ${response.status}. Body: ${body}`);
    }

    if (target.assertText) {
      const text = await response.text();
      if (!text.includes(target.assertText)) {
        throw new Error(`Response for ${target.path} does not contain expected text: ${target.assertText}`);
      }
    }

    if (target.assertJsonKeys) {
      const json = await response.json();
      for (const key of target.assertJsonKeys) {
        if (!(key in json)) {
          throw new Error(`Response for ${target.path} missing expected JSON key: ${key}`);
        }
      }
    }

    console.log(`OK ${target.path} -> ${response.status}`);
  }

  console.log('Synthetic checks passed.');
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
