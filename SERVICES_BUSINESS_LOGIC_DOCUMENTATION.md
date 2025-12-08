# Services & Business Logic Documentation

## Overview
This document lists all services and business logic found in the `ftifto-backend/src` folder, including their responsibilities and key business rules.

---

## Services Directory (`src/services/`)

### 1. `alerts.service.js`
**Location**: `src/services/alerts.service.js`

**Purpose**: Alert notification service for system events

**Business Logic**:
- Sends alerts to Slack and Discord webhooks
- Formats alert messages with emoji indicators
- Handles webhook delivery failures gracefully
- Supports parallel webhook posting to multiple channels

**Exported Functions**:
- `notifyEvent(title, details)` - Send general event alert
- `notifyError(error, details)` - Send error alert with stack trace
- `notifyLatency(route, duration, details)` - Send high latency alert

**Key Features**:
- Checks for webhook configuration before sending
- Uses Promise.all for parallel webhook delivery
- Logs warnings on delivery failures (non-blocking)
- Formats messages with JSON code blocks for readability

**Configuration**:
- `config.alerts.slackWebhookUrl` - Slack webhook URL
- `config.alerts.discordWebhookUrl` - Discord webhook URL

---

### 2. `auditLogger.js`
**Location**: `src/services/auditLogger.js`

**Purpose**: Audit logging service for security and compliance

**Business Logic**:
- Logs security and business events to JSONL files
- Redacts sensitive information (tokens, secrets)
- Creates daily log files (one file per day)
- Sanitizes metadata to prevent sensitive data leakage

**Exported Functions**:
- `logEvent({ category, action, userId, entityId, entityType, metadata, severity })` - Log audit event
- `getAuditDirectory()` - Get audit log directory path

**Key Features**:
- **Data Redaction**: Automatically redacts fields containing "token" or "secret" in metadata
- **File Organization**: Creates files named `YYYY-MM-DD.jsonl` in `logs/audit/` directory
- **Event Structure**: Each event includes:
  - Unique ID (UUID)
  - Timestamp (ISO 8601)
  - Category and action
  - User ID and entity information
  - Severity level (default: 'info')
  - Hostname and process ID
  - Sanitized metadata

**Redaction Logic**:
- Fields with "token" or "secret" in name are partially redacted
- Format: `first4chars***last4chars`
- Values ≤ 8 characters are fully redacted

**Audit Categories** (from usage):
- `auth` - Authentication events (register, login)
- `payments` - Payment events (intent_created, intent_succeeded, intent_failed)
- `orders` - Order events (created, status_change, rider_assigned)
- `admin` - Administrative actions (maintenance_enabled, maintenance_disabled)
- `privacy` - Privacy request events (deletion_requested, portability_generated)

---

### 3. `dataRetention.service.js`
**Location**: `src/services/dataRetention.service.js`

**Purpose**: Data retention and anonymization service (GDPR compliance)

**Business Logic**:
- Anonymizes user data after retention period (default: 365 days)
- Generates CSV reports of anonymization actions
- Uploads reports to S3 for compliance records
- Automatically resolves pending privacy deletion requests

**Exported Functions**:
- `runDataRetention({ dryRun, days, referenceDate })` - Run data retention process

**Key Features**:
- **Anonymization Process**:
  - Replaces name with `Anonymized-{last6charsOfId}`
  - Removes email and phone
  - Sets `isActive: false`
  - Clears addressBook and pushTokens
  - Disables marketing opt-in
  - Adds anonymization metadata

- **Retention Policy**:
  - Default: 365 days (configurable via `DATA_RETENTION_DAYS`)
  - Only processes non-admin users
  - Filters by `updatedAt < cutoff date`

- **Privacy Request Integration**:
  - Automatically resolves pending deletion requests
  - Links anonymization to privacy requests
  - Marks requests as "completed" with notes

- **Reporting**:
  - Generates CSV reports with anonymization details
  - Uploads to S3 at `{s3Prefix}/data-retention-{timestamp}.csv`
  - Report includes: userId, emailBefore, role, anonymizedAt, privacyRequestId, notes

**Configuration**:
- `config.dataRetention.days` - Retention period in days
- `config.dataRetention.s3Prefix` - S3 prefix for reports
- `config.backups.bucket` - S3 bucket for report storage

**Dry Run Mode**:
- Can run in dry-run mode to preview actions
- Generates report without making changes
- Useful for testing and compliance audits

---

### 4. `maintenance.service.js`
**Location**: `src/services/maintenance.service.js`

**Purpose**: Maintenance mode management service

**Business Logic**:
- Manages system maintenance state (enabled/disabled)
- Supports read-only mode (allows GET requests, blocks writes)
- Uses Redis for distributed state management
- Implements caching to reduce Redis calls

**Exported Functions**:
- `getState()` - Get current maintenance state
- `setState(partialState)` - Set maintenance state
- `toggleMaintenance({ enabled, message, readOnly, updatedBy })` - Toggle maintenance mode
- `isMaintenanceActive()` - Check if maintenance is active
- `shutdown()` - Cleanup Redis connection
- `_resetCache()` - Reset cache (for testing)

**Key Features**:
- **State Management**:
  - Stores state in Redis (key: `ftifto:maintenance`)
  - Falls back to in-memory cache if Redis unavailable
  - Cache TTL: 5 seconds (configurable)

- **Maintenance Modes**:
  - **Full Maintenance**: Blocks all requests (except health checks)
  - **Read-Only Mode**: Allows GET/HEAD/OPTIONS, blocks POST/PUT/PATCH/DELETE

- **State Structure**:
  ```javascript
  {
    enabled: Boolean,
    readOnly: Boolean,
    message: String,
    updatedBy: { id, email } | null,
    updatedAt: ISO8601 timestamp
  }
  ```

- **Default State**:
  - `enabled: false`
  - `readOnly: true` (from config)
  - `message: config.maintenance.defaultMessage`

**Configuration**:
- `config.maintenance.redisKey` - Redis key for state
- `config.maintenance.cacheTtlMs` - Cache TTL in milliseconds
- `config.maintenance.readOnlyByDefault` - Default read-only setting
- `config.maintenance.defaultMessage` - Default maintenance message
- `config.socket.redisUrl` - Redis connection URL

**Integration**:
- Used by `maintenance.js` middleware to block requests
- Admin can enable/disable via `/api/v1/admin/maintenance` endpoint

---

### 5. `metricsPush.service.js`
**Location**: `src/services/metricsPush.service.js`

**Purpose**: Metrics pushing service for Grafana Cloud

**Business Logic**:
- Periodically pushes Prometheus metrics to Grafana Cloud
- Runs every 60 seconds
- Handles push failures gracefully

**Exported Functions**:
- `startMetricsPush()` - Start metrics pushing interval

**Key Features**:
- **Push Interval**: 60 seconds (60,000ms)
- **Authentication**: Uses Bearer token from config
- **Content Type**: `text/plain` (Prometheus format)
- **Error Handling**: Logs warnings on failure, continues running

**Configuration**:
- `config.monitoring.grafanaPushUrl` - Grafana Cloud push URL
- `config.monitoring.grafanaApiKey` - Grafana API key

**Metrics Source**:
- Uses `metrics.getMetrics()` to get Prometheus-formatted metrics
- Includes custom metrics (request counts, durations) and default system metrics

**Usage**:
- Should be called once at application startup
- Uses `setInterval().unref()` to prevent blocking process exit

---

### 6. `notifications.service.js`
**Location**: `src/services/notifications.service.js`

**Purpose**: Push notification and analytics service

**Business Logic**:
- Sends Firebase Cloud Messaging (FCM) push notifications
- Supports both device tokens and topic-based messaging
- Sends Google Analytics events
- Integrates with Socket.IO for real-time notifications

**Exported Functions**:
- `sendToUser(userId, title, body, data)` - Send notification to specific user
- `sendToTopic(topicKey, title, body, data)` - Send notification to topic
- `initializeFirebase()` - Initialize Firebase Admin SDK
- `sendAnalyticsEvent(eventName, params)` - Send Google Analytics event

**Key Features**:

**Firebase Integration**:
- Initializes Firebase Admin SDK with service account credentials
- Supports both multicast (device tokens) and topic messaging
- Handles Firebase initialization errors gracefully

**Notification Types**:
- **User Notifications**: Sent to specific user's device tokens
- **Topic Notifications**: Sent to all subscribers of a topic
  - Topics: `tifto-admin`, `tifto-seller`, `tifto-rider`, `tifto-customer`

**Analytics Integration**:
- Sends events to Google Analytics Measurement Protocol
- Generates unique client IDs (UUID)
- Includes engagement time and custom parameters

**Real-time Integration**:
- Emits Socket.IO notifications alongside FCM
- Broadcasts to both `/orders` and `/riders` namespaces

**Configuration**:
- `config.notifications.firebase.projectId` - Firebase project ID
- `config.notifications.firebase.clientEmail` - Firebase service account email
- `config.notifications.firebase.privateKey` - Firebase private key
- `config.notifications.topics` - Topic name mappings
- `config.analytics.measurementId` - Google Analytics measurement ID
- `config.analytics.apiSecret` - Google Analytics API secret

**Business Rules**:
- Returns error if user not found
- Returns error if no device tokens registered
- Silently fails analytics if not configured
- Logs warnings on Firebase errors

---

### 7. `index.js`
**Location**: `src/services/index.js`

**Purpose**: Service module aggregator

**Status**: Empty placeholder file

**Note**: Currently empty, intended for exporting services

---

## Payment Services (`src/payments/`)

### 8. `stripe.service.js`
**Location**: `src/payments/stripe.service.js`

**Purpose**: Stripe payment processing service

**Business Logic**:
- Creates Stripe payment intents
- Handles Stripe webhook events
- Converts amounts to minor units (cents)
- Integrates with audit logging

**Exported Functions**:
- `createPaymentIntent(orderId, amount, currency)` - Create payment intent
- `handleWebhook(req, res)` - Handle Stripe webhook events
- `isConfigured()` - Check if Stripe is configured

**Key Features**:

**Payment Intent Creation**:
- Converts amount to minor units (multiply by 100)
- Sets default currency: 'inr'
- Includes orderId in metadata
- Enables automatic payment methods
- Logs payment intent creation
- Creates audit log entry

**Webhook Handling**:
- Verifies webhook signature using Stripe secret
- Handles `payment_intent.succeeded` events
- Handles `payment_intent.payment_failed` events
- Logs all webhook events
- Creates audit log entries for payment events

**Amount Conversion**:
- `toMinorUnits(amount)` - Converts dollars to cents
- Validates amount is a number
- Rounds to nearest integer

**Configuration**:
- `config.payments.stripe.secretKey` - Stripe secret key
- `config.payments.stripe.webhookSecret` - Stripe webhook secret
- `config.payments.stripe.defaultCurrency` - Default currency ('inr')

**Business Rules**:
- Throws error if Stripe not configured
- Returns 503 if webhook secret missing
- Returns 400 if signature verification fails
- Logs unhandled webhook event types

**Audit Events**:
- `intent_created` - Payment intent created
- `intent_succeeded` - Payment succeeded
- `intent_failed` - Payment failed (severity: warn)

---

## Real-time Services (`src/realtime/`)

### 9. `emitter.js`
**Location**: `src/realtime/emitter.js`

**Purpose**: Socket.IO event emitter utilities

**Business Logic**:
- Manages Socket.IO namespace registration
- Emits order update events
- Emits rider location updates
- Emits general notifications

**Exported Functions**:
- `registerNamespaces(namespaces)` - Register Socket.IO namespaces
- `emitOrderUpdate(orderId, payload)` - Emit order update event
- `emitRiderLocation(riderId, payload)` - Emit rider location update
- `emitNotification(channel, payload)` - Emit general notification

**Key Features**:
- **Namespace Management**: Stores namespaces in internal state
- **Order Updates**: Emits to specific order room (`/orders` namespace)
- **Rider Location**: Emits to specific rider room (`/riders` namespace)
- **Notifications**: Broadcasts to both namespaces

**Event Types**:
- `order:update` - Order status/state changes
- `rider:location` - Rider GPS location updates
- `notification` - General notifications

**Integration**:
- Used by controllers to emit real-time updates
- Called after order status changes
- Called after rider location updates

---

## Metrics Service (`src/metrics/`)

### 10. `index.js`
**Location**: `src/metrics/index.js`

**Purpose**: Prometheus metrics collection service

**Business Logic**:
- Collects HTTP request metrics
- Tracks request counts and durations
- Monitors latency and triggers alerts
- Exports metrics in Prometheus format

**Exported Functions**:
- `requestMetricsMiddleware` - Express middleware for metrics
- `getMetrics()` - Get Prometheus-formatted metrics
- `getRequestCount()` - Get total request count
- `register` - Prometheus registry

**Key Features**:
- **Metrics Collected**:
  - HTTP request count (by method, route, status)
  - HTTP request duration histogram
  - Default system metrics (CPU, memory, etc.)

- **Latency Monitoring**:
  - Threshold: 2 seconds (configurable)
  - Cooldown: 60 seconds between alerts
  - Triggers alerts via `alerts.service`

- **Route Labeling**:
  - Uses `req.route.path` if available
  - Falls back to `req.originalUrl` or `req.url`

**Configuration**:
- `config.monitoring.latencyAlertThreshold` - Latency threshold in seconds
- `config.monitoring.latencyAlertCooldownMs` - Alert cooldown in milliseconds

**Metrics Format**:
- Prometheus text format
- Prefix: `ftifto_`
- Histogram buckets: [0.05, 0.1, 0.25, 0.5, 0.75, 1, 3, 5] seconds

---

## Utility Services (`src/utils/`)

### 11. `generateOrderId.js`
**Location**: `src/utils/generateOrderId.js`

**Purpose**: Order ID generation utility

**Business Logic**:
- Generates unique order IDs
- Format: `TFT-{timestamp}-{random}`
- Uses ISO timestamp and crypto random bytes

**Exported Functions**:
- `generateOrderId()` - Generate unique order ID

**Key Features**:
- **Format**: `TFT-YYYYMMDDHHmm-{4hexchars}`
- **Timestamp**: ISO format, stripped of separators, first 12 chars
- **Random**: 2 bytes converted to uppercase hex (4 characters)
- **Example**: `TFT-202501011430-A1B2`

**Usage**:
- Used as default value in Order model schema
- Ensures unique order identifiers

---

### 12. `token.js`
**Location**: `src/utils/token.js`

**Purpose**: JWT token utilities

**Business Logic**:
- Signs JWT tokens with payload
- Verifies JWT tokens
- Uses configurable secret and expiry

**Exported Functions**:
- `signToken(payload, options)` - Create JWT token
- `verifyToken(token)` - Verify JWT token

**Key Features**:
- **Secret**: Uses `config.auth.jwtSecret`
- **Expiry**: Uses `config.auth.tokenExpiry` (default: '7d')
- **Options**: Supports additional JWT options

**Usage**:
- Used by authentication controllers
- Used by auth middleware for token verification

---

### 13. `ApiError.js`
**Location**: `src/utils/ApiError.js`

**Purpose**: Custom error class for API errors

**Business Logic**:
- Extends Error with statusCode and details
- Captures stack trace
- Used for standardized error handling

**Exported Class**:
- `ApiError(statusCode, message, details)`

**Key Features**:
- **Properties**:
  - `statusCode` - HTTP status code
  - `message` - Error message
  - `details` - Optional error details
  - `stack` - Stack trace

**Usage**:
- Used throughout controllers for error handling
- Used by error handler middleware

---

## Business Logic Patterns

### Order Management Logic

**Location**: `src/controllers/order.controller.js`

**Key Business Rules**:

1. **Order Creation**:
   - Validates restaurant and customer exist
   - Sets seller from restaurant owner
   - Creates order timeline entry
   - Assigns zone from restaurant
   - Emits real-time order update
   - Sends analytics event
   - Creates audit log entry

2. **Order Status Updates**:
   - Updates order status and timeline
   - Sets timestamps based on status:
     - `accepted` → `acceptedAt`
     - `picked`/`enroute` → `isPickedUp: true`, `pickedAt`
     - `delivered` → `deliveredAt`, `paymentStatus: 'paid'`
     - `cancelled` → `isActive: false`, `cancelledAt`
   - Emits real-time update
   - Creates audit log entry

3. **Rider Assignment**:
   - Validates rider exists and has 'rider' role
   - Sets `assignedAt` timestamp
   - Adds timeline entry
   - Emits real-time update
   - Creates audit log entry

---

### Review & Rating Logic

**Location**: `src/graphql/resolvers.js` (reviewOrder mutation)

**Key Business Rules**:

1. **Review Creation**:
   - Creates or updates review for order
   - Updates order with review data
   - Recalculates restaurant rating:
     - Sums all review ratings
     - Divides by review count
     - Updates `rating`, `reviewCount`, `reviewAverage`

2. **Rating Calculation**:
   - Average rating = sum of ratings / count of reviews
   - Updates restaurant document
   - Used for restaurant ranking

---

### Distance Calculation Logic

**Location**: `src/graphql/resolvers.js` (calculateDistance function)

**Key Business Rules**:

1. **Haversine Formula**:
   - Calculates distance between two GPS coordinates
   - Returns distance in kilometers
   - Used for restaurant filtering (50km radius)

2. **Usage**:
   - Filters nearby restaurants
   - Calculates distance for restaurant previews
   - Used in top-rated vendor queries

---

### Data Anonymization Logic

**Location**: `src/services/dataRetention.service.js`

**Key Business Rules**:

1. **Anonymization Process**:
   - Replaces name with anonymized version
   - Removes PII (email, phone)
   - Deactivates account
   - Clears personal data (addresses, tokens)
   - Disables marketing preferences
   - Adds anonymization metadata

2. **Retention Policy**:
   - Default: 365 days of inactivity
   - Only processes non-admin users
   - Based on `updatedAt` timestamp

---

### Payment Processing Logic

**Location**: `src/payments/stripe.service.js`

**Key Business Rules**:

1. **Payment Intent**:
   - Amount converted to cents (minor units)
   - Includes orderId in metadata
   - Enables automatic payment methods

2. **Webhook Handling**:
   - Verifies signature for security
   - Handles success and failure events
   - Creates audit log entries
   - Logs all payment events

---

### Maintenance Mode Logic

**Location**: `src/services/maintenance.service.js`

**Key Business Rules**:

1. **State Management**:
   - Stored in Redis for distributed access
   - Cached in-memory (5s TTL)
   - Falls back to cache if Redis unavailable

2. **Request Blocking**:
   - Full maintenance: Blocks all requests
   - Read-only: Allows GET/HEAD/OPTIONS, blocks writes
   - Health endpoints always accessible

---

## Service Dependencies

### Service Dependency Graph

```
alerts.service
  └─> config
  └─> logger

auditLogger
  └─> fs
  └─> logger

dataRetention.service
  └─> User model
  └─> PrivacyRequest model
  └─> backupUtils (S3 client)
  └─> config
  └─> logger

maintenance.service
  └─> Redis
  └─> config
  └─> logger

metricsPush.service
  └─> metrics
  └─> config
  └─> logger

notifications.service
  └─> Firebase Admin SDK
  └─> User model
  └─> realtime/emitter
  └─> config
  └─> logger

stripe.service
  └─> Stripe SDK
  └─> auditLogger
  └─> config
  └─> logger

emitter
  └─> Socket.IO namespaces (state)

metrics
  └─> Prometheus client
  └─> alerts.service
  └─> config
```

---

## Summary Statistics

- **Total Services**: 13
  - Core Services: 6 (alerts, audit, dataRetention, maintenance, metricsPush, notifications)
  - Payment Services: 1 (stripe)
  - Real-time Services: 1 (emitter)
  - Metrics Services: 1 (metrics)
  - Utility Services: 3 (generateOrderId, token, ApiError)
  - Placeholder: 1 (services/index.js)

- **Business Logic Categories**:
  - **Alerting & Monitoring**: alerts, metrics, metricsPush
  - **Security & Compliance**: auditLogger, dataRetention
  - **System Management**: maintenance
  - **Communication**: notifications, emitter
  - **Payments**: stripe
  - **Utilities**: generateOrderId, token, ApiError

- **External Integrations**:
  - Firebase Cloud Messaging
  - Google Analytics
  - Stripe
  - Slack/Discord webhooks
  - Grafana Cloud
  - Redis
  - AWS S3

---

## Notes

1. **Service Initialization**: Most services are lazy-loaded (initialized on first use)
2. **Error Handling**: All services handle errors gracefully and log warnings
3. **Configuration**: Services check for configuration before operating
4. **Audit Trail**: Critical operations (payments, orders, auth) are audited
5. **Real-time Updates**: Order and rider updates use Socket.IO, not GraphQL subscriptions
6. **Data Privacy**: GDPR compliance via data retention and anonymization service

