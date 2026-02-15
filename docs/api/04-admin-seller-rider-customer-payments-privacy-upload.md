# Chunk 4: REST - Admin, Seller, Rider, Customer, Payments, Privacy, Upload

---

## Admin Routes (`/api/v1/admin`)

All require **Bearer token**, role: **admin**.

### GET /api/v1/admin/dashboard

**Request:** None

**Response 200:**
```json
{
  "orders": [
    { "_id": "orderStatus", "count": 10, "totalAmount": 1000, "paidAmount": 950 }
  ],
  "users": [
    { "_id": "role", "total": 50, "active": 48 }
  ],
  "activeRestaurants": 10
}
```

---

### GET /api/v1/admin/restaurants

**Request Query:**
- `search` (optional): search name, address
- `isActive` (optional): true | false
- `isAvailable` (optional): true | false

**Response 200:** Array of restaurant objects (populated owner)

---

### GET /api/v1/admin/restaurants/:id

**Response 200:** Single restaurant object (populated owner)

**Errors:** 404

---

### POST /api/v1/admin/restaurants

**Request Body:**
```json
{
  "name": "string (required)",
  "owner": "userId (required, must be seller)",
  "address": "string (required)"
}
```

**Response 201:** Created restaurant object

**Errors:** 400 (owner must be seller), 422 (validation)

---

### PUT /api/v1/admin/restaurants/:id

**Request Body (all optional):**
```json
{
  "name": "string",
  "address": "string",
  "commissionRate": "number"
}
```

**Response 200:** Updated restaurant object

**Errors:** 404, 422

---

### POST /api/v1/admin/restaurants/:id/toggle

**Request:** None (toggles `isAvailable`)

**Response 200:** Updated restaurant object

**Errors:** 404

---

### DELETE /api/v1/admin/restaurants/:id

**Request:** None (soft delete: sets isActive, isAvailable to false)

**Response 200:**
```json
{
  "message": "Restaurant deleted successfully",
  "restaurant": { "restaurant object" },
  "associatedOrders": 5,
  "associatedProducts": 20
}
```

**Errors:** 404

---

### GET /api/v1/admin/maintenance

**Request:** None

**Response 200:** Maintenance state object (enabled, readOnly, message, etc.)

---

### POST /api/v1/admin/maintenance

**Request Body:**
```json
{
  "enabled": "boolean (required)",
  "readOnly": "boolean (optional)",
  "message": "string (optional)"
}
```

**Response 200:** Updated maintenance state

**Errors:** 422 (validation)

---

## Seller Routes (`/api/v1/seller`)

All require **Bearer token**, role: **seller**.

### GET /api/v1/seller/profile

**Response 200:**
```json
{
  "restaurant": { "restaurant object" },
  "metrics": {
    "activeOrders": 5
  }
}
```

**Errors:** 404 (restaurant profile not found)

---

### GET /api/v1/seller/orders

**Request Query:** `status` (optional)

**Response 200:** Array of order objects (populated customer, rider)

**Errors:** 404 (restaurant profile not found)

---

### GET /api/v1/seller/menu

**Response 200:** Array of product objects

**Errors:** 404 (restaurant profile not found)

---

### PUT /api/v1/seller/restaurant

**Request Body (all optional):**
```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "description": "string",
  "image": "string",
  "logo": "string",
  "deliveryTime": "number",
  "minimumOrder": "number",
  "deliveryCharges": "number",
  "location": [ "longitude", "latitude" ]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Restaurant updated successfully",
  "restaurant": { "restaurant object" }
}
```

**Errors:** 400 (invalid coordinates), 404, 422

---

### PATCH /api/v1/seller/availability

**Request Body:**
```json
{
  "isAvailable": "boolean (required)"
}
```

**Response 200:** Updated restaurant object

**Errors:** 404, 422

---

### PATCH /api/v1/seller/orders/:id/preparation

**Request Body:**
```json
{
  "preparationTime": "number (optional)",
  "expectedTime": "ISO8601 string (optional)"
}
```

**Response 200:** Updated order object

**Errors:** 404

---

### PATCH /api/v1/seller/menu/availability

**Request Body:**
```json
{
  "productIds": [ "productId" ],
  "available": "boolean (required)"
}
```

**Response 200:**
```json
{
  "message": "Menu availability updated"
}
```

**Errors:** 404, 422

---

## Rider Routes (`/api/v1/rider`)

All require **Bearer token**, role: **rider**.

### GET /api/v1/rider/orders

**Request Query:** `status` (optional, else defaults to assigned|picked|enroute)

**Response 200:** Array of order objects (populated restaurant, customer)

---

### PATCH /api/v1/rider/status

**Request Body:**
```json
{
  "available": "boolean (required)"
}
```

**Response 200:** Updated user (rider) object

**Errors:** 422

---

### PATCH /api/v1/rider/location

**Request Body:**
```json
{
  "coordinates": [ "longitude", "latitude" ]
}
```

**Response 200:** Updated rider object (with riderProfile.location)

**Errors:** 422

---

### POST /api/v1/rider/orders/:id/pickup

**Response 200:** Updated order object (status: picked, isPickedUp: true)

**Errors:** 404 (order not found or not assigned to this rider)

---

### POST /api/v1/rider/orders/:id/deliver

**Response 200:** Updated order object (status: delivered, paymentStatus updated)

**Errors:** 404

---

## Customer Routes (`/api/v1/customer`)

All require **Bearer token**, role: **customer**.

### GET /api/v1/customer/profile

**Response 200:** Current user object

---

### GET /api/v1/customer/orders

**Request Query:** `status` (optional)

**Response 200:** Array of order objects (populated restaurant)

---

### GET /api/v1/customer/restaurants

**Request Query:**
- `search` (optional)
- `cuisine` (optional): comma-separated
- `available` (optional): true | false

**Response 200:** Array of restaurant objects (limit 50, active only)

---

### GET /api/v1/customer/restaurants/:restaurantId/menu

**Response 200:**
```json
{
  "restaurant": { "restaurant object" },
  "products": [ { "product objects" } ]
}
```

**Errors:** 404

---

### POST /api/v1/customer/addresses

**Request Body:**
```json
{
  "label": "string (optional)",
  "street": "string (required)",
  "city": "string (required)",
  "coordinates": [ "lng", "lat" ]
}
```

**Response 201:** Array of addresses (full addressBook)

**Errors:** 422 (validation)

---

## Payment Routes (`/api/v1/payments`)

### POST /api/v1/payments/webhook

**Auth:** None (signature verification by provider)

**Request:**
- **Stripe:** Raw body (for signature verification), `Stripe-Signature` header
- **Razorpay:** Raw body, `X-Razorpay-Signature` header

**Routing:** If `X-Razorpay-Signature` header present, handled by Razorpay; else Stripe.

**Response:** Varies by provider (typically 200 for success, 400 for signature failure)

---

## Privacy Routes (`/api/v1/privacy`)

**Auth:** Optional (some endpoints use req.user if authenticated)

### POST /api/v1/privacy/request-deletion

**Request Body:**
```json
{
  "email": "string (optional if authenticated)",
  "reason": "string (optional, max 500 chars)"
}
```

**Response 201:**
```json
{
  "requestId": "string",
  "status": "pending",
  "message": "Your deletion request has been received."
}
```

**Response 200** (existing request):
```json
{
  "requestId": "string",
  "status": "pending",
  "message": "A deletion request is already in progress."
}
```

**Errors:** 400 (email required when not authenticated), 422

---

### POST /api/v1/privacy/request-portability

**Request Body:**
```json
{
  "email": "string (optional if authenticated)"
}
```

**Response 201:**
```json
{
  "requestId": "string",
  "status": "completed",
  "downloadUrl": "signed S3 URL",
  "expiresAt": "ISO8601"
}
```

**Errors:** 400 (email required), 404 (no data found), 503 (S3 not configured), 422

---

### GET /api/v1/privacy/status/:requestId

**Request:** Path param `requestId` (MongoId)

**Response 200:**
```json
{
  "requestId": "string",
  "status": "string",
  "requestedAt": "ISO8601",
  "resolvedAt": "ISO8601",
  "notes": "string",
  "downloadUrl": "string (for data_portability)",
  "expiresAt": "ISO8601"
}
```

**Errors:** 404 (request not found)

---

## Upload Routes (`/api/v1/upload`)

**Auth:** Bearer token required

### POST /api/v1/upload/image

**Request Body:**
```json
{
  "imageUrl": "string (URL, must start with http:// or https://)"
}
```

**Response 200:**
```json
{
  "success": true,
  "imageUrl": "provided URL",
  "message": "Image URL accepted"
}
```

**Errors:** 400 (invalid or missing imageUrl)

---

**Source files:** `src/routes/admin.routes.js`, `src/routes/seller.routes.js`, `src/routes/rider.routes.js`, `src/routes/customer.routes.js`, `src/routes/payments.routes.js`, `src/routes/privacy.routes.js`, `src/routes/upload.routes.js`, and corresponding controllers
