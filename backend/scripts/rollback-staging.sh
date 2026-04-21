#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.staging.yml)
PREVIOUS_TAG_FILE=".deploy/previous_image"
CURRENT_TAG_FILE=".deploy/current_image"

if [[ ! -f "$PREVIOUS_TAG_FILE" ]]; then
  echo "No previous image recorded. Cannot rollback."
  exit 1
fi

API_IMAGE="$(cat "$PREVIOUS_TAG_FILE")"
if [[ -z "$API_IMAGE" ]]; then
  echo "Previous image tag is empty. Cannot rollback."
  exit 1
fi

echo "Rolling back to $API_IMAGE"
export API_IMAGE

docker compose "${COMPOSE_FILES[@]}" pull api
docker compose "${COMPOSE_FILES[@]}" up -d --remove-orphans api

docker compose "${COMPOSE_FILES[@]}" exec -T -e SMOKE_BASE_URL=http://localhost:3001/api -e SMOKE_INCLUDE_READY=true api node scripts/smoke-test.js

echo "$API_IMAGE" > "$CURRENT_TAG_FILE"
echo "Rollback completed successfully."
