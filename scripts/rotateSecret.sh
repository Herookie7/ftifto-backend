#!/usr/bin/env bash
# USAGE: SECRET_KEY=JWT_SECRET NEW_VALUE="$(openssl rand -base64 32)" PLATFORM=render RENDER_SERVICE_ID=svc-123 RENDER_API_TOKEN=token DRY_RUN=false ./scripts/rotateSecret.sh
# Requires: For Render -> RENDER_SERVICE_ID, RENDER_API_TOKEN. For Railway -> RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT_ID, RAILWAY_SERVICE_ID, RAILWAY_TOKEN.
# Example: SECRET_KEY=JWT_SECRET NEW_VALUE="super-secret" PLATFORM=railway RAILWAY_PROJECT_ID=proj RAILWAY_ENVIRONMENT_ID=env RAILWAY_SERVICE_ID=svc RAILWAY_TOKEN=token ./scripts/rotateSecret.sh

set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to rotate secrets."
  exit 1
fi

PLATFORM="${PLATFORM:-render}"
DRY_RUN="${DRY_RUN:-true}"
HAS_JQ=0
if command -v jq >/dev/null 2>&1; then
  HAS_JQ=1
fi

require_env() {
  local env_var="$1"
  if [[ -z "${!env_var:-}" ]]; then
    echo "Missing required environment variable: $env_var"
    exit 1
  fi
}

require_env "SECRET_KEY"
require_env "NEW_VALUE"

log_step() {
  echo ""
  echo "==> $1"
}

rotate_render() {
  require_env "RENDER_SERVICE_ID"
  require_env "RENDER_API_TOKEN"

  local json_payload
  json_payload=$(printf '[{"key":"%s","value":"%s"}]' "$SECRET_KEY" "$NEW_VALUE")

  log_step "Updating $SECRET_KEY for Render service $RENDER_SERVICE_ID"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: curl -X PATCH \"https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars\" \\"
    echo "  -H \"Authorization: Bearer ****\" -H \"Content-Type: application/json\" \\"
    echo "  -d '$json_payload'"
  elif [[ "$HAS_JQ" -eq 1 ]]; then
    curl -sS -X PATCH "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars" \
      -H "Authorization: Bearer ${RENDER_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$json_payload" | jq '.'
  else
    curl -sS -X PATCH "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars" \
      -H "Authorization: Bearer ${RENDER_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$json_payload"
  fi

  log_step "Triggering a deploy to apply the new secret"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: curl -X POST \"https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys\" \\"
    echo "  -H \"Authorization: Bearer ****\" -H \"Content-Type: application/json\" -d '{\"clearCache\":false}'"
  elif [[ "$HAS_JQ" -eq 1 ]]; then
    curl -sS -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
      -H "Authorization: Bearer ${RENDER_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"clearCache":false}' | jq '.'
  else
    curl -sS -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
      -H "Authorization: Bearer ${RENDER_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"clearCache":false}'
  fi
}

rotate_railway() {
  require_env "RAILWAY_PROJECT_ID"
  require_env "RAILWAY_ENVIRONMENT_ID"
  require_env "RAILWAY_SERVICE_ID"
  require_env "RAILWAY_TOKEN"

  if [[ "$HAS_JQ" -eq 0 ]]; then
    echo "jq is required for Railway rotations. Install it or set DRY_RUN=true to inspect the payload."
    exit 1
  fi

  local graphql payload
  graphql=$(cat <<'GRAPHQL'
mutation UpsertVariable($projectId: String!, $environmentId: String!, $serviceId: String!, $key: String!, $value: String!) {
  environmentVariablesUpsert(
    projectId: $projectId,
    environmentId: $environmentId,
    serviceId: $serviceId,
    variables: [{name: $key, value: $value}]
  ) {
    id
    name
  }
}
GRAPHQL
)

  payload=$(jq -n \
    --arg projectId "$RAILWAY_PROJECT_ID" \
    --arg environmentId "$RAILWAY_ENVIRONMENT_ID" \
    --arg serviceId "$RAILWAY_SERVICE_ID" \
    --arg key "$SECRET_KEY" \
    --arg value "$NEW_VALUE" \
    --arg query "$graphql" \
    '{query: $query, variables: {projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId, key: $key, value: $value}}')

  log_step "Updating $SECRET_KEY for Railway service $RAILWAY_SERVICE_ID"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: curl -X POST https://backboard.railway.app/graphql/v2 \\"
    echo "  -H \"Authorization: Bearer ****\" -H \"Content-Type: application/json\" \\"
    echo "  -d '$payload'"
  else
    curl -sS -X POST "https://backboard.railway.app/graphql/v2" \
      -H "Authorization: Bearer ${RAILWAY_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$payload" | jq '.'
  fi
}

case "$PLATFORM" in
  render)
    rotate_render
    ;;
  railway)
    rotate_railway
    ;;
  *)
    echo "Unsupported PLATFORM '$PLATFORM'. Supported values: render, railway."
    exit 1
    ;;
esac

log_step "Rotation script complete. Monitor application logs and revoke the previous secret if applicable."

