# Security & Data Protection Guide

This document tracks operational controls for the ftifto-backend service. It pairs with the automation in `scripts/` and the GitHub Actions workflows to keep data safe, auditable, and recoverable.

## Secrets Management & Rotation

- **Primary source of truth**: runtime secrets live in Render/Railway environment variables or the platform key vault. `.env` files are for local development only.
- **Rotation cadence**: rotate high-impact secrets (JWT signing keys, database user passwords, webhook secrets) at least quarterly or immediately after an incident.
- **Automated rotation helper**: use `scripts/rotateSecret.sh` to update secrets through the Render (`PLATFORM=render`) or Railway (`PLATFORM=railway`) APIs.
  1. Generate the replacement value (`openssl rand -base64 48` for JWTs).
  2. Export the required environment variables (`SECRET_KEY`, `NEW_VALUE`, provider-specific IDs/tokens).
  3. Run the script with `DRY_RUN=true` to review the payload, then execute with `DRY_RUN=false`.
  4. The script triggers a deploy so the new value reaches all instances; monitor logs for successful boot.
  5. Revoke or archive the previous credential (e.g., drop old DB user).
- **External vaults**: set `USE_SECRETS_MANAGER=true` to hydrate secrets from AWS Secrets Manager or HashiCorp Vault before the app boots.
  - Configure the provider with:
    - `SECRETS_PROVIDER=aws` and `AWS_SECRETS_IDS=app/prod/backend,app/prod/jwt`.
    - or `SECRETS_PROVIDER=vault`, `VAULT_ADDR=https://vault.example.com`, `VAULT_TOKEN=...`, `VAULT_SECRETS_PATHS=kv/data/ftifto/backend`.
  - Secrets must be stored as JSON `{ "JWT_SECRET": "...", "MONGODB_URI": "..." }`. The loader only fills keys that are missing from `process.env`.
- **Audit trail**: document each rotation in the change log, capturing who triggered it, scope, and time.

## Backup, Restore & Verification

- **Daily S3 exports**: the `Mongo Backups` workflow (`.github/workflows/backup.yml`) runs `node scripts/backupMongo.js` nightly to create a compressed NDJSON archive in the configured S3 bucket.
- **Manual runs**: `npm run backup:create` uploads an immediate snapshot. Set `BACKUP_PREFIX` to segment ad-hoc backups.
- **Verification**: `npm run backup:verify` restores the most recent backup (or a specific key) into an ephemeral database defined by `BACKUP_VERIFY_URI`, runs smoke checks, and drops the database afterward. Always verify after changing schemas or backup settings.
- **Retention**: override `BACKUP_RETENTION` (default 7) to keep additional history. The script deletes extras after a successful upload.
- **Restore drill**: to restore production data locally, run `npm run backup:restore -- <s3/key.zip> mongodb://localhost:27017/tifto-restore`. Confirm indexes with `npm run migrate:list` and run migrations as needed.

## Maintenance & Read-Only Operations

- Toggle maintenance mode via `POST /api/v1/admin/maintenance` (admin JWT required). Payload shape:
  ```json
  { "enabled": true, "readOnly": true, "message": "Upgrading MongoDB cluster" }
  ```
- When `readOnly` is `true`, GET/HEAD/OPTIONS requests stay available and all write verbs return HTTP 503 with `{ "status": "maintenance" }`.
- Set `MAINTENANCE_READ_ONLY=false` to block every endpoint during maintenance windows.
- The flag lives in Redis under `ftifto:maintenance`, so multi-instance deployments stay in sync.

## Audit Logging & Retention

- The `auditLogger` service appends JSON lines to `logs/audit/YYYY-MM-DD.jsonl`. Events include authentication, order status changes, payment lifecycle, privacy requests, and admin maintenance toggles.
- Files older than 24 hours are compressed and pushed to S3 via `scripts/rollupAuditLogs.js`; the scheduled workflow `.github/workflows/audit-rollup.yml` runs this daily.
- Retain compressed archives for at least 90 days (configurable per S3 lifecycle rules). Coordinate deletion with legal/compliance before expiring artifacts.
- When investigating incidents, fetch the relevant `.jsonl.gz` object from S3, decompress locally (`gunzip file.jsonl.gz`), and load into your preferred SIEM to pivot across timestamps and user IDs.

## GDPR & CCPA Considerations

- **Right to Access / Portability**: provide users a JSON export of their account, orders, and linked payment identifiers on request. Automate through future reporting endpoints.
- **Right to Erasure**: honor deletion requests via `POST /api/v1/privacy/request-deletion` (see privacy API). Once approved, anonymize data while keeping operational metrics intact.
- **Legal hold**: block deletion when records are tied to disputes or chargebacks; log the exemption reason.
- **Data minimization**: ensure optional fields (marketing preferences, addresses) have retention limits. Default to 365 days for dormant accounts unless legal requirements differ.
- **Audit trail**: log rationales for granted/denied requests in the `dataRetention` service (added below) and store CSV audits in S3 for controllers.

## Incident Readiness Checklist

1. **Secret compromise**
   - Rotate affected secrets with `scripts/rotateSecret.sh`.
   - Redeploy the backend, confirm Sentry/Grafana are receiving events.
   - Invalidate downstream tokens (e.g., JWTs) by rolling `JWT_SECRET`.
2. **Data corruption**
   - Switch API to maintenance read-only mode.
   - Restore the latest verified backup with `npm run backup:restore`.
   - Replay migrations (`npm run migrate:up`) and smoke-test critical flows.
3. **P0 vulnerability disclosure**
   - Run `npm run audit` and patch with `npm run audit:fix`.
   - Enable the security scan workflow manually via `workflow_dispatch` if additional validation is required.
   - Document mitigation and request Dependabot to open upstream update PRs if necessary.

## Continuous Compliance

- Weekly compliance checks run via `.github/workflows/compliance-audit.yml`, executing `scripts/auditSecrets.js` to ensure required secrets are present and rotations are within policy thresholds. The summary is posted to Slack/Discord when webhooks are configured.
- Run `npm run compliance` locally before major releases to confirm the same status that CI will enforce.

Keep this document current whenever you add new secrets, adjust retention policies, or modify the automation hooks described above.


