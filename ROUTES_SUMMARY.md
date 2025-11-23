# Backend Routes Summary

All routes are properly configured and accessible at `/api/v1/*`

## Route Structure

### Health & Status
- `GET /api/v1/health` - Health check endpoint

### Authentication
- `POST /api/v1/auth/register` - Register new user (with validation)
- `POST /api/v1/auth/login` - Login user (with validation)
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/register` - Multivendor register (legacy)
- `POST /api/v1/login` - Multivendor login (legacy)

### Users
- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/stats` - Get user role counts (admin only)
- `GET /api/v1/users/:id` - Get user by ID (protected)
- `PUT /api/v1/users/:id` - Update user (admin only)
- `POST /api/v1/users/:id/toggle` - Toggle user active status (admin only)

### Orders
- `GET /api/v1/orders` - Get all orders (admin, seller)
- `GET /api/v1/orders/active` - Get active orders (admin, seller, rider)
- `GET /api/v1/orders/restaurant/:restaurantId` - Get restaurant orders (admin, seller)
- `GET /api/v1/orders/:id` - Get order by ID (admin, seller, rider, customer)
- `POST /api/v1/orders` - Create order (customer, admin)
- `PATCH /api/v1/orders/:id/status` - Update order status (admin, seller, rider)
- `POST /api/v1/orders/:id/assign` - Assign rider to order (admin)
- `POST /api/v1/orders/:id/review` - Submit order review (customer)

### Products
- `GET /api/v1/products` - Get all products (admin, seller)
- `POST /api/v1/products` - Create product (admin, seller)
- `PUT /api/v1/products/:id` - Update product (admin, seller)
- `DELETE /api/v1/products/:id` - Delete product (admin, seller)
- `PATCH /api/v1/products/:id/availability` - Update product availability (admin, seller)

### Restaurants
- `GET /api/v1/restaurants` - Get all restaurants
- `GET /api/v1/restaurants/:id` - Get restaurant by ID
- `GET /api/v1/restaurants/:id/products` - Get products by restaurant

### Categories
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:id/products` - Get products by category

### Addresses
- `GET /api/v1/address/:userId` - Get address by user ID
- `POST /api/v1/address` - Add address

### Admin
- `GET /api/v1/admin/dashboard` - Get dashboard summary (admin)
- `GET /api/v1/admin/restaurants` - Get all restaurants (admin)
- `POST /api/v1/admin/restaurants` - Create restaurant (admin)
- `PUT /api/v1/admin/restaurants/:id` - Update restaurant (admin)
- `POST /api/v1/admin/restaurants/:id/toggle` - Toggle restaurant availability (admin)
- `GET /api/v1/admin/maintenance` - Get maintenance status (admin)
- `POST /api/v1/admin/maintenance` - Update maintenance mode (admin)

### Seller
- `GET /api/v1/seller/profile` - Get seller profile (seller)
- `GET /api/v1/seller/orders` - Get seller orders (seller)
- `GET /api/v1/seller/menu` - Get seller menu (seller)
- `PATCH /api/v1/seller/availability` - Update seller availability (seller)
- `PATCH /api/v1/seller/orders/:id/preparation` - Update order preparation time (seller)
- `PATCH /api/v1/seller/menu/availability` - Bulk update product availability (seller)

### Rider
- `GET /api/v1/rider/orders` - Get assigned orders (rider)
- `PATCH /api/v1/rider/status` - Update rider status (rider)
- `PATCH /api/v1/rider/location` - Update rider location (rider)
- `POST /api/v1/rider/orders/:id/pickup` - Confirm pickup (rider)
- `POST /api/v1/rider/orders/:id/deliver` - Confirm delivery (rider)

### Customer
- `GET /api/v1/customer/profile` - Get customer profile (customer)
- `GET /api/v1/customer/orders` - Get customer orders (customer)
- `GET /api/v1/customer/restaurants` - Browse restaurants (customer)
- `GET /api/v1/customer/restaurants/:restaurantId/menu` - Get restaurant menu (customer)
- `POST /api/v1/customer/addresses` - Save address (customer)

### Payments
- `POST /api/v1/payments/webhook` - Stripe webhook endpoint

### Privacy
- `POST /api/v1/privacy/request-deletion` - Request data deletion
- `POST /api/v1/privacy/request-portability` - Request data portability
- `GET /api/v1/privacy/status/:requestId` - Get request status

### Version
- `GET /api/v1/version` - Get API version

## GraphQL Endpoint
- `POST /graphql` - GraphQL endpoint
- `GET /graphql/health` - GraphQL health check

## Other Endpoints
- `GET /` - API welcome message
- `GET /status` - Server status page
- `GET /api/live` - Liveness probe
- `GET /api/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/docs` - Swagger documentation

## Notes
- All routes are properly protected with authentication middleware where needed
- Role-based authorization is implemented for admin, seller, rider, and customer routes
- Input validation is implemented using express-validator
- Routes are organized in `/api/v1/*` namespace

