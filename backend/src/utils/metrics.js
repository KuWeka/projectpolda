const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'helpdesk_' });

const httpRequestDurationMs = new client.Histogram({
  name: 'helpdesk_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 25, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'helpdesk_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const cacheHitTotal = new client.Counter({
  name: 'helpdesk_cache_hit_total',
  help: 'Total cache hits',
  labelNames: ['keyspace'],
  registers: [register],
});

const cacheMissTotal = new client.Counter({
  name: 'helpdesk_cache_miss_total',
  help: 'Total cache misses',
  labelNames: ['keyspace'],
  registers: [register],
});

function extractRoute(req) {
  if (req.route && req.route.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }
  return req.path || 'unknown';
}

function observeRequest(req, res, durationMs) {
  const route = extractRoute(req);
  const labels = {
    method: req.method,
    route,
    status_code: String(res.statusCode),
  };

  httpRequestsTotal.inc(labels);
  httpRequestDurationMs.observe(labels, durationMs);
}

function metricsMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const endedAt = process.hrtime.bigint();
    const durationMs = Number(endedAt - startedAt) / 1e6;
    observeRequest(req, res, durationMs);
  });
  next();
}

function markCacheHit(keyspace = 'default') {
  cacheHitTotal.inc({ keyspace });
}

function markCacheMiss(keyspace = 'default') {
  cacheMissTotal.inc({ keyspace });
}

async function getMetricsText() {
  return register.metrics();
}

module.exports = {
  register,
  metricsMiddleware,
  markCacheHit,
  markCacheMiss,
  getMetricsText,
};
