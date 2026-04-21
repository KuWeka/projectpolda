#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${API_IMAGE:-}" ]]; then
  echo "API_IMAGE is required. Example: ghcr.io/org/helpdesk-backend:sha-abcdef1"
  exit 1
fi

COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.staging.yml)
STATE_DIR=".deploy"
CURRENT_TAG_FILE="$STATE_DIR/current_image"
PREVIOUS_TAG_FILE="$STATE_DIR/previous_image"

mkdir -p "$STATE_DIR"

if [[ -f "$CURRENT_TAG_FILE" ]]; then
  cp "$CURRENT_TAG_FILE" "$PREVIOUS_TAG_FILE"
fi

echo "$API_IMAGE" > "$CURRENT_TAG_FILE"

echo "Pulling API image: $API_IMAGE"
docker compose "${COMPOSE_FILES[@]}" pull api

echo "Deploying API service"
docker compose "${COMPOSE_FILES[@]}" up -d --remove-orphans api

echo "Running migration"
docker compose "${COMPOSE_FILES[@]}" exec -T api node scripts/migrate.js

echo "Running smoke test"
docker compose "${COMPOSE_FILES[@]}" exec -T -e SMOKE_BASE_URL=http://localhost:3001/api -e SMOKE_INCLUDE_READY=true api node scripts/smoke-test.js

echo "Deployment completed successfully."
