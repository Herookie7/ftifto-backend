# Chunk 2: REST - Auth & Users

---

## Auth Routes (`/api/v1/auth`)

### POST /api/v1/auth/register

**Auth:** None (strict rate limit applied)

**Request Body:**
```json
{
  "name": "string (required)",
  "password": "string (required, min 6 chars)",
  "role": "customer | seller | rider | admin (optional)"
}
```
*Note: `email` and `phone` may be sent; at least one identifier (email or phone) is typically needed.*

**Response 201:**
```json
{
  "token": "JWT string",
  "user": { "_id", "name", "email", "phone", "role", ... }
}
```

**Errors:** 409 (user exists), 422 (validation errors)

---

### POST /api/v1/auth/login

**Auth:** None (strict rate limit applied)

**Request Body:**
```json
{
  "identifier": "string (required - email, phone, or username)",
  "password": "string (required)"
}
```

**Response 200:**
```json
{
  "token": "JWT string",
  "user": { "_id", "name", "email", "phone", "role", ... }
}
```

**Errors:** 401 (invalid credentials), 403 (account deactivated), 422 (validation errors)

---

### GET /api/v1/auth/me

**Auth:** Bearer token required

**Request:** Header `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "user": { "_id", "name", "email", "phone", "role", ... }
}
```

**Errors:** 401 (unauthorized)

---

## Legacy Auth Routes (`/api/v1`)

### POST /api/v1/register

**Auth:** None

**Request Body:** User creation fields (e.g. `email`, and other User model fields)

**Response 200:**
```json
{
  "status": "success",
  "data": { "user object" }
}
```

**Errors:** 400 (email already exists), 500

---

### POST /api/v1/login

**Auth:** None

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response 200:**
```json
{
  "status": "success",
  "data": { "user object" }
}
```

**Errors:** 404 (user not found), 500

---

## User Routes (`/api/v1/users`)

All require **Bearer token**. Role restrictions noted per endpoint.

### GET /api/v1/users

**Auth:** Bearer, role: **admin**

**Request Query:**
- `role` (optional): customer | seller | rider | admin
- `search` (optional): search name, email, phone
- `page` (optional, default: 1)
- `limit` (optional, default: 25)
- `isActive` (optional): true | false

**Response 200:**
```json
{
  "total": 100,
  "page": 1,
  "limit": 25,
  "results": [{ "_id", "name", "email", "phone", "role", ... }]
}
```

---

### GET /api/v1/users/stats

**Auth:** Bearer, role: **admin**

**Request:** None

**Response 200:**
```json
{
  "customer": { "total": 50, "active": 48 },
  "seller": { "total": 10, "active": 9 },
  "rider": { "total": 5, "active": 4 },
  "admin": { "total": 1, "active": 1 }
}
```

---

### GET /api/v1/users/:id

**Auth:** Bearer, role: admin | seller | rider | customer

**Response 200:** User object (password excluded)

**Errors:** 404 (user not found)

---

### PUT /api/v1/users/:id

**Auth:** Bearer, role: **admin**

**Request Body (all optional):**
```json
{
  "name": "string",
  "email": "string (valid email)",
  "phone": "string",
  "role": "customer | seller | rider | admin"
}
```

**Response 200:** Updated user object

**Errors:** 404, 422 (validation)

---

### POST /api/v1/users/:id/toggle

**Auth:** Bearer, role: **admin**

**Request:** None (toggles `isActive`)

**Response 200:**
```json
{
  "message": "User activated successfully",
  "user": { "user object" }
}
```

**Errors:** 404

---

## Address Routes (`/api/v1`)

### GET /api/v1/address/:userId

**Auth:** None

**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "...",
      "label": "Home",
      "deliveryAddress": "...",
      "details": "...",
      "selected": true,
      "location": { ... }
    }
  ]
}
```

**Errors:** 404 (user not found), 500

---

### POST /api/v1/address

**Auth:** None

**Request Body:**
```json
{
  "user": "userId (required)",
  "label": "string (optional)",
  "deliveryAddress": "string",
  "details": "string",
  "location": { ... },
  "selected": "boolean"
}
```

**Response 200:**
```json
{
  "status": "success",
  "data": { "new address object" }
}
```

**Errors:** 404 (user not found), 500

---

**Source files:** `src/routes/auth.routes.js`, `src/routes/authRoutes.js`, `src/routes/user.routes.js`, `src/routes/addressRoutes.js`, `src/controllers/auth.controller.js`, `src/controllers/authController.js`, `src/controllers/user.controller.js`, `src/controllers/addressController.js`
