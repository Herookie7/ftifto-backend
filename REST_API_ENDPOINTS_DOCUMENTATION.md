# REST API & Controllers Documentation

## Overview
This document lists all controllers and REST API endpoints found in the `ftifto-backend/src` folder, including HTTP methods and full endpoint paths.

**Base Path**: `/api/v1` (routes are mounted at `/api` and redirected to `/api/v1`)

---

## Controllers

### 1. `auth.controller.js`
**Location**: `src/controllers/auth.controller.js`

**Exported Functions**:
- `registerUser` - User registration
- `loginUser` - User authentication
- `getCurrentUser` - Get current authenticated user

---

### 2. `user.controller.js`
**Location**: `src/controllers/user.controller.js`

**Exported Functions**:
- `getUsers` - Get all users (paginated)
- `getUserById` - Get user by ID
- `updateUser` - Update user details
- `toggleUserActiveStatus` - Toggle user active/inactive status
- `getRoleCounts` - Get user counts by role

---

### 3. `order.controller.js`
**Location**: `src/controllers/order.controller.js`

**Exported Functions**:
- `createOrder` - Create a new order
- `getOrders` - Get orders (paginated, filtered)
- `getOrderById` - Get order by ID
- `updateOrderStatus` - Update order status
- `assignRider` - Assign rider to order
- `getActiveOrders` - Get active orders
- `getRestaurantOrders` - Get orders for a restaurant
- `captureOrderFeedback` - Submit order review/feedback

---

### 4. `product.controller.js`
**Location**: `src/controllers/product.controller.js`

**Exported Functions**:
- `getProducts` - Get products (paginated, filtered)
- `createProduct` - Create a new product
- `updateProduct` - Update product details
- `deleteProduct` - Delete a product
- `updateProductAvailability` - Update product availability status

---

### 5. `admin.controller.js`
**Location**: `src/controllers/admin.controller.js`

**Exported Functions**:
- `getDashboardSummary` - Get admin dashboard statistics
- `getRestaurants` - Get all restaurants (filtered)
- `createRestaurant` - Create a new restaurant
- `updateRestaurant` - Update restaurant details
- `toggleRestaurantAvailability` - Toggle restaurant availability
- `getMaintenanceStatus` - Get maintenance mode status
- `updateMaintenanceMode` - Enable/disable maintenance mode

---

### 6. `seller.controller.js`
**Location**: `src/controllers/seller.controller.js`

**Exported Functions**:
- `getSellerProfile` - Get seller profile with restaurant info
- `getSellerOrders` - Get orders for seller's restaurant
- `updateSellerAvailability` - Update restaurant availability
- `updateOrderPreparationTime` - Update order preparation time
- `getSellerMenu` - Get seller's menu/products
- `bulkUpdateProductAvailability` - Bulk update product availability

---

### 7. `rider.controller.js`
**Location**: `src/controllers/rider.controller.js`

**Exported Functions**:
- `getAssignedOrders` - Get orders assigned to rider
- `updateRiderStatus` - Update rider availability status
- `updateRiderLocation` - Update rider GPS location
- `confirmPickup` - Confirm order pickup
- `confirmDelivery` - Confirm order delivery

---

### 8. `customer.controller.js`
**Location**: `src/controllers/customer.controller.js`

**Exported Functions**:
- `getCustomerProfile` - Get customer profile
- `getCustomerOrders` - Get customer's order history
- `getRestaurantMenu` - Get restaurant menu
- `browseRestaurants` - Browse/search restaurants
- `saveAddress` - Save customer address

---

### 9. `privacy.controller.js`
**Location**: `src/controllers/privacy.controller.js`

**Exported Functions**:
- `requestDeletion` - Request data deletion (GDPR)
- `requestDataPortability` - Request data export (GDPR)
- `getRequestStatus` - Get privacy request status

---

### 10. `restaurantController.js`
**Location**: `src/controllers/restaurantController.js`

**Exported Functions**:
- `getRestaurants` - Get list of restaurants
- `getRestaurant` - Get restaurant by ID
- `getProductsByRestaurant` - Get products for a restaurant

---

### 11. `categoryController.js`
**Location**: `src/controllers/categoryController.js`

**Exported Functions**:
- `getCategories` - Get all categories
- `getCategoryProducts` - Get products in a category

---

### 12. `authController.js`
**Location**: `src/controllers/authController.js`

**Exported Functions**:
- `register` - User registration (alternative)
- `login` - User login (alternative)

---

### 13. `addressController.js`
**Location**: `src/controllers/addressController.js`

**Exported Functions**:
- `getAddress` - Get user addresses
- `addAddress` - Add address to user

---

## REST API Endpoints

### Root Endpoints (from app.js)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/` | Welcome message with API links | None |
| GET | `/api/live` | Liveness check | None |
| GET | `/api/ready` | Readiness check (MongoDB status) | None |
| GET | `/status` | HTML status page | None |
| GET | `/metrics` | Prometheus metrics | None |
| GET | `/api/v1/docs` | Swagger API documentation | None |
| GET | `/portal` | Documentation portal | None |

---

### Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| POST | `/api/v1/auth/register` | `registerUser` | None | None |
| POST | `/api/v1/auth/login` | `loginUser` | None | None |
| GET | `/api/v1/auth/me` | `getCurrentUser` | Required | Any |

---

### User Routes (`/api/v1/users`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/users` | `getUsers` | Required | admin |
| GET | `/api/v1/users/stats` | `getRoleCounts` | Required | admin |
| GET | `/api/v1/users/:id` | `getUserById` | Required | admin, seller, rider, customer |
| PUT | `/api/v1/users/:id` | `updateUser` | Required | admin |
| POST | `/api/v1/users/:id/toggle` | `toggleUserActiveStatus` | Required | admin |

**Query Parameters** (for GET `/api/v1/users`):
- `role` - Filter by role
- `search` - Search by name, email, or phone
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)
- `isActive` - Filter by active status

---

### Order Routes (`/api/v1/orders`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/orders` | `getOrders` | Required | admin, seller |
| GET | `/api/v1/orders/active` | `getActiveOrders` | Required | admin, seller, rider |
| GET | `/api/v1/orders/restaurant/:restaurantId` | `getRestaurantOrders` | Required | admin, seller |
| GET | `/api/v1/orders/:id` | `getOrderById` | Required | admin, seller, rider, customer |
| POST | `/api/v1/orders` | `createOrder` | Required | customer, admin |
| PATCH | `/api/v1/orders/:id/status` | `updateOrderStatus` | Required | admin, seller, rider |
| POST | `/api/v1/orders/:id/assign` | `assignRider` | Required | admin |
| POST | `/api/v1/orders/:id/review` | `captureOrderFeedback` | Required | customer |

**Query Parameters** (for GET `/api/v1/orders`):
- `restaurant` - Filter by restaurant ID
- `seller` - Filter by seller ID
- `rider` - Filter by rider ID
- `customer` - Filter by customer ID
- `orderStatus` - Filter by order status
- `isActive` - Filter by active status
- `search` - Search by order ID
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `zone` - Filter by zone
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Query Parameters** (for GET `/api/v1/orders/active`):
- `restaurantId` - Filter by restaurant ID
- `actions` - Comma-separated list of statuses (default: pending,accepted,preparing,ready,picked,enroute)

**Request Body** (for POST `/api/v1/orders`):
- `restaurant` (required) - Restaurant ID
- `items` (required, array, min 1) - Order items
- `orderAmount` (required, number) - Total order amount
- `deliveryAddress.deliveryAddress` (required) - Delivery address
- `paidAmount` (optional) - Paid amount
- `deliveryCharges` (optional) - Delivery charges
- `tipping` (optional) - Tip amount
- `taxationAmount` (optional) - Tax amount
- `paymentMethod` (optional) - Payment method
- `instructions` (optional) - Special instructions

**Request Body** (for PATCH `/api/v1/orders/:id/status`):
- `status` (required) - Order status: pending, accepted, preparing, ready, picked, enroute, delivered, cancelled, refunded
- `note` (optional) - Status change note

**Request Body** (for POST `/api/v1/orders/:id/assign`):
- `riderId` (required) - Rider user ID

**Request Body** (for POST `/api/v1/orders/:id/review`):
- `rating` (required, integer, 1-5) - Rating
- `comment` (optional) - Review comment

---

### Product Routes (`/api/v1/products`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/products` | `getProducts` | Required | admin, seller |
| POST | `/api/v1/products` | `createProduct` | Required | admin, seller |
| PUT | `/api/v1/products/:id` | `updateProduct` | Required | admin, seller |
| DELETE | `/api/v1/products/:id` | `deleteProduct` | Required | admin, seller |
| PATCH | `/api/v1/products/:id/availability` | `updateProductAvailability` | Required | admin, seller |

**Query Parameters** (for GET `/api/v1/products`):
- `restaurant` - Filter by restaurant ID
- `search` - Search by title or description
- `isActive` - Filter by active status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)

**Request Body** (for POST `/api/v1/products`):
- `title` (required) - Product title
- `price` (required, number) - Product price
- `restaurant` (required) - Restaurant ID
- `description` (optional) - Product description
- `image` (optional) - Product image URL
- `discountedPrice` (optional) - Discounted price
- `variations` (optional) - Product variations
- `addons` (optional) - Product addons
- `available` (optional) - Availability status
- `isActive` (optional) - Active status

**Request Body** (for PUT `/api/v1/products/:id`):
- `title` (optional, string) - Product title
- `price` (optional, number) - Product price
- `discountedPrice` (optional, number) - Discounted price
- Other product fields (optional)

**Request Body** (for PATCH `/api/v1/products/:id/availability`):
- `available` (required, boolean) - Availability status

---

### Admin Routes (`/api/v1/admin`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/admin/dashboard` | `getDashboardSummary` | Required | admin |
| GET | `/api/v1/admin/restaurants` | `getRestaurants` | Required | admin |
| POST | `/api/v1/admin/restaurants` | `createRestaurant` | Required | admin |
| PUT | `/api/v1/admin/restaurants/:id` | `updateRestaurant` | Required | admin |
| POST | `/api/v1/admin/restaurants/:id/toggle` | `toggleRestaurantAvailability` | Required | admin |
| GET | `/api/v1/admin/maintenance` | `getMaintenanceStatus` | Required | admin |
| POST | `/api/v1/admin/maintenance` | `updateMaintenanceMode` | Required | admin |

**Query Parameters** (for GET `/api/v1/admin/restaurants`):
- `search` - Search by name or address
- `isActive` - Filter by active status
- `isAvailable` - Filter by availability

**Request Body** (for POST `/api/v1/admin/restaurants`):
- `name` (required) - Restaurant name
- `owner` (required) - Owner user ID (must be seller role)
- `address` (required) - Restaurant address
- Other restaurant fields (optional)

**Request Body** (for PUT `/api/v1/admin/restaurants/:id`):
- `name` (optional, string) - Restaurant name
- `address` (optional, string) - Restaurant address
- `commissionRate` (optional, number) - Commission rate
- Other restaurant fields (optional)

**Request Body** (for POST `/api/v1/admin/maintenance`):
- `enabled` (required, boolean) - Enable/disable maintenance mode
- `readOnly` (optional, boolean) - Read-only mode
- `message` (optional, string) - Maintenance message

---

### Seller Routes (`/api/v1/seller`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/seller/profile` | `getSellerProfile` | Required | seller |
| GET | `/api/v1/seller/orders` | `getSellerOrders` | Required | seller |
| GET | `/api/v1/seller/menu` | `getSellerMenu` | Required | seller |
| PATCH | `/api/v1/seller/availability` | `updateSellerAvailability` | Required | seller |
| PATCH | `/api/v1/seller/orders/:id/preparation` | `updateOrderPreparationTime` | Required | seller |
| PATCH | `/api/v1/seller/menu/availability` | `bulkUpdateProductAvailability` | Required | seller |

**Query Parameters** (for GET `/api/v1/seller/orders`):
- `status` - Filter by order status

**Request Body** (for PATCH `/api/v1/seller/availability`):
- `isAvailable` (required, boolean) - Restaurant availability

**Request Body** (for PATCH `/api/v1/seller/orders/:id/preparation`):
- `preparationTime` (optional, number) - Preparation time in minutes
- `expectedTime` (optional, ISO8601 date) - Expected ready time

**Request Body** (for PATCH `/api/v1/seller/menu/availability`):
- `productIds` (required, array, min 1) - Array of product IDs
- `available` (required, boolean) - Availability status

---

### Rider Routes (`/api/v1/rider`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/rider/orders` | `getAssignedOrders` | Required | rider |
| PATCH | `/api/v1/rider/status` | `updateRiderStatus` | Required | rider |
| PATCH | `/api/v1/rider/location` | `updateRiderLocation` | Required | rider |
| POST | `/api/v1/rider/orders/:id/pickup` | `confirmPickup` | Required | rider |
| POST | `/api/v1/rider/orders/:id/deliver` | `confirmDelivery` | Required | rider |

**Query Parameters** (for GET `/api/v1/rider/orders`):
- `status` - Filter by order status (default: assigned, picked, enroute)

**Request Body** (for PATCH `/api/v1/rider/status`):
- `available` (required, boolean) - Rider availability

**Request Body** (for PATCH `/api/v1/rider/location`):
- `coordinates` (required, array, [lng, lat]) - GPS coordinates

---

### Customer Routes (`/api/v1/customer`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/customer/profile` | `getCustomerProfile` | Required | customer |
| GET | `/api/v1/customer/orders` | `getCustomerOrders` | Required | customer |
| GET | `/api/v1/customer/restaurants` | `browseRestaurants` | Required | customer |
| GET | `/api/v1/customer/restaurants/:restaurantId/menu` | `getRestaurantMenu` | Required | customer |
| POST | `/api/v1/customer/addresses` | `saveAddress` | Required | customer |

**Query Parameters** (for GET `/api/v1/customer/orders`):
- `status` - Filter by order status

**Query Parameters** (for GET `/api/v1/customer/restaurants`):
- `search` - Search by name or address
- `cuisine` - Filter by cuisine (comma-separated)
- `available` - Filter by availability

**Request Body** (for POST `/api/v1/customer/addresses`):
- `label` (optional, string) - Address label
- `street` (required) - Street address
- `city` (required) - City
- `coordinates` (optional, array, [lng, lat]) - GPS coordinates
- Other address fields (optional)

---

### Privacy Routes (`/api/v1/privacy`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| POST | `/api/v1/privacy/request-deletion` | `requestDeletion` | Optional | Any |
| POST | `/api/v1/privacy/request-portability` | `requestDataPortability` | Optional | Any |
| GET | `/api/v1/privacy/status/:requestId` | `getRequestStatus` | Optional | Any |

**Request Body** (for POST `/api/v1/privacy/request-deletion`):
- `email` (optional, email) - User email (required if not authenticated)
- `reason` (optional, string, max 500) - Reason for deletion

**Request Body** (for POST `/api/v1/privacy/request-portability`):
- `email` (optional, email) - User email (required if not authenticated)
- `reason` (optional, string, max 500) - Reason for request

**Path Parameters** (for GET `/api/v1/privacy/status/:requestId`):
- `requestId` (required, MongoDB ObjectId) - Privacy request ID

---

### Payments Routes (`/api/v1/payments`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| POST | `/api/v1/payments/webhook` | `stripeService.handleWebhook` | None | Stripe webhook |

**Note**: This endpoint handles Stripe webhook events. Requires Stripe signature verification.

---

### Restaurant Routes (Alternative) (`/api/v1/restaurants`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/restaurants` | `getRestaurants` | None | None |
| GET | `/api/v1/restaurants/:id` | `getRestaurant` | None | None |
| GET | `/api/v1/restaurants/:id/products` | `getProductsByRestaurant` | None | None |

**Note**: These are public endpoints (no authentication required).

---

### Category Routes (`/api/v1/categories`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/categories` | `getCategories` | None | None |
| GET | `/api/v1/categories/:id/products` | `getCategoryProducts` | None | None |

**Note**: These are public endpoints (no authentication required).

---

### Auth Routes (Alternative) (`/api/v1/register`, `/api/v1/login`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| POST | `/api/v1/register` | `register` | None | None |
| POST | `/api/v1/login` | `login` | None | None |

**Note**: These are alternative authentication endpoints (simpler implementation).

---

### Address Routes (`/api/v1/address`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/address/:userId` | `getAddress` | None | None |
| POST | `/api/v1/address` | `addAddress` | None | None |

**Note**: These endpoints don't require authentication (legacy implementation).

**Request Body** (for POST `/api/v1/address`):
- `user` (required) - User ID
- Address fields (required)

---

### Health Routes (`/api/v1/health`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/health` | Inline handler | None | None |

---

### Version Routes (`/api/v1/version`)

| Method | Endpoint | Controller Function | Authentication | Roles |
|--------|----------|-------------------|----------------|-------|
| GET | `/api/v1/version` | Inline handler | None | None |

**Response**: Returns API version and Git commit SHA.

---

## Authentication

Most endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens are obtained via:
- `POST /api/v1/auth/register` - Returns token on successful registration
- `POST /api/v1/auth/login` - Returns token on successful login

## Role-Based Access Control

Endpoints are protected by role-based authorization:
- **admin**: Full system access
- **seller**: Restaurant and order management
- **rider**: Order delivery management
- **customer**: Order placement and browsing

## Validation

Most endpoints use `express-validator` for request validation. Validation errors return HTTP 422 with error details.

## Error Responses

Standard error response format:
```json
{
  "status": "error",
  "statusCode": <http_status_code>,
  "message": "<error_message>",
  "details": <optional_error_details>
}
```

## Summary Statistics

- **Total Controllers**: 13
- **Total REST Endpoints**: ~70+
- **Public Endpoints**: ~10 (no authentication)
- **Protected Endpoints**: ~60+ (require authentication)
- **Admin-Only Endpoints**: ~10
- **Role-Specific Endpoints**: ~30+

