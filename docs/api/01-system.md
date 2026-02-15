# Chunk 1: System & Health Endpoints

All endpoints in this section require **no authentication**.

---

## GET /

**Auth:** None

**Request:** None

**Response 200:**
```json
{
  "status": "ok",
  "message": "Welcome to the unified Tifto API",
  "links": {
    "docs": "/api/v1/docs",
    "status": "/status",
    "metrics": "/metrics",
    "portal": "/portal"
  }
}
```

---

## GET /api/live

**Auth:** None

**Request:** None

**Response 200:**
```json
{
  "status": "live",
  "uptime": 123.456
}
```

---

## GET /api/ready

**Auth:** None

**Request:** None

**Response 200** (when MongoDB is connected):
```json
{
  "status": "ready",
  "mongoState": "connected"
}
```

**Response 503** (when MongoDB is not connected):
```json
{
  "status": "not-ready",
  "mongoState": "disconnected"
}
```
*`mongoState` can be: `disconnected`, `connected`, `connecting`, `disconnecting`, `unknown`*

---

## GET /health

**Auth:** None

**Request:** None

**Response 200** (healthy):
```json
{
  "status": "healthy",
  "timestamp": "2025-02-04T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "mongodb": {
      "status": "connected",
      "connected": true
    },
    "graphql": {
      "status": "running",
      "endpoint": "/graphql"
    }
  },
  "system": {
    "platform": "linux",
    "hostname": "hostname",
    "memory": {
      "total": 16384,
      "free": 8192,
      "used": 8192
    },
    "cpus": 8
  }
}
```

**Response 503** (unhealthy):
Same structure with `"status": "unhealthy"`. Returned when MongoDB is disconnected or GraphQL is not ready.

---

## GET /status

**Auth:** None

**Request:** None

**Response 200:** HTML page with version, commit, uptime, MongoDB state, requests served, hostname, and links.

---

## GET /api/v1/health

**Auth:** None

**Request:** None

**Response 200:**
```json
{
  "status": "ok"
}
```

---

## GET /api/v1/version

**Auth:** None

**Request:** None

**Response 200:**
```json
{
  "version": "1.0.0",
  "commit": "0123456789abcdef"
}
```

---

## GET /graphql/health

**Auth:** None

**Request:** None

**Response 200:**
```json
{
  "status": "ok",
  "message": "GraphQL endpoint is available",
  "endpoint": "/graphql"
}
```

**Response 200** (when initializing):
```json
{
  "status": "initializing",
  "message": "GraphQL endpoint is initializing",
  "endpoint": "/graphql"
}
```

---

## GET /metrics

**Auth:** None

**Request:** None

**Response 200:** Prometheus text exposition format (Content-Type: text/plain)

---

**Source files:** `src/app.js`, `src/routes/health.routes.js`, `src/routes/version.routes.js`, `src/routes/metrics.routes.js`
