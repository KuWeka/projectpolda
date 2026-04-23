Tanggal: 2026-04-17


## Tooling
- Load tool: `autocannon`
- Command: `npm run load:test`
- Default target: `http://localhost:3001/api/health/live`
- Default profile: 20 connections, 20 seconds

## Latest Baseline (April 18, 2026)
- Status: Completed
- Target: /api/health/live
- Profile: 20 connections, 20 seconds
- Average requests/sec: 1177.3
- p95 latency: 33 ms
- p99 latency: 57 ms
- Throughput avg: 890035 bytes/sec
- Total requests: 23546
- Error rate: 0%
- Timeouts: 0

## Metrics to Track
- Requests/sec
- p50, p95, p99 latency
- Throughput (bytes/sec)
- Non-2xx responses
- Errors and timeouts

## Optimization Checklist
- Keep p95 latency under 1000ms for core endpoints
- Keep error rate < 1%
- Use dashboard caching for summary endpoints
- Keep DB indexes aligned with filtering and sorting patterns

## Reporting Template

| Endpoint | Concurrency | Duration | Req/sec | p95 (ms) | Error Rate |
|---|---:|---:|---:|---:|---:|
| /api/health/live | 20 | 20s | 1177.3 | 33 | 0% |
| /api/dashboard/admin-summary | 20 | 20s | TBD | TBD | TBD |
| /api/tickets | 20 | 20s | TBD | TBD | TBD |

