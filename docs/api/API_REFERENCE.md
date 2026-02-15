# Tifto API Reference

Complete request/response documentation for all REST endpoints, GraphQL queries, mutations, and subscriptions.

---

## Document Structure

The API reference is split into **7 chunks** for easier navigation:

| Chunk | File | Content |
|-------|------|---------|
| 1 | [01-system.md](01-system.md) | System & Health Endpoints (no auth) |
| 2 | [02-auth-users.md](02-auth-users.md) | REST Auth, Users, Addresses |
| 3 | [03-orders-products-restaurants-categories.md](03-orders-products-restaurants-categories.md) | REST Orders, Products, Restaurants, Categories |
| 4 | [04-admin-seller-rider-customer-payments-privacy-upload.md](04-admin-seller-rider-customer-payments-privacy-upload.md) | REST Admin, Seller, Rider, Customer, Payments, Privacy, Upload |
| 5 | [05-graphql-queries.md](05-graphql-queries.md) | GraphQL Queries |
| 6 | [06-graphql-mutations.md](06-graphql-mutations.md) | GraphQL Mutations |
| 7 | [07-graphql-subscriptions.md](07-graphql-subscriptions.md) | GraphQL Subscriptions (WebSocket) |

---

## Quick Reference

### REST Base URL

- **Base:** `/api/v1`
- **Auth:** Most endpoints require `Authorization: Bearer <token>`
- **Content-Type:** `application/json`

### GraphQL

- **Endpoint:** `POST /graphql`
- **Subscriptions:** WebSocket at `/graphql`
- **Auth:** `Authorization: Bearer <token>` header (or in WebSocket connection params)

### Route Path Summary

```
/api/v1/health
/api/v1/version
/api/v1/auth/register, /login, /me
/api/v1/register, /login (legacy)
/api/v1/users/*
/api/v1/orders/*
/api/v1/products/*
/api/v1/admin/*
/api/v1/seller/*
/api/v1/rider/*
/api/v1/customer/*
/api/v1/payments/webhook
/api/v1/privacy/*
/api/v1/upload/image
/api/v1/restaurants, /restaurants/:id, /restaurants/:id/products
/api/v1/categories, /categories/:id/products
/api/v1/address/:userId, POST /address
/graphql (POST + WebSocket)
/metrics
```

---

## Response Format

### REST Success

- **200:** `{ ...data }` or array
- **201:** `{ ...created resource }`

### REST Errors

- **400:** Bad request (invalid input)
- **401:** Unauthorized (missing/invalid token)
- **403:** Forbidden (insufficient role)
- **404:** Not found
- **422:** Validation errors `{ errors: [...] }`
- **500:** Server error

### GraphQL

- Success: `{ "data": { "queryName": { ... } } }`
- Error: `{ "errors": [{ "message": "...", "path": [...] }] }`

---

## Authentication

1. **Register/Login** via REST (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`) or GraphQL (`login`, `restaurantLogin`, `ownerLogin`, `riderLogin` mutations)
2. Receive `token` (JWT) in response
3. Include in subsequent requests: `Authorization: Bearer <token>`

---

## Roles

- **customer** – Browse, order, profile, addresses
- **seller** – Restaurant management, orders, menu
- **rider** – Assigned orders, delivery flow
- **admin** – Full access, dashboard, maintenance
