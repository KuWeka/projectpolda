# Release Governance

## Release Policy

1. All releases must pass:
- lint
- unit tests
- production dependency audit
- release readiness checks
- smoke/synthetic checks in staging

2. Release versioning:
- Semantic version format `major.minor.patch`
- Increment rule:
  - patch: fixes only
  - minor: backward-compatible feature
  - major: breaking change

## Required Runtime Metadata

- `APP_VERSION`
- `GIT_SHA`
- `NODE_ENV`

Runtime metadata is exposed on `GET /api/health/version`.

## Rollback Policy

- Use `bash scripts/rollback-staging.sh` for staging rollback.
- Production rollback follows the same image pinning pattern.

## Security Governance

- Weekly Dependabot updates for npm and GitHub Actions
- Scheduled `npm audit --omit=dev --audit-level=high`

## Evidence Artifacts

- CI logs from workflows:
  - backend-ci
  - backend-ops
  - backend-release-governance
- Baseline performance report in `PERFORMANCE_BASELINE.md`
- Incident handling in `INCIDENT_RESPONSE_RUNBOOK.md`
