# Chunk 3: REST - Orders, Products, Restaurants, Categories

---

## Order Routes (`/api/v1/orders`)

All require **Bearer token**. Role restrictions noted per endpoint.

### GET /api/v1/orders

**Auth:** Bearer, role: **admin** | **seller**

**Request Query:**
- `restaurant` (optional): restaurant ID
- `seller` (optional): seller ID
- `rider` (optional): rider ID
- `customer` (optional): customer ID
- `orderStatus` (optional): filter by status
- `isActive` (optional): true | false
- `search` (optional): search by orderId
- `startDate`, `endDate` (optional): date range
- `zone` (optional): zone ID
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response 200:**
```json
{
  "total": 50,
  "page": 1,
  "limit": 20,
  "results": [
    {
      "_id": "...",
      "orderId": "...",
      "restaurant": { "name", "image", "address" },
      "customer": { "name", "phone", "email" },
      "rider": { "name", "username", "riderProfile" },
      "items": [],
      "orderAmount": 100,
      "orderStatus": "pending",
      ...
    }
  ]
}
```

---

### GET /api/v1/orders/active

**Auth:** Bearer, role: **admin** | **seller** | **rider**

**Request Query:**
- `restaurantId` (optional): filter by restaurant
- `actions` (optional): comma-separated statuses (default: pending,accepted,preparing,ready,picked,enroute)

**Response 200:**
```json
{
  "totalCount": 5,
  "orders": [ { "order object" } ]
}
```

---

### GET /api/v1/orders/restaurant/:restaurantId

**Auth:** Bearer, role: **admin** | **seller**

**Request Query:** `search` (optional)

**Response 200:** Array of order objects

---

### GET /api/v1/orders/:id

**Auth:** Bearer, role: admin | seller | rider | customer

**Response 200:** Single order object (populated customer, restaurant, rider)

**Errors:** 404

---

### POST /api/v1/orders

**Auth:** Bearer, role: **customer** | **admin**

**Request Body:**
```json
{
  "restaurant": "restaurantId (required)",
  "items": [
    {
      "food": "productId",
      "title": "string",
      "description": "string",
      "image": "string",
      "quantity": 1,
      "variation": { "_id", "title", "price", "discounted", "addons" },
      "addons": [],
      "specialInstructions": "string"
    }
  ],
  "orderAmount": 100,
  "paidAmount": 100,
  "deliveryCharges": 10,
  "tipping": 5,
  "taxationAmount": 8,
  "paymentMethod": "card|cash|wallet",
  "deliveryAddress": {
    "deliveryAddress": "string (required)",
    "details": "string",
    "label": "string",
    "location": {}
  },
  "instructions": "string",
  "customer": "customerId (optional, uses auth user if not provided)"
}
```

**Response 201:** Created order object

**Errors:** 404 (restaurant/customer not found), 422 (validation)

---

### PATCH /api/v1/orders/:id/status

**Auth:** Bearer, role: **admin** | **seller** | **rider**

**Request Body:**
```json
{
  "status": "pending|accepted|preparing|ready|picked|enroute|delivered|cancelled|refunded",
  "note": "string (optional)",
  "preparationTime": "number (optional, for preparing)"
}
```

**Response 200:** Updated order object

**Errors:** 404, 422 (invalid status)

---

### POST /api/v1/orders/:id/assign

**Auth:** Bearer, role: **admin**

**Request Body:**
```json
{
  "riderId": "rider userId (required)"
}
```

**Response 200:** Updated order object (with rider assigned)

**Errors:** 400 (invalid rider), 404

---

### POST /api/v1/orders/:id/review

**Auth:** Bearer, role: **customer**

**Request Body:**
```json
{
  "rating": "integer (1-5, required)",
  "comment": "string (optional)"
}
```

**Response 200:** Updated order object (with review)

**Errors:** 404, 422 (invalid rating)

---

## Product Routes (`/api/v1/products`)

All require **Bearer token**, role: admin | seller.

### GET /api/v1/products

**Request Query:**
- `restaurant` (optional)
- `search` (optional): search title, description
- `isActive` (optional): true | false
- `page` (optional, default: 1)
- `limit` (optional, default: 25)

**Response 200:**
```json
{
  "total": 50,
  "page": 1,
  "limit": 25,
  "results": [
    {
      "_id": "...",
      "title": "...",
      "price": 10,
      "discountedPrice": 8,
      "restaurant": { "name", "slug" },
      "variations": [],
      "addons": [],
      ...
    }
  ]
}
```

---

### POST /api/v1/products

**Request Body:**
```json
{
  "title": "string (required)",
  "price": "number (required)",
  "restaurant": "restaurantId (required)",
  "description": "string",
  "image": "string",
  "discountedPrice": "number",
  "subCategory": "string",
  "variations": [ { "title", "price", "discounted", "default", "sku" } ],
  "categories": [ "categoryId" ]
}
```
*If no variations provided, a default "Standard" variation is created.*

**Response 201:** Created product object

**Errors:** 404 (restaurant not found), 422 (validation)

---

### PUT /api/v1/products/:id

**Request Body (all optional):**
```json
{
  "title": "string",
  "price": "number",
  "discountedPrice": "number",
  "description": "string",
  "image": "string",
  "categories": [ "categoryId" ]
}
```

**Response 200:** Updated product object

**Errors:** 404, 422

---

### DELETE /api/v1/products/:id

**Response 200:**
```json
{
  "message": "Product deleted successfully"
}
```

**Errors:** 404

---

### PATCH /api/v1/products/:id/availability

**Request Body:**
```json
{
  "available": "boolean (required)"
}
```

**Response 200:** Updated product object

**Errors:** 404, 422

---

## Restaurant Routes (`/api/v1`)

**Auth:** None (public)

### GET /api/v1/restaurants

**Response 200:**
```json
{
  "status": "success",
  "data": [ { "restaurant objects", limit 20 } ]
}
```

---

### GET /api/v1/restaurants/:id

**Response 200:**
```json
{
  "status": "success",
  "data": { "restaurant object" }
}
```

**Errors:** 404

---

### GET /api/v1/restaurants/:id/products

**Response 200:**
```json
{
  "status": "success",
  "data": [ { "product objects" } ]
}
```

---

## Category Routes (`/api/v1`)

**Auth:** None (public)

### GET /api/v1/categories

**Response 200:**
```json
{
  "status": "success",
  "data": [ { "category objects" } ]
}
```

---

### GET /api/v1/categories/:id/products

**Response 200:**
```json
{
  "status": "success",
  "data": [ { "product objects (populated foods)" } ]
}
```

**Errors:** 404 (category not found)

---

**Source files:** `src/routes/order.routes.js`, `src/routes/product.routes.js`, `src/routes/restaurantRoutes.js`, `src/routes/categoryRoutes.js`, `src/controllers/order.controller.js`, `src/controllers/product.controller.js`, `src/controllers/restaurantController.js`, `src/controllers/categoryController.js`
