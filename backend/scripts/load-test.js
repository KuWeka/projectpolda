#!/usr/bin/env node

const autocannon = require('autocannon');

const url = process.env.LOAD_TEST_URL || 'http://localhost:3001/api/health/live';
const connections = Number(process.env.LOAD_TEST_CONNECTIONS || 20);
const duration = Number(process.env.LOAD_TEST_DURATION || 20);
const pipelining = Number(process.env.LOAD_TEST_PIPELINING || 1);
const method = process.env.LOAD_TEST_METHOD || 'GET';

console.log('Running load test with settings:');
console.log(JSON.stringify({ url, method, connections, duration, pipelining }, null, 2));

const instance = autocannon({
  url,
  method,
  connections,
  duration,
  pipelining,
});

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', (result) => {
  const summary = {
    url,
    requests: result.requests,
    latency: result.latency,
    throughput: result.throughput,
    non2xx: result.non2xx,
    errors: result.errors,
    timeouts: result.timeouts,
  };

  console.log('\nLoad test summary:\n');
  console.log(JSON.stringify(summary, null, 2));

  if (result.errors > 0 || result.timeouts > 0) {
    process.exitCode = 1;
  }
});
