# Middleware & Utilities Documentation

## Overview
This document lists all middleware and utilities found in the `ftifto-backend/src` folder, including how they work and their purposes.

---

## Middleware

### Custom Middleware (`src/middleware/`)

#### 1. `auth.js`
**Location**: `src/middleware/auth.js`

**Purpose**: Authentication and authorization middleware

**Exported Functions**:
- `protect` - JWT token authentication middleware
- `authorizeRoles(...roles)` - Role-based authorization middleware factory

**How It Works**:

**`protect` Middleware**:
1. **Token Extraction**:
   - Checks for `Authorization` header
   - Validates format: `Bearer <token>`
   - Returns 401 if missing or invalid format

2. **Token Verification**:
   - Extracts token from header
   - Verifies JWT using `verifyToken()` utility
   - Validates decoded token has `id` field
   - Returns 401 if token invalid

3. **User Lookup**:
   - Fetches user from database by ID
   - Excludes password from result
   - Returns 401 if user not found

4. **Account Status Check**:
   - Validates user is active (`isActive !== false`)
   - Returns 403 if account deactivated

5. **Request Enhancement**:
   - Attaches user object to `req.user`
   - Calls `next()` to continue request

**Error Handling**:
- Catches all errors and returns 401
- Logs errors in non-test environments
- Uses `asyncHandler` for async error handling

**`authorizeRoles` Middleware**:
- Factory function that returns middleware
- Checks if `req.user` exists
- Validates user role is in allowed roles list
- Returns 403 if insufficient permissions
- Used after `protect` middleware

**Usage Example**:
```javascript
router.get('/admin', protect, authorizeRoles('admin'), adminController);
```

**Configuration**:
- Uses `config.auth.jwtSecret` for token verification
- Uses `User` model for user lookup

---

#### 2. `errorHandler.js`
**Location**: `src/middleware/errorHandler.js`

**Purpose**: Global error handling middleware

**How It Works**:

1. **Error Status Code**:
   - Uses `err.statusCode` if present
   - Falls back to `res.statusCode` (if not 200)
   - Defaults to 500 (Internal Server Error)

2. **Response Format**:
   - Standard error response structure:
     ```json
     {
       "status": "error",
       "statusCode": <http_status_code>,
       "message": "<error_message>",
       "details": <optional_error_details>,
       "stack": <stack_trace_in_non_production>
     }
     ```

3. **Error Details**:
   - Includes `err.details` if present
   - Falls back to `err.errors` (validation errors)
   - Includes stack trace in non-production environments

4. **Error Logging**:
   - **Server Errors (500+)**: 
     - Logs as error level
     - Sends to Sentry (if configured)
     - Sends alert via `alerts.service`
   - **Client Errors (<500)**:
     - Logs as warning level
     - No Sentry or alerts

5. **Sentry Integration**:
   - Captures exceptions for server errors
   - Tags with component: 'express-error-handler'
   - Only if `config.sentry.dsn` is configured

6. **Response Handling**:
   - Only sends response if headers not already sent
   - Returns `undefined` if response already sent

**Error Sources**:
- Thrown errors from controllers
- Validation errors
- Database errors
- Authentication errors
- Custom `ApiError` instances

**Configuration**:
- `config.app.isProduction` - Controls stack trace inclusion
- `config.sentry.dsn` - Enables Sentry error tracking

**Middleware Order**:
- Must be last middleware (after routes)
- Catches all unhandled errors

---

#### 3. `maintenance.js`
**Location**: `src/middleware/maintenance.js`

**Purpose**: Maintenance mode middleware

**How It Works**:

1. **Bypass Check**:
   - Always allows OPTIONS requests (CORS preflight)
   - Checks if path should bypass maintenance:
     - `/status`
     - `/metrics`
     - `/api/live`
     - `/api/ready`
     - `/api/v1/admin/maintenance`
   - Allows GET requests to `/metrics`

2. **Maintenance State Check**:
   - Fetches maintenance state from `maintenance.service`
   - If maintenance not enabled, allows request through

3. **Read-Only Mode**:
   - If maintenance enabled and read-only mode:
     - Allows GET, HEAD, OPTIONS requests
     - Blocks POST, PUT, PATCH, DELETE requests

4. **Full Maintenance Mode**:
   - If maintenance enabled and not read-only:
     - Blocks all requests (except bypassed paths)

5. **Maintenance Response**:
   - Returns 503 (Service Unavailable)
   - Includes maintenance message
   - Includes read-only status
   - Includes maintenance metadata (updatedAt, updatedBy)

**Response Format**:
```json
{
  "status": "maintenance",
  "message": "<maintenance_message>",
  "readOnly": <boolean>,
  "updatedAt": "<iso_timestamp>",
  "updatedBy": { "id": "<user_id>", "email": "<email>" }
}
```

**Error Handling**:
- Catches errors from maintenance service
- Logs errors but allows request through (fail-open)
- Prevents maintenance service errors from blocking requests

**Configuration**:
- `config.maintenance.defaultMessage` - Default maintenance message
- Uses `maintenance.service` for state management

**Middleware Order**:
- Applied after security middleware
- Applied before route handlers
- Allows admin to manage maintenance mode

---

#### 4. `notFound.js`
**Location**: `src/middleware/notFound.js`

**Purpose**: 404 handler for undefined routes

**How It Works**:

1. **Route Matching**:
   - Only called if no route matches request
   - Must be placed after all route definitions

2. **Error Creation**:
   - Creates `ApiError` with status 404
   - Message: `Route not found: <originalUrl>`
   - Passes error to next middleware (errorHandler)

3. **Error Flow**:
   - Error is caught by `errorHandler` middleware
   - Returns standardized 404 response

**Response Format**:
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Route not found: /api/v1/invalid/path"
}
```

**Middleware Order**:
- Must be placed after all routes
- Must be before `errorHandler`

---

### Third-Party Middleware (Used in `app.js`)

#### 5. `helmet`
**Package**: `helmet`

**Purpose**: Security headers middleware

**How It Works**:
- Sets various HTTP security headers
- Prevents common web vulnerabilities
- Configures Content Security Policy
- Hides X-Powered-By header (also disabled explicitly)

**Applied**: `app.use(helmet())`

---

#### 6. `compression`
**Package**: `compression`

**Purpose**: Response compression middleware

**How It Works**:
- Compresses HTTP responses using gzip/deflate
- Reduces response size for better performance
- Automatically selects best compression method

**Applied**: `app.use(compression())`

---

#### 7. `cors`
**Package**: `cors`

**Purpose**: Cross-Origin Resource Sharing middleware

**How It Works**:

1. **Origin Matching**:
   - Supports wildcard patterns (`*`)
   - Supports exact origin matching
   - Supports regex patterns (via wildcard conversion)

2. **Origin Validation**:
   - Checks request origin against allowed origins
   - Allows requests with no origin (same-origin)
   - Returns CORS error if origin not allowed

3. **Credentials**:
   - Enables credentials (cookies, authorization headers)
   - Sets `Access-Control-Allow-Credentials: true`

**Configuration**:
- `config.cors.origins` - Array of allowed origins
- Supports wildcard patterns (e.g., `*.example.com`)

**Applied**: `app.use(cors(corsOptions))`

---

#### 8. `express.json` & `express.urlencoded`
**Package**: `express` (built-in)

**Purpose**: Request body parsing middleware

**How It Works**:

1. **JSON Parsing**:
   - Parses JSON request bodies
   - Limit: 1MB
   - Special handling for Stripe webhook (preserves raw body)

2. **URL Encoded Parsing**:
   - Parses form-encoded request bodies
   - Extended mode enabled
   - Special handling for Stripe webhook

3. **Stripe Webhook Handling**:
   - Custom `verify` function: `captureStripeWebhook`
   - Preserves raw body for signature verification
   - Only for `/api/v1/payments/webhook` endpoint

**Applied**:
- `app.use(express.json({ limit: '1mb', verify: captureStripeWebhook }))`
- `app.use(express.urlencoded({ extended: true, verify: captureStripeWebhook }))`

---

#### 9. `mongoSanitize`
**Package**: `express-mongo-sanitize`

**Purpose**: MongoDB injection prevention middleware

**How It Works**:
- Sanitizes request data to prevent NoSQL injection
- Removes MongoDB operators (`$`, `.`) from user input
- Prevents malicious query injection

**Applied**: `app.use(mongoSanitize())`

---

#### 10. `xss`
**Package**: `xss-clean`

**Purpose**: XSS (Cross-Site Scripting) prevention middleware

**How It Works**:
- Cleans user input to prevent XSS attacks
- Sanitizes request data
- Removes potentially malicious scripts

**Applied**: `app.use(xss())`

---

#### 11. `hpp`
**Package**: `hpp`

**Purpose**: HTTP Parameter Pollution prevention middleware

**How It Works**:
- Prevents HTTP parameter pollution attacks
- Selects last parameter value when duplicates exist
- Protects against malicious parameter manipulation

**Applied**: `app.use(hpp())`

---

#### 12. `rateLimit` (express-rate-limit)
**Package**: `express-rate-limit`

**Purpose**: Rate limiting middleware

**How It Works**:

1. **Rate Limiting**:
   - Limits requests per time window
   - Default: 100 requests per 15 minutes
   - Configurable via environment variables

2. **Headers**:
   - Uses standard headers (draft-7)
   - Disables legacy headers
   - Includes rate limit information in response

**Configuration**:
- `config.rateLimit.windowMs` - Time window (default: 15 minutes)
- `config.rateLimit.max` - Max requests (default: 100)

**Applied**: `app.use(limiter)`

---

#### 13. `morgan`
**Package**: `morgan`

**Purpose**: HTTP request logging middleware

**How It Works**:
- Logs HTTP requests in specified format
- Log level from config (dev/combined)
- Streams to Winston logger
- Disabled in test environment

**Configuration**:
- `config.logging.level` - Log format (dev/combined)
- Uses `logger.stream` for output

**Applied**: `app.use(morgan(config.logging.level, { stream: logger.stream }))`

---

#### 14. `Sentry Handlers`
**Package**: `@sentry/node`

**Purpose**: Error tracking and performance monitoring

**How It Works**:

1. **Request Handler**:
   - Captures request context for errors
   - Adds request data to error reports
   - Only enabled if `config.sentry.dsn` configured

2. **Tracing Handler**:
   - Performance monitoring
   - Tracks request duration
   - Only enabled if `tracesSampleRate > 0`

**Configuration**:
- `config.sentry.dsn` - Sentry DSN
- `config.sentry.tracesSampleRate` - Performance trace sampling rate
- `config.app.nodeEnv` - Environment name

**Applied**:
- `app.use(Sentry.Handlers.requestHandler())`
- `app.use(Sentry.Handlers.tracingHandler())` (conditional)
- `app.use(Sentry.Handlers.errorHandler())` (after routes)

---

#### 15. `requestMetricsMiddleware`
**Location**: `src/metrics/index.js`

**Purpose**: Prometheus metrics collection middleware

**How It Works**:

1. **Request Tracking**:
   - Records request start time
   - Tracks route label
   - Measures request duration

2. **Metrics Collection**:
   - Increments request counter (by method, route, status)
   - Records request duration in histogram
   - Updates total request count

3. **Latency Alerting**:
   - Checks if request duration exceeds threshold (2s)
   - Respects cooldown period (60s)
   - Sends alert via `alerts.service`

**Configuration**:
- `config.monitoring.latencyAlertThreshold` - Latency threshold (2s)
- `config.monitoring.latencyAlertCooldownMs` - Alert cooldown (60s)

**Applied**: `app.use(metrics.requestMetricsMiddleware)`

---

#### 16. `setDocsCache`
**Location**: `app.js` (inline)

**Purpose**: Cache control for API documentation

**How It Works**:
- Sets Cache-Control header for Swagger docs
- Public cache with 600 second TTL
- Improves documentation load performance

**Applied**: Before Swagger UI middleware

---

### Middleware Execution Order

The middleware is applied in the following order in `app.js`:

1. **Sentry Request Handler** (if configured)
2. **Sentry Tracing Handler** (if configured)
3. **Helmet** (security headers)
4. **Compression** (response compression)
5. **CORS** (cross-origin requests)
6. **Body Parsers** (JSON, URL-encoded)
7. **Mongo Sanitize** (NoSQL injection prevention)
8. **XSS Clean** (XSS prevention)
9. **HPP** (parameter pollution prevention)
10. **Rate Limiter** (request rate limiting)
11. **Metrics Middleware** (Prometheus metrics)
12. **Morgan** (HTTP logging, if not test)
13. **Static Files** (documentation portal)
14. **Maintenance Middleware** (maintenance mode check)
15. **GraphQL** (Apollo Server)
16. **API Routes** (`/api`)
17. **Swagger Docs** (`/api/v1/docs`)
18. **Metrics Route** (`/metrics`)
19. **Not Found** (404 handler)
20. **Sentry Error Handler** (if configured)
21. **Error Handler** (global error handling)

---

## Utilities

### Utility Files (`src/utils/`)

#### 1. `ApiError.js`
**Location**: `src/utils/ApiError.js`

**Purpose**: Custom error class for API errors

**How It Works**:

1. **Class Definition**:
   - Extends native `Error` class
   - Adds `statusCode` property
   - Adds optional `details` property

2. **Constructor**:
   ```javascript
   constructor(statusCode, message, details = undefined)
   ```

3. **Stack Trace**:
   - Captures stack trace using `Error.captureStackTrace`
   - Excludes constructor from stack trace

**Properties**:
- `statusCode` (Number) - HTTP status code
- `message` (String) - Error message
- `details` (Any) - Optional error details
- `stack` (String) - Stack trace

**Usage Example**:
```javascript
throw new ApiError(404, 'User not found', { userId: '123' });
```

**Integration**:
- Used by `notFound` middleware
- Used by controllers for error handling
- Caught by `errorHandler` middleware

---

#### 2. `generateOrderId.js`
**Location**: `src/utils/generateOrderId.js`

**Purpose**: Order ID generation utility

**How It Works**:

1. **Timestamp Generation**:
   - Gets current ISO timestamp
   - Removes separators: `-`, `:`, `T`, `.`, `Z`
   - Takes first 12 characters (YYYYMMDDHHmm)

2. **Random Component**:
   - Generates 2 random bytes
   - Converts to hexadecimal
   - Converts to uppercase
   - Results in 4-character hex string

3. **ID Format**:
   - Format: `TFT-{timestamp}-{random}`
   - Example: `TFT-202501011430-A1B2`

**Function**:
```javascript
generateOrderId() → String
```

**Usage**:
- Used as default value in Order model schema
- Called automatically when creating new orders
- Ensures unique order identifiers

**Characteristics**:
- **Uniqueness**: Timestamp + random ensures uniqueness
- **Readability**: Human-readable format
- **Sortability**: Chronologically sortable by timestamp
- **Length**: Fixed length (19 characters)

---

#### 3. `token.js`
**Location**: `src/utils/token.js`

**Purpose**: JWT token utilities

**Exported Functions**:

**`signToken(payload, options)`**:
- Creates JWT token from payload
- Signs with `config.auth.jwtSecret`
- Sets expiry from `config.auth.tokenExpiry` (default: '7d')
- Supports additional JWT options

**`verifyToken(token)`**:
- Verifies JWT token signature
- Validates token expiry
- Returns decoded payload
- Throws error if invalid

**How It Works**:

1. **Token Signing**:
   - Uses `jsonwebtoken.sign()`
   - Payload typically: `{ id: userId, role: userRole }`
   - Secret from config
   - Expiry: 7 days (configurable)

2. **Token Verification**:
   - Uses `jsonwebtoken.verify()`
   - Validates signature
   - Checks expiry
   - Returns decoded payload

**Configuration**:
- `config.auth.jwtSecret` - Secret key for signing/verification
- `config.auth.tokenExpiry` - Token expiration (default: '7d')

**Usage**:
- Used by `auth.controller` for token generation
- Used by `auth.js` middleware for token verification
- Used by GraphQL context for authentication

**Security**:
- Secret stored in environment variable
- Tokens expire after configured period
- Signature prevents tampering

---

## Middleware Summary

### Custom Middleware (4)
1. **auth.js** - JWT authentication & role authorization
2. **errorHandler.js** - Global error handling
3. **maintenance.js** - Maintenance mode enforcement
4. **notFound.js** - 404 route handler

### Third-Party Middleware (11)
1. **helmet** - Security headers
2. **compression** - Response compression
3. **cors** - Cross-origin resource sharing
4. **express.json** - JSON body parsing
5. **express.urlencoded** - Form body parsing
6. **mongoSanitize** - NoSQL injection prevention
7. **xss** - XSS attack prevention
8. **hpp** - Parameter pollution prevention
9. **rateLimit** - Request rate limiting
10. **morgan** - HTTP request logging
11. **Sentry Handlers** - Error tracking & performance monitoring

### Application Middleware (2)
1. **requestMetricsMiddleware** - Prometheus metrics
2. **setDocsCache** - Documentation caching

**Total Middleware**: 17

---

## Utilities Summary

### Utility Files (3)
1. **ApiError.js** - Custom error class
2. **generateOrderId.js** - Order ID generation
3. **token.js** - JWT token signing & verification

**Total Utilities**: 3

---

## Middleware Flow Diagram

```
Request
  ↓
Sentry Request Handler
  ↓
Security Middleware (helmet, cors, compression)
  ↓
Body Parsers (JSON, URL-encoded)
  ↓
Security Middleware (mongoSanitize, xss, hpp)
  ↓
Rate Limiter
  ↓
Metrics Middleware
  ↓
Logging (morgan)
  ↓
Static Files / Routes
  ↓
Maintenance Middleware
  ↓
GraphQL / API Routes
  ↓
Not Found Handler
  ↓
Sentry Error Handler
  ↓
Error Handler
  ↓
Response
```

---

## Security Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Account status validation

### Input Security
- MongoDB injection prevention
- XSS attack prevention
- Parameter pollution prevention
- Request body size limits

### Request Security
- CORS protection
- Rate limiting
- Security headers (helmet)
- Request sanitization

### Error Security
- Error message sanitization (production)
- Stack trace hiding (production)
- Error logging & monitoring

---

## Configuration Dependencies

### Middleware Configuration
- `config.cors.origins` - CORS allowed origins
- `config.rateLimit.windowMs` - Rate limit window
- `config.rateLimit.max` - Rate limit max requests
- `config.logging.level` - Log format
- `config.sentry.dsn` - Sentry DSN
- `config.sentry.tracesSampleRate` - Trace sampling
- `config.maintenance.*` - Maintenance mode settings
- `config.monitoring.*` - Metrics & alerting settings

### Utility Configuration
- `config.auth.jwtSecret` - JWT secret key
- `config.auth.tokenExpiry` - Token expiration

---

## Notes

1. **Middleware Order**: Order matters - security middleware should be early, error handlers should be last
2. **Error Handling**: All errors flow through `errorHandler` middleware
3. **Authentication**: `protect` middleware must be used before `authorizeRoles`
4. **Maintenance Mode**: Can be toggled via admin API without restart
5. **Rate Limiting**: Applied globally to all routes
6. **Metrics**: Collected for all requests automatically
7. **Security**: Multiple layers of security middleware protect the application

