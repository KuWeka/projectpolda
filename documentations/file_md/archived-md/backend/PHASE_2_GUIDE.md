Tanggal: 2026-04-17


Phase 2 focuses on making releases repeatable and low-risk through automated deployment, smoke verification, and rollback controls.

## Goals

- Automated image build and publish for backend
- Automated staging deployment from CI
- Post-deploy smoke test verification
- One-command rollback path
- Operational runbook and environment template

---

## Delivered Components

- CI/CD workflow with image build + GHCR push + staging deploy: `/.github/workflows/backend-ci.yml`
- Staging compose override: `backend/docker-compose.staging.yml`
- Smoke test script: `backend/scripts/smoke-test.js`
- Deploy script: `backend/scripts/deploy-staging.sh`
- Rollback script: `backend/scripts/rollback-staging.sh`
- DB backup script from phase 1 retained for release safety: `backend/scripts/backup-db.js`

---

## Required Repository Secrets

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`
- `DEPLOY_PATH` (example: `/opt/helpdesk-backend`)
- `SLACK_WEBHOOK_URL` (optional)

---

## Deployment Flow

1. Push to `main`
2. CI runs lint and unit tests
3. CI builds backend production image and pushes to GHCR
4. CI SSH deploys to staging server
5. Staging runs migration + smoke test
6. If smoke test fails, use rollback script to restore previous image

---

## Manual Operations

### Deploy current image

```bash
export API_IMAGE=ghcr.io/<owner>/helpdesk-backend:sha-<commit>
bash scripts/deploy-staging.sh
```

### Rollback to previous image

```bash
bash scripts/rollback-staging.sh
```

### Local smoke test

```bash
node scripts/smoke-test.js
```

---

## Phase 2 Checklist

- [x] Build and publish backend image in CI
- [x] Automated deploy to staging via SSH
- [x] Smoke test gate after deployment
- [x] Rollback script with previous image tracking
- [x] Staging compose override with runtime env
- [x] Operational documentation

---

**Status**: Phase 2 implementation completed.

**Last Updated**: April 18, 2026



