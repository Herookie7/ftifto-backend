# Configuration & Environment Variables Documentation

## Overview
This document extracts all critical configuration data from the `ftifto-backend/src` folder, including environment variables, hard-coded URLs, database configs, and payment configs.

---

## Environment Variables

### Required Environment Variables (App will not start without these)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection string | - | **YES** |
| `MONGODB_URI` | MongoDB connection string (alternative, for backward compatibility) | - | **YES** (if MONGO_URI not set) |
| `JWT_SECRET` | Secret key for JWT token signing/verification | - | **YES** |

---

### Application Configuration

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node.js environment (development/production/test) | `'development'` | `env.js` |
| `PORT` | Server port number | `'8001'` | `env.js` |
| `RENDER` | Whether running on Render platform | `false` (checks `RENDER_SERVICE_NAME`) | `env.js` |
| `RENDER_SERVICE_NAME` | Render service name (used to detect Render) | - | `env.js` |

---

### Authentication & Security

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT tokens | - | `env.js` |
| `TOKEN_EXPIRY` | JWT token expiration time | `'7d'` | `env.js` |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins (supports wildcards) | `'*'` | `env.js` |
| `SOCKET_ALLOW_ORIGINS` | Comma-separated list of allowed Socket.IO origins | `''` (falls back to CORS_ORIGINS) | `env.js` |

---

### Database Configuration

#### MongoDB

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection URI (preferred) | - | `env.js` |
| `MONGODB_URI` | MongoDB connection URI (alternative) | - | `env.js` |

**Connection Settings** (hard-coded in `database.js`):
- `maxPoolSize`: 10
- `serverSelectionTimeoutMS`: 10000ms
- `MAX_RETRIES`: 5 attempts
- `RETRY_DELAY_MS`: 3000ms

**Note**: Supports both `MONGO_URI` and `MONGODB_URI` for backward compatibility with Render secrets.

---

#### Redis

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL (for Socket.IO adapter and maintenance mode) | `''` | `env.js` |

**Usage**:
- Socket.IO Redis adapter (multi-instance support)
- Maintenance mode state storage

---

### Firebase Configuration (Push Notifications)

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `FCM_PROJECT_ID` | Firebase Cloud Messaging project ID | `''` | `env.js` |
| `FCM_CLIENT_EMAIL` | Firebase service account email | `''` | `env.js` |
| `FCM_PRIVATE_KEY` | Firebase private key (raw or base64) | `''` | `env.js` |
| `FCM_PRIVATE_KEY_BASE64` | Firebase private key (base64 encoded) | `''` | `env.js` |

**Processing**:
- If `FCM_PRIVATE_KEY_BASE64` is set, decodes from base64
- If `FCM_PRIVATE_KEY` is set, attempts base64 decode, falls back to raw string with `\n` replacement
- Supports both formats for flexibility

---

### Payment Configuration (Stripe)

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | `''` | `env.js` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `''` | `env.js` |

**Hard-coded Configuration**:
- Default currency: `'usd'` (in `config/index.js`)
- Stripe API version: `'2023-10-16'` (in `stripe.service.js`)

---

### OAuth Configuration

#### Google OAuth

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID | `''` | `env.js` |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `''` | `env.js` |

**Hard-coded Configuration**:
- Scope: `'openid email profile'` (in `config/index.js`)
- Auth URL: `'https://accounts.google.com/o/oauth2/v2/auth'` (in `oauth.js`)
- Token URL: `'https://oauth2.googleapis.com/token'` (in `oauth.js`)
- User Info URL: `'https://openidconnect.googleapis.com/v1/userinfo'` (in `oauth.js`)

#### GitHub OAuth

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth client ID | `''` | `env.js` |
| `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | `''` | `env.js` |

**Hard-coded Configuration**:
- Scope: `'read:user user:email'` (in `config/index.js`)
- Auth URL: `'https://github.com/login/oauth/authorize'` (in `oauth.js`)
- Token URL: `'https://github.com/login/oauth/access_token'` (in `oauth.js`)
- User Info URL: `'https://api.github.com/user'` (in `oauth.js`)
- Email URL: `'https://api.github.com/user/emails'` (in `oauth.js` - used if email not in profile)

#### OAuth General

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `OAUTH_REDIRECT_URI` | OAuth redirect URI for callbacks | `''` | `env.js` |

---

### AWS S3 Configuration (Backups & Data Retention)

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `AWS_S3_BUCKET` | S3 bucket name | `''` | `env.js` |
| `S3_BUCKET` | S3 bucket name (alternative) | `''` | `env.js` |
| `AWS_S3_ENDPOINT` | S3 endpoint URL | `''` | `env.js` |
| `S3_ENDPOINT` | S3 endpoint URL (alternative) | `''` | `env.js` |
| `AWS_S3_REGION` | AWS region | `'us-east-1'` | `env.js` |
| `AWS_REGION` | AWS region (alternative) | `'us-east-1'` | `env.js` |
| `AWS_S3_ACCESS_KEY_ID` | AWS access key ID | `''` | `env.js` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID (alternative) | `''` | `env.js` |
| `AWS_S3_SECRET_ACCESS_KEY` | AWS secret access key | `''` | `env.js` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key (alternative) | `''` | `env.js` |
| `BACKUP_PREFIX` | S3 prefix for backups | `'backups/'` | `env.js` |
| `BACKUP_RETENTION` | Backup retention period (days) | `7` | `env.js` |
| `BACKUP_VERIFY_URI` | Backup verification endpoint | `''` | `env.js` |

**Data Retention**:
| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `DATA_RETENTION_DAYS` | Data retention period in days | `365` | `env.js` |
| `DATA_RETENTION_S3_PREFIX` | S3 prefix for data retention reports | `'retention/'` | `env.js` |

**Privacy Exports** (in `privacy.controller.js`):
| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `PRIVACY_EXPORT_PREFIX` | S3 prefix for privacy exports | `'privacy-exports/'` | `privacy.controller.js` |
| `PRIVACY_EXPORT_TTL_SECONDS` | Privacy export URL expiration (seconds) | `3600` | `privacy.controller.js` |

---

### Secrets Management

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `USE_SECRETS_MANAGER` | Enable external secrets manager | `'false'` | `env.js` |
| `SECRETS_PROVIDER` | Secrets provider ('aws' or 'vault') | `'aws'` | `env.js` |

#### AWS Secrets Manager

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `AWS_SECRETS_REGION` | AWS region for Secrets Manager | `'us-east-1'` (or AWS_REGION or AWS_S3_REGION) | `env.js` |
| `AWS_SECRETS_IDS` | Comma-separated list of secret IDs | `''` | `env.js` |

#### HashiCorp Vault

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `VAULT_ADDR` | Vault server address | `''` | `env.js` |
| `VAULT_TOKEN` | Vault authentication token | `''` | `env.js` |
| `VAULT_SECRETS_PATHS` | Comma-separated list of secret paths | `''` | `env.js` |

---

### Logging & Monitoring

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (dev/combined) | `'dev'` | `env.js` |
| `LOGTAIL_SOURCE_TOKEN` | Logtail source token for cloud logging | `''` | `env.js` |

---

### Rate Limiting

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window (milliseconds) | `900000` (15 minutes) | `env.js` |
| `RATE_LIMIT_MAX` | Maximum requests per window | `100` | `env.js` |

---

### API & Documentation

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `API_BASE_URL` | Base URL for API | `'http://localhost:8001/api'` | `env.js` |
| `DOCS_ROUTE` | Swagger documentation route | `'/api/v1/docs'` | `env.js` |

---

### Analytics (Google Analytics)

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `GA_MEASUREMENT_ID` | Google Analytics measurement ID | `''` | `env.js` |
| `GA_API_SECRET` | Google Analytics API secret | `''` | `env.js` |

**Hard-coded URL**:
- Analytics endpoint: `'https://www.google-analytics.com/mp/collect'` (in `notifications.service.js`)

---

### Monitoring & Alerts

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `GRAFANA_PUSH_URL` | Grafana Cloud push gateway URL | `''` | `env.js` |
| `GRAFANA_API_KEY` | Grafana Cloud API key | `''` | `env.js` |
| `SLACK_WEBHOOK_URL` | Slack webhook URL for alerts | `''` | `env.js` |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for alerts | `''` | `env.js` |
| `SENTRY_DSN` | Sentry DSN for error tracking | `''` | `env.js` |
| `SENTRY_TRACES_SAMPLE_RATE` | Sentry trace sampling rate (0-1) | `'0'` | `env.js` |

**Hard-coded Configuration** (in `metrics/index.js`):
- Latency alert threshold: `2` seconds
- Latency alert cooldown: `60000` ms (60 seconds)

---

### Maintenance Mode

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `MAINTENANCE_READ_ONLY` | Default read-only mode setting | `'true'` | `env.js` |
| `MAINTENANCE_MESSAGE` | Default maintenance message | `'Service temporarily unavailable while we upgrade systems.'` | `env.js` |
| `MAINTENANCE_REDIS_KEY` | Redis key for maintenance state | `'ftifto:maintenance'` | `env.js` |
| `MAINTENANCE_CACHE_TTL_MS` | Maintenance state cache TTL (ms) | `5000` | `env.js` |

---

### Cluster Configuration

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `ENABLE_CLUSTER` | Enable Node.js cluster mode | `'true'` | `env.js` |
| `CLUSTER_WORKERS` | Number of cluster workers (empty = auto) | `''` | `env.js` |

---

### Build & Version

| Variable | Description | Default | Location |
|----------|-------------|---------|----------|
| `GIT_COMMIT_SHA` | Git commit SHA | `''` | `env.js` |
| `RENDER_GIT_COMMIT` | Render Git commit (alternative) | - | `env.js` |
| `VERCEL_GIT_COMMIT_SHA` | Vercel Git commit (alternative) | - | `env.js` |
| `RAILWAY_GIT_COMMIT_SHA` | Railway Git commit (alternative) | - | `env.js` |

**Note**: Checks multiple environment variables for Git commit SHA (supports different deployment platforms).

---

## Hard-Coded URLs

### OAuth Provider URLs

#### Google OAuth
- **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **User Info URL**: `https://openidconnect.googleapis.com/v1/userinfo`
- **Location**: `src/auth/oauth.js`

#### GitHub OAuth
- **Authorization URL**: `https://github.com/login/oauth/authorize`
- **Token URL**: `https://github.com/login/oauth/access_token`
- **User Info URL**: `https://api.github.com/user`
- **User Emails URL**: `https://api.github.com/user/emails` (used if email not in profile)
- **Location**: `src/auth/oauth.js`

---

### Analytics URLs

- **Google Analytics Endpoint**: `https://www.google-analytics.com/mp/collect`
- **Location**: `src/services/notifications.service.js`
- **Usage**: Sends analytics events via Measurement Protocol

---

### API Base URLs

#### Default API Base URL
- **Default**: `http://localhost:8001/api`
- **Environment Variable**: `API_BASE_URL`
- **Location**: `src/config/env.js`, `src/config/index.js`

#### Swagger Documentation
- **Default Route**: `/api/v1/docs`
- **Environment Variable**: `DOCS_ROUTE`
- **Location**: `src/config/env.js`, `src/app.js`

#### Swagger Spec
- **URL in spec.yaml**: `http://localhost:8001/api`
- **Location**: `src/docs/spec.yaml`

---

### Socket.IO Namespaces (Hard-coded)

- **Orders Namespace**: `/orders`
- **Riders Namespace**: `/riders`
- **Location**: `src/config/index.js`

---

## Database Configurations

### MongoDB

**Connection String**: From `MONGO_URI` or `MONGODB_URI` environment variable

**Connection Options** (hard-coded in `src/config/database.js`):
```javascript
{
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000
}
```

**Retry Logic**:
- Maximum retries: 5
- Retry delay: 3000ms (3 seconds)
- Exits process if all retries fail

**Connection Flow**:
1. Attempts connection with retry logic
2. Runs demo seed script if in production or Render environment
3. Logs connection status

---

### Redis

**Connection String**: From `REDIS_URL` environment variable

**Usage**:
1. **Socket.IO Adapter**: Enables multi-instance Socket.IO support
2. **Maintenance Mode**: Stores maintenance state in Redis

**Configuration**:
- Key for maintenance: `ftifto:maintenance` (configurable via `MAINTENANCE_REDIS_KEY`)
- Falls back to in-memory cache if Redis unavailable

---

## Payment Configurations

### Stripe

**Environment Variables**:
- `STRIPE_SECRET_KEY` - Stripe secret API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**Hard-coded Configuration**:
- **API Version**: `'2023-10-16'` (in `stripe.service.js`)
- **Default Currency**: `'usd'` (in `config/index.js`)
- **Amount Conversion**: Multiplies by 100 (converts to cents/minor units)

**Webhook Endpoint**: `/api/v1/payments/webhook`

**Webhook Events Handled**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## Firebase Configuration

**Environment Variables**:
- `FCM_PROJECT_ID` - Firebase project ID
- `FCM_CLIENT_EMAIL` - Firebase service account email
- `FCM_PRIVATE_KEY` - Firebase private key (raw or base64)
- `FCM_PRIVATE_KEY_BASE64` - Firebase private key (base64 encoded)

**Hard-coded Topics** (in `config/index.js`):
- Admin: `'tifto-admin'`
- Seller: `'tifto-seller'`
- Rider: `'tifto-rider'`
- Customer: `'tifto-customer'`

**Initialization**:
- Uses Firebase Admin SDK
- Initializes with service account credentials
- Lazy-loaded (initialized on first use)

---

## AWS Configuration

### S3 Configuration

**Environment Variables**:
- `AWS_S3_BUCKET` or `S3_BUCKET` - Bucket name
- `AWS_S3_ENDPOINT` or `S3_ENDPOINT` - Custom endpoint (optional)
- `AWS_S3_REGION` or `AWS_REGION` - AWS region (default: `'us-east-1'`)
- `AWS_S3_ACCESS_KEY_ID` or `AWS_ACCESS_KEY_ID` - Access key
- `AWS_S3_SECRET_ACCESS_KEY` or `AWS_SECRET_ACCESS_KEY` - Secret key

**S3 Prefixes**:
- Backups: `'backups/'` (configurable via `BACKUP_PREFIX`)
- Data Retention: `'retention/'` (configurable via `DATA_RETENTION_S3_PREFIX`)
- Privacy Exports: `'privacy-exports/'` (configurable via `PRIVACY_EXPORT_PREFIX`)

**Usage**:
- Database backups
- Data retention reports (CSV)
- Privacy data exports (JSON)

---

### AWS Secrets Manager

**Environment Variables**:
- `AWS_SECRETS_REGION` - AWS region (defaults to `AWS_REGION` or `AWS_S3_REGION` or `'us-east-1'`)
- `AWS_SECRETS_IDS` - Comma-separated list of secret IDs

**Usage**:
- Loads secrets from AWS Secrets Manager
- Applies to `process.env` (with precedence over existing values)
- Used if `USE_SECRETS_MANAGER='true'` and `SECRETS_PROVIDER='aws'`

---

## HashiCorp Vault Configuration

**Environment Variables**:
- `VAULT_ADDR` - Vault server address
- `VAULT_TOKEN` - Vault authentication token
- `VAULT_SECRETS_PATHS` - Comma-separated list of secret paths

**Usage**:
- Loads secrets from Vault
- Applies to `process.env` (with precedence over existing values)
- Used if `USE_SECRETS_MANAGER='true'` and `SECRETS_PROVIDER='vault'`

**Path Format**: `/v1/{path}` (automatically prepended)

---

## Complete Environment Variable List

### Summary by Category

**Required (2)**:
1. `MONGO_URI` or `MONGODB_URI`
2. `JWT_SECRET`

**Application (4)**:
3. `NODE_ENV`
4. `PORT`
5. `RENDER` / `RENDER_SERVICE_NAME`
6. `GIT_COMMIT_SHA` / `RENDER_GIT_COMMIT` / `VERCEL_GIT_COMMIT_SHA` / `RAILWAY_GIT_COMMIT_SHA`

**Authentication (3)**:
7. `JWT_SECRET` (required)
8. `TOKEN_EXPIRY`
9. `CORS_ORIGINS`
10. `SOCKET_ALLOW_ORIGINS`

**Database (2)**:
11. `MONGO_URI` / `MONGODB_URI` (required)
12. `REDIS_URL`

**Firebase (4)**:
13. `FCM_PROJECT_ID`
14. `FCM_CLIENT_EMAIL`
15. `FCM_PRIVATE_KEY`
16. `FCM_PRIVATE_KEY_BASE64`

**Stripe (2)**:
17. `STRIPE_SECRET_KEY`
18. `STRIPE_WEBHOOK_SECRET`

**OAuth (5)**:
19. `OAUTH_REDIRECT_URI`
20. `OAUTH_GOOGLE_CLIENT_ID`
21. `OAUTH_GOOGLE_CLIENT_SECRET`
22. `OAUTH_GITHUB_CLIENT_ID`
23. `OAUTH_GITHUB_CLIENT_SECRET`

**AWS S3 (9)**:
24. `AWS_S3_BUCKET` / `S3_BUCKET`
25. `AWS_S3_ENDPOINT` / `S3_ENDPOINT`
26. `AWS_S3_REGION` / `AWS_REGION`
27. `AWS_S3_ACCESS_KEY_ID` / `AWS_ACCESS_KEY_ID`
28. `AWS_S3_SECRET_ACCESS_KEY` / `AWS_SECRET_ACCESS_KEY`
29. `BACKUP_PREFIX`
30. `BACKUP_RETENTION`
31. `BACKUP_VERIFY_URI`
32. `DATA_RETENTION_S3_PREFIX`

**Secrets Manager (7)**:
33. `USE_SECRETS_MANAGER`
34. `SECRETS_PROVIDER`
35. `AWS_SECRETS_REGION`
36. `AWS_SECRETS_IDS`
37. `VAULT_ADDR`
38. `VAULT_TOKEN`
39. `VAULT_SECRETS_PATHS`

**Logging (2)**:
40. `LOG_LEVEL`
41. `LOGTAIL_SOURCE_TOKEN`

**Rate Limiting (2)**:
42. `RATE_LIMIT_WINDOW_MS`
43. `RATE_LIMIT_MAX`

**API (2)**:
44. `API_BASE_URL`
45. `DOCS_ROUTE`

**Analytics (2)**:
46. `GA_MEASUREMENT_ID`
47. `GA_API_SECRET`

**Monitoring (5)**:
48. `GRAFANA_PUSH_URL`
49. `GRAFANA_API_KEY`
50. `SLACK_WEBHOOK_URL`
51. `DISCORD_WEBHOOK_URL`
52. `SENTRY_DSN`
53. `SENTRY_TRACES_SAMPLE_RATE`

**Maintenance (4)**:
54. `MAINTENANCE_READ_ONLY`
55. `MAINTENANCE_MESSAGE`
56. `MAINTENANCE_REDIS_KEY`
57. `MAINTENANCE_CACHE_TTL_MS`

**Cluster (2)**:
58. `ENABLE_CLUSTER`
59. `CLUSTER_WORKERS`

**Data Retention (2)**:
60. `DATA_RETENTION_DAYS`
61. `DATA_RETENTION_S3_PREFIX`

**Privacy (2)**:
62. `PRIVACY_EXPORT_PREFIX`
63. `PRIVACY_EXPORT_TTL_SECONDS`

**Total Environment Variables**: 63

---

## Hard-Coded Values Summary

### URLs (7 total)

1. **Google OAuth Authorization**: `https://accounts.google.com/o/oauth2/v2/auth`
2. **Google OAuth Token**: `https://oauth2.googleapis.com/token`
3. **Google OAuth User Info**: `https://openidconnect.googleapis.com/v1/userinfo`
4. **GitHub OAuth Authorization**: `https://github.com/login/oauth/authorize`
5. **GitHub OAuth Token**: `https://github.com/login/oauth/access_token`
6. **GitHub OAuth User Info**: `https://api.github.com/user`
7. **GitHub OAuth Emails**: `https://api.github.com/user/emails`
8. **Google Analytics**: `https://www.google-analytics.com/mp/collect`

### Default Values

- **API Base URL**: `http://localhost:8001/api`
- **Server Port**: `8001`
- **Docs Route**: `/api/v1/docs`
- **Stripe Currency**: `'usd'`
- **Stripe API Version**: `'2023-10-16'`
- **MongoDB Pool Size**: `10`
- **MongoDB Timeout**: `10000ms`
- **Rate Limit Window**: `900000ms` (15 minutes)
- **Rate Limit Max**: `100`
- **Token Expiry**: `'7d'`
- **Data Retention**: `365` days
- **Backup Retention**: `7` days
- **Privacy Export TTL**: `3600` seconds (1 hour)
- **Maintenance Cache TTL**: `5000ms`
- **Latency Alert Threshold**: `2` seconds
- **Latency Alert Cooldown**: `60000ms` (60 seconds)

### Hard-Coded Strings

- **Order ID Prefix**: `'TFT-'`
- **Maintenance Redis Key**: `'ftifto:maintenance'`
- **Backup Prefix**: `'backups/'`
- **Data Retention Prefix**: `'retention/'`
- **Privacy Export Prefix**: `'privacy-exports/'`
- **Firebase Topics**: `'tifto-admin'`, `'tifto-seller'`, `'tifto-rider'`, `'tifto-customer'`
- **Socket.IO Namespaces**: `'/orders'`, `'/riders'`
- **OAuth Scopes**:
  - Google: `'openid email profile'`
  - GitHub: `'read:user user:email'`

---

## Configuration File Structure

### `src/config/env.js`
- Loads all environment variables
- Provides defaults
- Validates required variables
- Supports backward compatibility aliases

### `src/config/index.js`
- Processes environment variables
- Resolves complex configurations (CORS, Firebase key, log level)
- Exports structured config object

### `src/config/database.js`
- MongoDB connection logic
- Retry mechanism
- Demo seed integration

### `src/config/api.js`
- Exports API base URL

### `src/config/secretsProvider.js`
- External secrets loading (AWS/Vault)
- Applies secrets to process.env

---

## Configuration Priority

1. **Environment Variables** (highest priority)
2. **Default Values** (in code)
3. **Backward Compatibility Aliases** (e.g., `MONGODB_URI` if `MONGO_URI` not set)

---

## Security Notes

### Sensitive Variables (should be kept secret):
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FCM_PRIVATE_KEY` / `FCM_PRIVATE_KEY_BASE64`
- `OAUTH_GOOGLE_CLIENT_SECRET`
- `OAUTH_GITHUB_CLIENT_SECRET`
- `AWS_S3_SECRET_ACCESS_KEY`
- `VAULT_TOKEN`
- `GRAFANA_API_KEY`
- `GA_API_SECRET`
- `SENTRY_DSN`
- `LOGTAIL_SOURCE_TOKEN`
- `SLACK_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

### Connection Strings (contain credentials):
- `MONGO_URI` / `MONGODB_URI`
- `REDIS_URL`

---

## Deployment Platform Support

The configuration supports multiple deployment platforms:

- **Render**: Detects via `RENDER` or `RENDER_SERVICE_NAME`, supports `RENDER_GIT_COMMIT`
- **Vercel**: Supports `VERCEL_GIT_COMMIT_SHA`
- **Railway**: Supports `RAILWAY_GIT_COMMIT_SHA`
- **Generic**: Uses `GIT_COMMIT_SHA`

---

## Configuration Validation

### Required Variables (App fails to start if missing):
- `MONGO_URI` or `MONGODB_URI`
- `JWT_SECRET`

### Optional but Recommended:
- `NODE_ENV` (defaults to 'development')
- `PORT` (defaults to 8001)
- `CORS_ORIGINS` (defaults to '*')

### Feature-Specific (required only if feature is used):
- Firebase: `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- OAuth: Provider-specific client IDs and secrets
- AWS S3: S3 credentials for backups
- Monitoring: Grafana, Sentry, Slack/Discord URLs
- Secrets Manager: Provider-specific configuration

