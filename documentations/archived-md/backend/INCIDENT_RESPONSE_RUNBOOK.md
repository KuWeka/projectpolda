# Incident Response Runbook

## Severity Levels

1. Sev-1
- Full outage, critical business impact

2. Sev-2
- Partial outage, degraded core functionality

3. Sev-3
- Non-critical defects with workaround

## Immediate Triage (first 10 minutes)

1. Confirm impact
- run smoke test: npm run smoke:test
- run synthetic test: npm run ops:synthetic

2. Validate infrastructure
- check /api/health/live and /api/health/metrics
- check mysql and redis container health

3. Check last deployment
- inspect latest CI run and deployed image tag

## Mitigation

1. Rollback deployment
- run: bash scripts/rollback-staging.sh

2. Clear cache if stale behavior suspected
- run: npm run cache:clear

3. Restore database from backup if data corruption confirmed
- run: bash scripts/restore-db.sh backups/<file>.sql

## Communication

1. Open incident channel
2. Publish impact summary every 15 minutes
3. Publish resolution and postmortem within 24 hours

## Post-Incident Checklist

1. Capture root cause and timeline
2. Add regression tests
3. Update runbook and alerts
4. Track follow-up action items
