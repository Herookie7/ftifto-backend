# ftifto-backend

Unified Node.js REST API that powers all Tifto applications (`tifto-admin`, `tifto-customer-app`, `tifto-customer-web`, `tifto-seller-app`, `tifto-rider-app`). The service wraps core platform entities (users, restaurants, products, and orders) with role-aware workflows for admins, sellers, riders, and customers.

## Monorepo Insights

During the audit of the existing applications, the following shared concepts surfaced:

- **Users & Roles:** All apps consume four primary roles (`customer`, `seller`, `rider`, `admin`). Each role uses JWT-authenticated sessions and relies on profile data (contact info, avatar, status flags). Mobile apps cache Firebase tokens for push messaging.
- **Restaurants & Menus:** Seller and admin apps manage restaurant metadata—order prefixes, delivery bounds, opening times, tax/commission, and availability toggles. Menus consist of products with variations, add-ons, and preparation times.
- **Orders & Logistics:** Orders include complex items, pricing breakdowns (delivery charges, taxation, tipping), timeline stamps (accepted, picked, delivered), rider assignment, and zone metadata. Active order feeds drive the seller dashboard and rider assignments.
- **Customer Experiences:** Customer apps focus on browsing restaurants/menus, address books, saved payment methods, and order history. They consume both REST and GraphQL endpoints for real-time updates.
- **Operational Dashboards:** The admin app surfaces KPIs (order counts, revenue, active restaurants), manages users, and controls restaurant onboarding/availability.

These insights shaped the REST resources and role-based routes in this backend scaffold.

## Tech Stack

- Node.js (>=18) & Express
- MongoDB via Mongoose
- JWT authentication with role-based guards
- Helmet, CORS, rate limiting, sanitizers (hpp, mongo-sanitize, xss-clean)
- Socket.IO for real-time collaboration
- Firebase Admin SDK for push notifications
- Swagger (swagger-jsdoc + swagger-ui-express) for OpenAPI docs
- Jest + Supertest + mongodb-memory-server for automated testing
- Docker & GitHub Actions for deployment automation

## Getting Started

```bash
cd ftifto-backend
npm install
cp .env.example .env
npm run dev
```

Populate the `.env` file with production values (MongoDB connection string, JWT secret, allowed origins, etc.).

## Local Dev Quickstart

```bash
cd ftifto-backend
npm install
npm run seed     # populate MongoDB with demo data
npm run dev      # start Express + Socket.IO with hot reload
npm run verify   # run health, version, docs, and DB verifications
```

The VSCode workspace (`.vscode/launch.json`) includes launch targets for each command and attaches ESLint defaults for consistent formatting.

## Environment Variables

| Variable                 | Description                                                                 |
| ------------------------ | --------------------------------------------------------------------------- |
| `PORT`                   | Port the API listens on (default `8001`)                                    |
| `MONGODB_URI` / `MONGO_URI` | MongoDB connection URI (Atlas `mongodb+srv://` or local URI)             |
| `JWT_SECRET`             | Secret key for signing JWTs                                                 |
| `TOKEN_EXPIRY`           | JWT expiry window (e.g. `7d`)                                               |
| `CORS_ORIGINS`           | Comma-separated list of allowed HTTP origins                                |
| `SOCKET_ALLOW_ORIGINS`   | Comma-separated list of Socket.IO origins (defaults to `CORS_ORIGINS`)      |
| `API_BASE_URL`           | Public REST base URL (`https://ftifto-backend.onrender.com/api`)            |
| `LOG_LEVEL`              | Morgan log format (auto `combined` in production)                           |
| `RATE_LIMIT_WINDOW_MS`   | Rate-limit window duration in ms (default 15 minutes)                       |
| `RATE_LIMIT_MAX`         | Max requests per IP per window                                              |
| `FCM_PROJECT_ID`         | Firebase project id for FCM push notifications                              |
| `FCM_CLIENT_EMAIL`       | Firebase service-account client email                                      |
| `FCM_PRIVATE_KEY`        | Base64-encoded Firebase private key (raw `\n` string also supported)        |
| `FCM_PRIVATE_KEY_BASE64` | Optional Base64-encoded private key override                                |
| `DOCS_ROUTE`             | Path to host Swagger UI (default `/docs`)                                   |
| `LOGTAIL_SOURCE_TOKEN`   | (Optional) Logtail/BetterStack source token for centralized logging         |
| `GA_MEASUREMENT_ID`      | (Optional) Google Analytics Measurement ID for backend analytics            |
| `GA_API_SECRET`          | (Optional) Google Analytics API secret                                      |
| `ENABLE_CLUSTER`         | Enable Node.js clustering (default `true`)                                  |
| `CLUSTER_WORKERS`        | Number of cluster workers (default = CPU cores)                             |
| `REDIS_URL`              | Redis connection string for Socket.IO scaling                               |
| `GRAFANA_PUSH_URL`       | Grafana Cloud/Prometheus remote write endpoint                              |
| `GRAFANA_API_KEY`        | Grafana API key for metrics pushes                                          |
| `SLACK_WEBHOOK_URL`      | Incoming Slack webhook for alerts                                           |
| `DISCORD_WEBHOOK_URL`    | Discord webhook for alerts                                                  |
| `GIT_COMMIT_SHA`         | (Optional) Commit hash exposed via `/api/version`                           |
| `SENTRY_DSN`             | (Optional) Sentry project DSN for error tracking                            |
| `SENTRY_TRACES_SAMPLE_RATE` | (Optional) Sampling rate (0–1) for Sentry tracing/profiling             |
| `AWS_S3_BUCKET`          | S3 bucket used for automated Mongo backups and retention reports            |
| `AWS_S3_REGION`          | AWS region for the S3 bucket (defaults to `us-east-1`)                      |
| `AWS_S3_ENDPOINT`        | (Optional) Custom S3-compatible endpoint (MinIO, Cloudflare R2, etc.)       |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credentials for S3 uploads                             |
| `BACKUP_PREFIX`          | Object key prefix for backups (default `backups/`)                          |
| `BACKUP_RETENTION`       | Number of latest backups to keep (default `7`)                              |
| `BACKUP_VERIFY_URI`      | Temporary Mongo URI used by `npm run backup:verify`                         |
| `MAINTENANCE_READ_ONLY`  | When `true`, GET/HEAD/OPTIONS remain available during maintenance           |
| `MAINTENANCE_MESSAGE`    | Custom message shown in maintenance responses                              |
| `MAINTENANCE_REDIS_KEY`  | Redis key for the multi-instance maintenance flag                          |
| `USE_SECRETS_MANAGER`    | Enable external secrets loading (`true`/`false`)                           |
| `SECRETS_PROVIDER`       | `aws` or `vault` to choose the external secrets backend                     |
| `AWS_SECRETS_IDS`        | Comma-separated AWS Secrets Manager ARNs/names containing JSON secrets      |
| `VAULT_ADDR` / `VAULT_TOKEN` | Base URL + token for HashiCorp Vault                                    |
| `VAULT_SECRETS_PATHS`    | Comma-separated Vault secret paths (KV v2 compatible)                       |
| `STRIPE_SECRET_KEY`      | Stripe API key for optional payments integration                            |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signing secret                                               |
| `OAUTH_REDIRECT_URI`     | Base redirect URI used by OAuth callback handlers                           |
| `OAUTH_GOOGLE_CLIENT_ID` / `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth credentials                    |
| `OAUTH_GITHUB_CLIENT_ID` / `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth credentials                    |
| `DATA_RETENTION_DAYS`    | Days of inactivity before anonymizing user data (default `365`)             |
| `DATA_RETENTION_S3_PREFIX` | Prefix for uploaded retention CSV reports (default `retention/`)         |

## Running Scripts

- `npm run dev` — start the API with Nodemon (development)
- `npm start` — start the API with Node (production)
- `npm run lint` — run ESLint using the provided config placeholder
- `npm test` — execute Jest unit/integration tests
- `npm run verify` — run deployment verification script against configured endpoints
- `npm run docs:build` — rebuild the static documentation portal served at `/portal`
- `npm run pre-release` — execute the production readiness checklist (env vars, Mongo/Redis/FCM, Swagger, smoke endpoints)
- `npm run migrate:list` / `npm run migrate:up` / `npm run migrate:down` — manage MongoDB schema/data migrations
- `npm run backup:create` — trigger an on-demand Mongo backup to S3
- `npm run backup:restore -- <s3-key> [targetUri]` — restore a backup into the target MongoDB instance
- `npm run backup:verify [s3-key]` — restore the latest (or provided) backup into a temp DB and run smoke checks
- `npm run retention:run` — anonymize dormant accounts and upload an audit report (supports `--dry-run`)
- `npm run audit` — run `npm audit --audit-level=high` locally to mirror the CI security scan
- `npm run audit:fix` — attempt to auto-apply high severity security patches
- `npm run compliance` — execute the secrets audit (`scripts/auditSecrets.js`) and print the compliance summary used by CI
- `npm run scale:check` — query Render/AWS APIs for plan tier, region, and utilization; warns when CPU or memory exceed 80%
- `npm run dr:run` — orchestrate disaster recovery (restore most recent backup, run migrations, health check, notify Slack)
- `npm run audit:rollup` — compress audit logs and upload to S3 (mirrors the scheduled roll-up workflow)
- `npm run metrics:export` — continuously archive Prometheus snapshots into `monitoring/exports/` (override cadence with `METRICS_EXPORT_INTERVAL_MS`)
- `npm run clean` — remove generated docs, coverage, logs, and metrics exports (helpful before packaging a release)

## MongoDB Migrations

- Migrations live in `src/migrations` and are versioned using timestamped filenames (`YYYYMMDD-description.js`).
- Run `npm run migrate:list` to inspect applied vs. pending migrations. The runner tracks state in `_migration_history` and uses a Redis-style lock collection to prevent concurrent execution.
- Apply new migrations with `npm run migrate:up` and roll back the latest with `npm run migrate:down`.
- Sample migration `20250101-create-indexes.js` creates recommended indexes on `orders`, `users`, and `products`.

## Compliance & Governance

- Weekly compliance audits (`.github/workflows/compliance-audit.yml`) execute `npm run compliance`, post summaries to Slack/Discord, and fail if any critical secret is missing or stale beyond policy thresholds.
- Audit trails are captured automatically via `src/services/auditLogger.js` (auth, orders, payments, privacy, admin toggles) and archived daily to S3 by `.github/workflows/audit-rollup.yml`.
- Privacy controls support both deletion and data portability exports (`/api/v1/privacy/request-...` endpoints). Retention anonymizes accounts older than `DATA_RETENTION_DAYS` and stores CSV audits in S3.
- SOC 2 / GDPR alignment pillars:
  - **Security**: Mandatory weekly secret audits, Sentry instrumentation, dependency scans, enforced JWT/Redis configuration.
  - **Availability**: Automated backups with verification, disaster recovery drills, maintenance toggles shared via Redis.
  - **Confidentiality**: Vault/AWS Secrets Manager integration, optional Stripe/OAuth credentials isolation, audit log roll-ups with limited retention.

## Backups & Restore

- `npm run backup:create` streams a compressed NDJSON archive of every Mongo collection to the configured S3 bucket (`AWS_S3_*` env vars). Backups are timestamped and stored under `BACKUP_PREFIX` (default `backups/`).
- `npm run backup:verify` restores the latest (or specified) backup into `BACKUP_VERIFY_URI`, runs smoke checks (`/api/live`, collection counts), and drops the temporary database. Use this after schema changes or periodically via CI.
- `npm run backup:restore -- <s3-key> [targetUri]` downloads a backup and restores it into the target MongoDB instance.
- Scheduled backup automation lives in `.github/workflows/backup.yml` (daily) and publishes a JSON artifact summarizing uploaded files.

## Disaster Recovery Procedure

1. **Dry run (non-destructive)**  
   ```bash
   npm run dr:run -- --dry-run
   ```
   Displays the target URI and backup key that would be used without modifying data.
2. **Full recovery**  
   ```bash
   npm run dr:run -- --target-uri mongodb://127.0.0.1:27017/tifto-dr
   ```
   Restores the latest verified backup, runs migrations (`npm run migrate:up`), executes the health suite (`npm run verify`), and posts the result to Slack if a webhook is configured. Override `--target-uri` to point at a staging or recovery cluster.

## Maintenance & Read-Only Mode

- Toggle maintenance via `POST /api/v1/admin/maintenance` (admin JWT required). Payload `{ "enabled": true, "readOnly": true, "message": "Upgrading cluster" }` blocks write operations while allowing reads.
- The maintenance flag is stored in Redis (`MAINTENANCE_REDIS_KEY`) so horizontally scaled workers stay in sync. Defaults to read-only mode; set `MAINTENANCE_READ_ONLY=false` to block all traffic.
- Maintenance responses include `{ status: 'maintenance', message, readOnly }`. Health endpoints (`/api/live`, `/api/ready`, `/status`, `/metrics`) bypass the middleware for observability.

## Optional Payments & SSO

- Stripe integration is opt-in. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to enable `src/payments/stripe.service.js`. Use `createPaymentIntent(orderId, amount, currency)` to generate client secrets and wire the webhook to `/api/v1/payments/webhook`.
- The Stripe webhook expects the raw request body; Sentry logs signature verification failures.
- OAuth scaffolding lives in `src/auth/oauth.js`. Configure Google/GitHub credentials (`OAUTH_*` env vars) and use:
  - `buildAuthorizationUrl('google', { state })` to construct the consent screen URL.
  - `exchangeCodeForToken('github', { code })` + `fetchUserProfile` to retrieve profile details.
  - `createCallbackHandler(provider, { onSuccess })` to drop into Express routes when you are ready to ship SSO.

## Data Retention & Privacy Requests

- Privacy requests are tracked in Mongo via `POST /api/v1/privacy/request-deletion` (returns a `requestId`) and `GET /api/v1/privacy/status/:requestId`.
- The retention service (`src/services/dataRetention.service.js`) anonymizes dormant accounts older than `DATA_RETENTION_DAYS` and completes matching privacy requests. Run manually with `npm run retention:run [--dry-run]`.
- Monthly automation (`.github/workflows/retention.yml`) runs the retention job and uploads an audit CSV (user id, email before anonymization, status) to S3 under `DATA_RETENTION_S3_PREFIX`.
- Retention reports and backup archives share the same AWS credentials; ensure `AWS_S3_BUCKET` is available before enabling the workflows.

## Scaling & Cost Optimization

| Signal | Threshold | Recommended Action |
| ------ | --------- | ------------------ |
| Render CPU/Memory (`npm run scale:check`) | ≥ 80% average utilization over the last hour | Upgrade to the next Render plan tier or add horizontal instances. |
| AWS EC2 CPU (`AWS_EC2_INSTANCE_IDS`) | ≥ 80% average utilization | Increase instance size, enable auto-scaling, or add caching to offload traffic. |
| AWS RDS CPU (`AWS_RDS_INSTANCE_IDENTIFIERS`) | ≥ 80% average utilization | Scale vertically (bigger instance class) or tune queries/indices to lower load. |
| Monthly cost anomalies | > 20% variance vs. baseline | Review Render/AWS usage dashboards, prune unused services, archive stale data. |

Run `npm run scale:check` regularly (or add to scheduled jobs) to print plan tier, region, and the latest CPU/memory metrics. The command emits warnings prior to breaching the 80% threshold so you can act before throttling occurs.

## Secrets Management

- Secrets rotate via `scripts/rotateSecret.sh`. Set `PLATFORM=render` or `PLATFORM=railway`, export the required IDs/tokens, and run with `DRY_RUN=true` to inspect the API payload before applying changes.
- Optional vault integration hydrates env vars before boot when `USE_SECRETS_MANAGER=true`. Supported providers: AWS Secrets Manager (`AWS_SECRETS_IDS`) and HashiCorp Vault (`VAULT_*`).

## Real-Time & Notifications

- Socket.IO namespaces:
  - `/orders` — broadcasts order lifecycle updates & notifications. Clients should join rooms using the order `_id`.
  - `/riders` — streams rider location updates (`rider:location`) and availability events.
- Notification service (`src/services/notifications.service.js`) uses Firebase Cloud Messaging (FCM) to deliver:
  - `sendToUser(userId, title, body, data?)` — targets stored device tokens on a user.
  - `sendToTopic(topicKey, title, body, data?)` — publishes to role-based topics (`tifto-admin`, `tifto-seller`, `tifto-rider`, `tifto-customer`).
- Provide Firebase service-account credentials via environment variables to enable push delivery. Encode the service-account private key in Base64 (`FCM_PRIVATE_KEY`) or use `FCM_PRIVATE_KEY_BASE64`. In non-configured environments the service gracefully no-ops.
- Google Analytics Measurement Protocol events fire for new orders, user signups, and completed deliveries (optional; set `GA_MEASUREMENT_ID` + `GA_API_SECRET`).

## Performance & Scaling

- Node.js clustering (opt-in via `ENABLE_CLUSTER`) scales the API across CPU cores; `CLUSTER_WORKERS` overrides the worker count.
- Socket.IO optionally uses Redis (`REDIS_URL`) to fan events across horizontal instances (Render, Railway, Kubernetes).
- `/api/live` and `/api/ready` endpoints are suitable for Render/Docker health probes.
- High request latency (>2s) triggers alert webhooks when configured.

## MongoDB Atlas Setup

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas/database) and create a **Serverless** or **Shared** cluster.
2. Under **Database Access**, create a database user with a strong password.
3. Under **Network Access**, temporarily whitelist `0.0.0.0/0` so the backend can connect from anywhere (tighten this once deployed on Render/Railway).
4. In **Connect → Drivers**, copy the generated `mongodb+srv://` connection string and replace `<username>`/`<password>` with the credentials from step 2. Add `tifto` (or another DB name) to the end of the URI.
5. Add the following to `.env` (or your deployment secrets):
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/tifto?retryWrites=true&w=majority
   JWT_SECRET=<generate-a-long-random-string>
   FCM_PROJECT_ID=<firebase-project-id>
   FCM_CLIENT_EMAIL=<firebase-service-account-email>
   FCM_PRIVATE_KEY=<base64-encoded-service-account-private-key>
   ```
6. Redeploy or restart the backend so the new configuration is loaded.

## Security Middleware

- Helmet secures HTTP headers.
- CORS and Socket origin whitelists sourced from env.
- express-rate-limit protects against brute-force attacks.
- express-mongo-sanitize, xss-clean, and hpp sanitize inbound payloads.
- Central `ApiError` helper plus enhanced error handler return uniform `{ status, statusCode, message, details }` responses.

## Monitoring & Logging

- Winston logger streams structured logs to the console and optionally to Logtail/BetterStack (set `LOGTAIL_SOURCE_TOKEN`).
- Morgan request logs flow through Winston so every request is captured in the same transport(s).
- Prometheus-compatible metrics are exposed at `/metrics` (requests, latencies, default system stats).
- `scripts/verifyDeployment.js` performs automated health checks against `/health`, `/version`, and `/docs` while verifying MongoDB connectivity.
- `scripts/reportMetrics.js` can be scheduled (e.g. via cron/GitHub Actions) to compile a daily metrics digest and push it to Slack/Discord using the configured webhooks.
- `scripts/exportMetrics.js` writes a fresh Prometheus snapshot to `monitoring/exports/` every five minutes (configurable via `METRICS_EXPORT_INTERVAL_MS`), enabling long-term archival outside of Prometheus retention.
- A Grafana dashboard template lives at `monitoring/ftifto-dashboard.json`; import it and point the `${PROM_DS_UID}` variable to your Prometheus data source for a turnkey observability view.
- `/api/live` and `/api/ready` provide liveness/readiness probes for orchestrators.
- `/status` renders a lightweight dashboard with version, uptime, MongoDB state, request totals, and links to docs/metrics.
- Optional Grafana push integration publishes metrics whenever `GRAFANA_PUSH_URL` + `GRAFANA_API_KEY` are provided.
- Slack/Discord webhooks (`SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL`) receive alerts for unhandled errors, high latency (>2s), and worker restarts.

## OpenAPI Docs

- Swagger UI is served from `DOCS_ROUTE` (default `/docs`), generated via `swagger-jsdoc`.
- Extend documentation by annotating route files or updating `src/docs/spec.yaml`.

## Real-Time Emitters

Helpers in `src/realtime/emitter.js` broadcast server-side events:

- `emitOrderUpdate(orderId, payload)`
- `emitRiderLocation(riderId, payload)`
- `emitNotification(channel, payload)`

Use them inside controllers/services to keep mobile/web clients in sync.

## Frontend Integration

- Each client (`tifto-admin`, `tifto-customer-app`, `tifto-customer-web`, `tifto-seller`, `tifto-rider`) should load API endpoints from environment variables:
  ```
  SERVER_REST_URL=https://ftifto-backend.onrender.com/api
  SOCKET_URL=https://ftifto-backend.onrender.com
  ```
- Keep these values in the respective `.env` files (or Expo/Next config) so OTA updates and CI builds can switch environments without code changes.
- REST example (`fetch`):
  ```js
  const BASE_API_URL = process.env.SERVER_REST_URL ?? 'https://ftifto-backend.onrender.com/api';

  export async function fetchOrders(token) {
    const response = await fetch(`${BASE_API_URL}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }
  ```
- REST example (`axios`):
  ```js
  import axios from 'axios';

  const api = axios.create({
    baseURL: process.env.SERVER_REST_URL ?? 'https://ftifto-backend.onrender.com/api'
  });

  export const getProfile = (token) =>
    api.get('/customer/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
  ```
- Socket.IO client example:
  ```js
  import { io } from 'socket.io-client';

  const SOCKET_URL = process.env.SOCKET_URL ?? 'https://ftifto-backend.onrender.com';

  export const ordersSocket = io(`${SOCKET_URL}/orders`, {
    transports: ['websocket'],
    auth: {
      token: userJwt
    }
  });

  ordersSocket.on('order:update', (payload) => {
    console.log('Order update received', payload);
  });
  ```
- React Native apps already centralize API config (e.g., `environment.js`). Point `SERVER_REST_URL` and `SOCKET_URL` there so both dev and OTA builds stay in sync.

## Syncing Clients with Backend

- Run `node scripts/syncClients.js` from the monorepo root after every backend deployment. The helper reads `deploy-artifacts/deployment.json`, updates `.env` files in `tifto-admin`, `tifto-customer-app`, `tifto-customer-web`, `tifto-seller-app`, and `tifto-rider-app`, then commits the change with message `Sync API endpoints with latest backend deployment`.
- Pass `--env=staging` (or set `TIFTO_ENV=staging`) to broadcast staging endpoints; omit the flag to default to production.
- Keep `deployment.json` authoritative for both staging and production endpoints. The script derives HTTP, GraphQL, and WebSocket variants for Expo/Next builds while preserving any other secrets already present in the client `.env` files.
- Because the sync is automated and idempotent, every build pipeline and OTA update picks up the same endpoints without touching application code.

## Documentation Portal

- `npm run docs:build` generates static assets in `docs/` by copying `README.md` and `src/docs/spec.yaml`. The portal renders Markdown and Swagger live in the browser via `marked` and `js-yaml` CDNs.
- Express serves the compiled site at `/portal`, alongside existing quick links for `/docs`, `/metrics`, and `/status`.
- Check the generated output into version control so deployments pick up the latest README + API spec.

## Blue-Green Deployments

- `scripts/blueGreenSwitch.js` inspects the staging and production entries in `deploy-artifacts/deployment.json`, checks `/status` and `/api/v1/version` for both, and—when staging is healthy with a newer commit—promotes the staging URLs to the production block.
- A snapshot of the previous production URLs is stored under `previousProduction` so rollbacks are a single manifest edit away. Run `node scripts/blueGreenSwitch.js --dry-run` to verify the plan before applying changes.
- After the script runs, update DNS/CNAME records or Render environment variables so live traffic follows the new production host, then broadcast the change to clients via `node scripts/syncClients.js`.

## Error Tracking

- Set `SENTRY_DSN` (and optionally `SENTRY_TRACES_SAMPLE_RATE`) to enable Sentry across Express, Socket.IO, and background processes. When configured, Sentry captures request breadcrumbs, automatic performance traces, and any exceptions raised by the API, WebSocket adapters, or unhandled promise rejections.
- Use project tags/filters (`component`, `namespace`, `signal`) to triage issues quickly. Alerts can flow alongside Slack/Discord notifications by leveraging Sentry’s native integrations.

## Troubleshooting & Rollback

- **Redis outage:** The Redis adapter logs connection errors and falls back to in-memory events. Check Redis availability, then restart the backend so Socket.IO can re-bind the adapter.
- **MongoDB reconnect loop:** `process_uptime_seconds_total` and `/status` expose the current Mongo state. Verify credentials/networking, then run `npm run pre-release` to validate all dependencies before redeploying.
- **Socket.IO Redis adapter fallback:** Redis connection errors are logged (and captured in Sentry). If clusters must remain online without Redis, unset `REDIS_URL` to ensure workers use the default in-memory adapter.
- **Sentry alert triage:** Follow the alert link, inspect breadcrumbs and tags (`component`, `namespace`, `signal`) to identify failing subsystems, then decide whether to roll traffic back using `previousProduction` in `deployment.json`.
- **Manual rollback:** Use the `previousProduction` snapshot recorded in `deployment.json`, restore those URLs under the `production` block, update DNS/Render, and re-run `node scripts/syncClients.js --env=production` so clients follow suit.

## Pre-release Checklist

Before tagging or promoting a production build:

1. **Migrations** — `npm run migrate:up` to ensure the latest schema changes are applied.
2. **Backups** — `npm run backup:verify` (or inspect the latest backup workflow run) to confirm restore paths are healthy.
3. **Compliance & Secrets** — run `npm run compliance` and remediate any failed or warning checks before proceeding.
4. **Automated Tests & Audit** — run `npm test` and `npm run audit` locally; the CI `security-scan` workflow mirrors these gates.
5. **Observability** — confirm `SENTRY_DSN`, `GRAFANA_PUSH_URL`, and related credentials are present in deployment secrets.
6. **Capacity Planning** — execute `npm run scale:check` and address any WARN/ALERT indicators.
7. **Maintenance Toggle** — enable maintenance with `POST /api/v1/admin/maintenance` (expect write endpoints to return HTTP 503), then disable it once confirmed.
8. **Full Checklist Script** — run `npm run pre-release` for the automated verification sweep (env vars, Mongo/Redis connectivity, docs, smoke endpoints). The script exits non-zero on failure—wire it into CI before shipping.

## CI Android Builds

- `.github/workflows/build-apk.yml` triggers on pushes to `main`, builds the Expo Android packages for the customer, seller, and rider apps, injects the current REST/socket URLs from `deploy-artifacts/deployment.json`, and attaches each APK as a workflow artifact.
- Configure the following GitHub secrets before enabling the workflow:
  - `EXPO_TOKEN`: Personal access token with access to all three Expo projects.
  - `EAS_TOKEN`: Service account token for triggering `eas build`.
  - (Optional) `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` if any app requires a self-hosted keystore; hook them up via `eas.json`.
- The workflow calls `npm ci` inside each app directory, so keep lockfiles up to date. To run manually, dispatch from the Actions tab after updating `deploy-artifacts/deployment.json`.

## Core Routes

Base URL: `/api/v1`

| Route                        | Methods | Roles                     | Description                                   |
| ---------------------------- | ------- | ------------------------- | --------------------------------------------- |
| `/v1/health`                 | GET     | public                    | Service heartbeat (`{ status: "ok" }`)        |
| `/v1/auth/register`          | POST    | public                    | Create user (any role)                        |
| `/v1/auth/login`             | POST    | public                    | Login with email/phone + password             |
| `/v1/auth/me`                | GET     | authenticated             | Returns session user                          |
| `/v1/users`                  | GET     | admin                     | Paginated user directory                      |
| `/v1/users/:id`              | GET/PUT | admin (+ self get)        | Fetch/update user                             |
| `/v1/users/:id/toggle`       | POST    | admin                     | Toggle active status                          |
| `/v1/users/stats`            | GET     | admin                     | Aggregate counts per role                     |
| `/v1/products`               | CRUD    | admin, seller             | Manage menus                                  |
| `/v1/orders`                 | GET     | admin, seller             | Paginated order feed                          |
| `/v1/orders`                 | POST    | customer, admin           | Place order                                   |
| `/v1/orders/active`          | GET     | admin, seller, rider      | Active order stream                           |
| `/v1/orders/:id/status`      | PATCH   | admin, seller, rider      | Advance order timeline                        |
| `/v1/orders/:id/assign`      | POST    | admin                     | Assign rider                                  |
| `/v1/orders/:id/review`      | POST    | customer                  | Submit rating/comment                         |
| `/v1/admin/dashboard`        | GET     | admin                     | Platform KPIs                                 |
| `/v1/admin/restaurants`      | GET     | admin                     | Restaurant directory                          |
| `/v1/admin/restaurants`      | POST    | admin                     | Onboard restaurant                            |
| `/v1/admin/maintenance`      | GET/POST| admin                     | Inspect or toggle maintenance mode            |
| `/v1/seller/profile`         | GET     | seller                    | Seller profile + metrics                      |
| `/v1/seller/orders`          | GET     | seller                    | Seller order feed                             |
| `/v1/seller/menu`            | GET     | seller                    | Seller menu snapshot                          |
| `/v1/seller/availability`    | PATCH   | seller                    | Toggle store availability                     |
| `/v1/rider/orders`           | GET     | rider                     | Assigned orders                               |
| `/v1/rider/status`           | PATCH   | rider                     | Toggle availability                           |
| `/v1/rider/location`         | PATCH   | rider                     | Update live coordinates                       |
| `/v1/customer/profile`       | GET     | customer                  | Customer profile                              |
| `/v1/customer/orders`        | GET     | customer                  | Customer order history                        |
| `/v1/customer/restaurants`   | GET     | customer                  | Browse restaurants                            |
| `/v1/customer/addresses`     | POST    | customer                  | Save delivery address                         |
| `/v1/version`                | GET     | public                    | Returns package version & commit hash         |
| `/v1/payments/webhook`       | POST    | Stripe (optional)         | Receives Stripe webhook events                |
| `/v1/privacy/request-deletion` | POST  | public                    | Submit GDPR/CCPA deletion request             |
| `/v1/privacy/status/:requestId` | GET  | public                    | Track deletion request status                 |
| `/metrics`                   | GET     | public                    | Prometheus-formatted service metrics          |
| `/api/live` / `/api/ready`   | GET     | orchestration             | Liveness & readiness probes                   |
| `/status`                    | GET     | public                    | HTML status dashboard                         |

See the individual route files in `src/routes` for additional parameters and validations.

## Data Models

- **User:** Name, email/phone, hashed password, `role` enum (`customer`, `seller`, `rider`, `admin`), activation flag, seller-specific (`sellerProfile`) and rider-specific (`riderProfile`) metadata, address book.
- **Restaurant:** Owner reference, name/slug, address, geo-coordinates, delivery bounds, cuisines/tags, opening times, availability toggles, commission + tax settings.
- **Product:** Restaurant reference, title/slug, price & discount, variations, add-on groups/options, availability flags, preparation time, optional nutrition data.
- **Order:** Generated `orderId`, references to customer/restaurant/seller/rider, array of items (with variations and addons), pricing breakdown, delivery address with geo-point, rider lifecycle timestamps, payment + timeline logs, optional reviews.

These schemas reflect the structures consumed throughout the web and mobile clients discovered in the existing codebase.

## Testing

- Jest runs with an isolated in-memory MongoDB instance (`mongodb-memory-server`) so tests remain deterministic.
- Sample coverage includes `/health` and `/auth/login`; extend `tests/` with additional suites as features grow.

## Deployment Notes

- `Dockerfile` builds a production-ready Node 18 Alpine image.
- `docker-compose.yml` runs the API alongside MongoDB for local or on-prem setups.
- `render.yaml` provisions a Render **Web Service** (`ftifto-backend`) with build/start commands pre-configured:
  1. Push this repository to GitHub.
  2. In Render, **New → Web Service → Build & Deploy from a repo**. Render will detect `render.yaml` automatically.
  3. Confirm the build (`npm install`) and start (`npm run start`) commands.
  4. Add the Atlas URI, JWT secret, and FCM credentials as Render secrets (`MONGODB_URI`, `JWT_SECRET`, `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`).
  5. Deploy — Render exposes the API at `https://ftifto-backend.onrender.com`.
- Railway alternative:
  1. Create a new Railway project from this GitHub repo.
  2. Add a MongoDB add-on or configure `MONGODB_URI` with your Atlas connection string.
  3. Set the same env variables as above, then deploy (`npm install` + `npm run start`).
  4. Railway URLs follow the pattern `https://<project>.up.railway.app`.
- GitHub Actions workflows orchestrate deployment and communication:
  - `.github/workflows/deploy.yml` deploys commits from `develop` to the Render **ftifto-staging** service and published tags from `main` to **ftifto-production**, refreshing `deploy-artifacts/deployment.json` with the latest URLs for both environments.
  - `.github/workflows/release-notes.yml` aggregates commits since the previous tag, appends them to `CHANGELOG.md`, and publishes formatted notes (including staging/production URLs) to Slack/Discord webhooks.

After deployment, update each client app's environment (`SERVER_REST_URL`, `SOCKET_URL`) to the Render/Railway URL, verify `/health`, `/version`, `/docs`, and confirm Socket.IO events propagate across roles.

