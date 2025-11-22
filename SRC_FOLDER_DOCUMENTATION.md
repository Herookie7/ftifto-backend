# ftifto-backend/src Folder Documentation

## Overview
This document provides a comprehensive scan of all files and subfolders in the `ftifto-backend/src` directory, including their roles and all defined models/schemas with key fields.

---

## Root Files

### `app.js`
**Role**: Main Express application setup and configuration
- Initializes Express app with security middleware (helmet, CORS, rate limiting, XSS protection)
- Configures MongoDB connection monitoring
- Sets up Swagger/OpenAPI documentation
- Initializes Apollo GraphQL server
- Configures error handling and maintenance mode
- Sets up health check endpoints (`/api/live`, `/api/ready`, `/status`)

**Models/Schemas**: None

---

### `logger.js`
**Role**: Winston-based logging configuration
- Configures console logging with colorization
- Optional Logtail integration for cloud logging
- Provides stream interface for Morgan HTTP logging

**Models/Schemas**: None

---

## auth/

### `oauth.js`
**Role**: OAuth 2.0 authentication provider integration
- Supports Google and GitHub OAuth providers
- Handles authorization URL generation
- Exchanges authorization codes for access tokens
- Fetches user profiles from OAuth providers
- Creates callback handlers for OAuth flows

**Models/Schemas**: None

---

## config/

### `api.js`
**Role**: API configuration constants
- Exports base API URL from config

**Models/Schemas**: None

---

### `database.js`
**Role**: MongoDB connection management
- Handles database connection with retry logic (max 5 attempts)
- Configures connection pool settings
- Runs demo seed script in production/Render environments
- Provides connection state mapping utilities

**Models/Schemas**: None

---

### `env.js`
**Role**: Environment variable loading and validation
- Loads and validates required environment variables (MONGO_URI, JWT_SECRET)
- Provides defaults for optional configuration
- Supports both MONGO_URI and MONGODB_URI for backward compatibility

**Models/Schemas**: None

---

### `index.js`
**Role**: Centralized configuration object
- Aggregates all configuration from environment variables
- Resolves CORS origins and socket origins
- Handles Firebase private key decoding (base64 support)
- Configures app, database, auth, logging, cluster, rate limiting, socket, notifications, docs, API, build, analytics, monitoring, maintenance, backups, secrets, payments, OAuth, data retention, Sentry, and alerts

**Models/Schemas**: None

---

### `secretsProvider.js`
**Role**: External secrets management integration
- Supports AWS Secrets Manager and HashiCorp Vault
- Loads secrets from external providers into process.env
- Handles secret payload application with environment variable precedence

**Models/Schemas**: None

---

## controllers/

### `addressController.js`
**Role**: Address management operations
- Handles CRUD operations for user addresses

**Models/Schemas**: Uses `User` model (addressBook field)

---

### `admin.controller.js`
**Role**: Admin-specific operations and management
- Administrative functions for system management

**Models/Schemas**: Uses various models (User, Order, Restaurant, etc.)

---

### `auth.controller.js`
**Role**: Authentication and authorization
- User registration
- User login (email/phone + password)
- Current user retrieval
- JWT token generation
- Audit logging for auth events

**Models/Schemas**: Uses `User` model

---

### `authController.js`
**Role**: Alternative authentication controller (multivendor auth)
- Additional authentication endpoints

**Models/Schemas**: Uses `User` model

---

### `categoryController.js`
**Role**: Category management
- CRUD operations for product categories

**Models/Schemas**: Uses `Category` model

---

### `customer.controller.js`
**Role**: Customer-specific operations
- Customer profile management
- Order history
- Favorite restaurants

**Models/Schemas**: Uses `User`, `Order`, `Restaurant` models

---

### `order.controller.js`
**Role**: Order management
- Order creation, retrieval, updates
- Order status management
- Order history

**Models/Schemas**: Uses `Order` model

---

### `privacy.controller.js`
**Role**: Privacy request handling (GDPR compliance)
- Data deletion requests
- Data portability requests
- Privacy request status management

**Models/Schemas**: Uses `PrivacyRequest` model

---

### `product.controller.js`
**Role**: Product/food item management
- Product CRUD operations
- Product search and filtering

**Models/Schemas**: Uses `Product` model

---

### `restaurantController.js`
**Role**: Restaurant management
- Restaurant CRUD operations
- Restaurant search and filtering
- Restaurant availability management

**Models/Schemas**: Uses `Restaurant` model

---

### `rider.controller.js`
**Role**: Delivery rider operations
- Rider profile management
- Order assignment
- Location tracking
- Wallet management

**Models/Schemas**: Uses `User` model (riderProfile field), `Order` model

---

### `seller.controller.js`
**Role**: Seller/restaurant owner operations
- Restaurant management
- Order management
- Sales analytics

**Models/Schemas**: Uses `User` model (sellerProfile field), `Restaurant`, `Order` models

---

### `user.controller.js`
**Role**: General user management
- User profile operations
- User preferences
- User settings

**Models/Schemas**: Uses `User` model

---

## docs/

### `spec.yaml`
**Role**: OpenAPI/Swagger specification file
- API documentation specification

**Models/Schemas**: None (specification only)

---

### `swagger.js`
**Role**: Swagger/OpenAPI documentation generation
- Configures swagger-jsdoc
- Generates API documentation from route and model files

**Models/Schemas**: None

---

## graphql/

### `schema.js`
**Role**: GraphQL type definitions and schema
- Defines all GraphQL types, queries, and mutations
- Types: Location, OpeningTime, TimeSlot, Variation, AddonOption, Addon, Food, Category, Review, ReviewData, Zone, Restaurant, RestaurantPreview, Offer, Section, RestaurantListResponse, RestaurantPreviewListResponse, User, Address, OrderItem, Order, Configuration, Cuisine, Tax
- Queries: nearByRestaurants, restaurant, topRatedVendors, popularFoodItems, configuration, cuisines, myOrders, reviewsByRestaurant, etc.
- Mutations: addFavourite, reviewOrder, selectAddress, updateUser

**Models/Schemas**: GraphQL schema types (not Mongoose schemas)

---

### `resolvers.js`
**Role**: GraphQL query and mutation resolvers
- Implements all GraphQL queries and mutations
- Handles restaurant queries with distance calculations
- Manages order queries and mutations
- Implements review system
- Provides configuration and cuisine queries

**Models/Schemas**: Uses Mongoose models: Restaurant, Product, Category, Order, Review, Configuration, Cuisine, User, Offer, Section, Zone

---

## metrics/

### `index.js`
**Role**: Prometheus metrics collection
- Configures Prometheus client registry
- Tracks HTTP request counts and durations
- Provides metrics middleware for Express
- Implements latency alerting
- Exports metrics in Prometheus format

**Models/Schemas**: None

---

## middleware/

### `auth.js`
**Role**: Authentication and authorization middleware
- `protect`: Validates JWT tokens and attaches user to request
- `authorizeRoles`: Role-based access control (customer, seller, rider, admin)

**Models/Schemas**: Uses `User` model

---

### `errorHandler.js`
**Role**: Global error handling middleware
- Catches and formats all application errors
- Integrates with Sentry for error tracking
- Sends alerts for server errors (500+)
- Provides error response formatting

**Models/Schemas**: None

---

### `maintenance.js`
**Role**: Maintenance mode middleware
- Checks maintenance state from Redis/service
- Allows read-only access during maintenance
- Bypasses health check and metrics endpoints

**Models/Schemas**: None

---

### `notFound.js`
**Role**: 404 handler middleware
- Handles undefined routes
- Returns standardized 404 error response

**Models/Schemas**: None

---

## migrations/

### `20250101-create-indexes.js`
**Role**: Database index migration
- Creates indexes on orders collection (orderId, restaurant+orderStatus, rider+orderStatus, customer+createdAt, zone, deliveryAddress.location)
- Creates indexes on users collection (email, phone, role+isActive, riderProfile.location)
- Creates indexes on products collection (slug, restaurant+isActive, categories, tags, isFeatured, updatedAt)
- Supports both up and down migrations

**Models/Schemas**: None (operates on collections directly)

---

### `runner.js`
**Role**: Migration execution framework
- Discovers migration files
- Tracks applied migrations in `_migration_history` collection
- Implements locking mechanism to prevent concurrent migrations
- Supports up and down migrations
- Provides migration listing functionality

**Models/Schemas**: Uses `_migration_history` and `_migration_lock` collections

---

## models/

### `Category.js`
**Role**: Product category model
**Schema**: `categorySchema`
**Key Fields**:
- `title` (String, required, trimmed)
- `slug` (String, unique, indexed, auto-generated from title)
- `description` (String, trimmed)
- `image` (String, trimmed)
- `restaurant` (ObjectId, ref: 'Restaurant', required)
- `foods` (Array of ObjectId, ref: 'Product')
- `subCategory` (String, trimmed)
- `isActive` (Boolean, default: true)
- `order` (Number, default: 0)
- `createdAt`, `updatedAt` (timestamps)

---

### `Configuration.js`
**Role**: Application configuration model (singleton)
**Schema**: `configurationSchema`
**Key Fields**:
- `currency` (String, default: 'USD')
- `currencySymbol` (String, default: '$')
- `deliveryRate` (Number, default: 0)
- `androidClientID` (String, trimmed)
- `iOSClientID` (String, trimmed)
- `googleApiKey` (String, trimmed)
- `expoClientID` (String, trimmed)
- `termsAndConditions` (String, trimmed)
- `privacyPolicy` (String, trimmed)
- `testOtp` (String, trimmed)
- `skipMobileVerification` (Boolean, default: false)
- `skipEmailVerification` (Boolean, default: false)
- `costType` (String, default: 'fixed')
- `createdAt`, `updatedAt` (timestamps)

**Static Methods**:
- `getConfiguration()`: Ensures only one configuration document exists

---

### `Cuisine.js`
**Role**: Cuisine type model
**Schema**: `cuisineSchema`
**Key Fields**:
- `name` (String, required, trimmed, unique)
- `slug` (String, unique, indexed, auto-generated from name)
- `description` (String, trimmed)
- `image` (String, trimmed)
- `shopType` (String, trimmed)
- `isActive` (Boolean, default: true)
- `createdAt`, `updatedAt` (timestamps)

---

### `Offer.js`
**Role**: Promotional offer model
**Schema**: `offerSchema`
**Key Fields**:
- `name` (String, required, trimmed)
- `tag` (String, trimmed)
- `description` (String, trimmed)
- `image` (String, trimmed)
- `restaurants` (Array of ObjectId, ref: 'Restaurant')
- `discount` (Number, default: 0)
- `discountType` (String, enum: ['percentage', 'fixed'], default: 'percentage')
- `startDate` (Date)
- `endDate` (Date)
- `isActive` (Boolean, default: true)
- `createdAt`, `updatedAt` (timestamps)

---

### `Order.js`
**Role**: Order model
**Schema**: `orderSchema`
**Key Fields**:
- `orderId` (String, unique, auto-generated via generateOrderId)
- `customer` (ObjectId, ref: 'User', required)
- `restaurant` (ObjectId, ref: 'Restaurant', required)
- `seller` (ObjectId, ref: 'User')
- `rider` (ObjectId, ref: 'User')
- `items` (Array of orderItemSchema, required, min 1)
- `orderAmount` (Number, required)
- `paidAmount` (Number, default: 0)
- `deliveryCharges` (Number, default: 0)
- `tipping` (Number, default: 0)
- `taxationAmount` (Number, default: 0)
- `paymentMethod` (String, default: 'cash')
- `paymentStatus` (String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending')
- `orderStatus` (String, enum: ['pending', 'accepted', 'preparing', 'ready', 'picked', 'enroute', 'delivered', 'cancelled', 'refunded'], default: 'pending')
- `status` (Boolean, default: true)
- `isActive` (Boolean, default: true)
- `reason` (String, trimmed)
- `instructions` (String, trimmed)
- `isPickedUp` (Boolean, default: false)
- `isRinged` (Boolean, default: false)
- `isRiderRinged` (Boolean, default: false)
- `deliveryAddress` (deliveryAddressSchema)
- `zone` (String, trimmed)
- `expectedTime` (Date)
- `preparationTime` (Number)
- `acceptedAt` (Date)
- `pickedAt` (Date)
- `deliveredAt` (Date)
- `cancelledAt` (Date)
- `assignedAt` (Date)
- `timeline` (Array of orderStatusHistorySchema)
- `review` (Object with rating and comment)
- `createdAt`, `updatedAt` (timestamps)

**Nested Schemas**:
- `locationSchema`: type (enum: 'Point'), coordinates ([Number])
- `addonOptionSchema`: title, description, price
- `addonSchema`: title, description, quantityMinimum, quantityMaximum, options (array of addonOptionSchema)
- `variationSchema`: title, price, discounted
- `orderItemSchema`: product (ObjectId, ref: 'Product'), title, description, image, quantity, variation, addons, specialInstructions
- `orderStatusHistorySchema`: status, note, updatedBy (ObjectId, ref: 'User'), updatedAt
- `deliveryAddressSchema`: deliveryAddress, details, label, location (locationSchema)

**Indexes**:
- `restaurant + orderStatus`
- `rider + orderStatus`
- `customer + createdAt` (descending)
- `zone`
- `deliveryAddress.location` (2dsphere)

---

### `PrivacyRequest.js`
**Role**: GDPR privacy request model
**Schema**: `privacyRequestSchema`
**Key Fields**:
- `user` (ObjectId, ref: 'User')
- `email` (String, lowercase, trimmed)
- `type` (String, enum: ['deletion', 'data_portability'], default: 'deletion')
- `status` (String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending')
- `reason` (String, trimmed)
- `notes` (String, trimmed)
- `requestedAt` (Date, default: Date.now)
- `resolvedAt` (Date)
- `metadata` (Mixed)
- `exportObjectKey` (String, trimmed) - S3 key for data export
- `exportUrl` (String, trimmed) - Temporary URL for data download
- `exportExpiresAt` (Date)
- `createdAt`, `updatedAt` (timestamps)

**Indexes**:
- `status + requestedAt`
- `email + requestedAt` (descending)
- `type + status`

---

### `Product.js`
**Role**: Product/food item model
**Schema**: `productSchema`
**Key Fields**:
- `title` (String, required, trimmed)
- `slug` (String, unique, indexed, auto-generated from title)
- `description` (String, trimmed)
- `image` (String, trimmed)
- `gallery` (Array of String)
- `price` (Number, required)
- `discountedPrice` (Number)
- `categories` (Array of String, trimmed)
- `tags` (Array of String, trimmed)
- `isActive` (Boolean, default: true)
- `isFeatured` (Boolean, default: false)
- `preparationTime` (Number, default: 15)
- `restaurant` (ObjectId, ref: 'Restaurant', required)
- `variations` (Array of variationSchema)
- `addons` (Array of addonSchema)
- `available` (Boolean, default: true)
- `stock` (Number, default: 0)
- `isOutOfStock` (Boolean, default: false)
- `subCategory` (String, trimmed)
- `nutrition` (Object: calories, protein, fat, carbs)
- `createdAt`, `updatedAt` (timestamps)

**Nested Schemas**:
- `variationSchema`: title, price, discounted
- `addonOptionSchema`: title, description, price
- `addonSchema`: title, description, quantityMinimum, quantityMaximum, options (array of addonOptionSchema)

---

### `Restaurant.js`
**Role**: Restaurant model
**Schema**: `restaurantSchema`
**Key Fields**:
- `name` (String, required, trimmed)
- `slug` (String, unique, indexed, auto-generated from name)
- `description` (String, trimmed)
- `image` (String, trimmed)
- `logo` (String, trimmed)
- `address` (String, required, trimmed)
- `location` (locationSchema - Point with coordinates)
- `deliveryBounds` (polygonSchema - Polygon with coordinates)
- `phone` (String, trimmed)
- `cuisines` (Array of String, trimmed)
- `tags` (Array of String, trimmed)
- `zone` (String, trimmed)
- `orderPrefix` (String, default: 'TIF')
- `deliveryTime` (Number, default: 30)
- `minimumOrder` (Number, default: 0)
- `tax` (Number, default: 0)
- `commissionRate` (Number, default: 0)
- `isAvailable` (Boolean, default: true)
- `isActive` (Boolean, default: true)
- `rating` (Number, default: 0)
- `owner` (ObjectId, ref: 'User', required)
- `shopType` (String, trimmed)
- `openingTimes` (Array of openingTimesSchema)
- `notificationToken` (String, trimmed)
- `orderId` (String, trimmed)
- `sections` (Array of String, trimmed)
- `keywords` (Array of String, trimmed)
- `reviewCount` (Number, default: 0)
- `reviewAverage` (Number, default: 0)
- `restaurantUrl` (String, trimmed)
- `stripeDetailsSubmitted` (Boolean, default: false)
- `enableNotification` (Boolean, default: true)
- `username` (String, trimmed)
- `password` (String, trimmed)
- `categories` (Array of ObjectId, ref: 'Category')
- `options` (Array of objects: title, description, price)
- `addons` (Array of addonSchema)
- `createdAt`, `updatedAt` (timestamps)

**Nested Schemas**:
- `locationSchema`: type (enum: 'Point'), coordinates ([Number])
- `polygonSchema`: type (enum: 'Polygon'), coordinates ([[[Number]]])
- `openingTimesSchema`: day (String, required), times (Array of {startTime, endTime})
- `addonSchema`: title, description, quantityMinimum, quantityMaximum, options (Array of {title, description, price})

**Indexes**:
- `location` (2dsphere)
- `deliveryBounds.coordinates` (2dsphere)

---

### `Review.js`
**Role**: Order review model
**Schema**: `reviewSchema`
**Key Fields**:
- `order` (ObjectId, ref: 'Order', required, unique)
- `restaurant` (ObjectId, ref: 'Restaurant', required)
- `user` (ObjectId, ref: 'User', required)
- `rating` (Number, required, min: 1, max: 5)
- `description` (String, trimmed)
- `isActive` (Boolean, default: true)
- `createdAt`, `updatedAt` (timestamps)

**Indexes**:
- `restaurant + createdAt` (descending)
- `order` (unique)

---

### `Section.js`
**Role**: Restaurant section/grouping model
**Schema**: `sectionSchema`
**Key Fields**:
- `name` (String, required, trimmed)
- `description` (String, trimmed)
- `image` (String, trimmed)
- `restaurants` (Array of ObjectId, ref: 'Restaurant')
- `order` (Number, default: 0)
- `isActive` (Boolean, default: true)
- `createdAt`, `updatedAt` (timestamps)

---

### `User.js`
**Role**: User model (supports customer, seller, rider, admin roles)
**Schema**: `userSchema`
**Key Fields**:
- `name` (String, required, trimmed)
- `email` (String, trimmed, lowercase, unique, sparse)
- `phone` (String, trimmed, unique, sparse)
- `password` (String, required, minlength: 6, select: false - hashed with bcrypt)
- `role` (String, enum: ['customer', 'seller', 'rider', 'admin'], default: 'customer')
- `avatar` (String, trimmed)
- `image` (String, trimmed)
- `isActive` (Boolean, default: true)
- `phoneIsVerified` (Boolean, default: false)
- `emailIsVerified` (Boolean, default: false)
- `isOrderNotification` (Boolean, default: true)
- `isOfferNotification` (Boolean, default: true)
- `favourite` (Array of ObjectId, ref: 'Restaurant')
- `userType` (String, trimmed) - 'apple', 'google', 'facebook', 'email', 'phone'
- `notificationToken` (String, trimmed)
- `metadata` (Mixed)
- `addressBook` (Array of addressSchema)
- `sellerProfile` (sellerProfileSchema)
- `riderProfile` (Object with vehicleType, licenseNumber, available, location, lastSeenAt, accountNumber, currentWalletAmount, totalWalletAmount, withdrawnWalletAmount)
- `preferences` (Object: language, marketingOptIn)
- `pushTokens` (Array of String)
- `createdAt`, `updatedAt` (timestamps)

**Nested Schemas**:
- `locationSchema`: type (enum: 'Point'), coordinates ([Number])
- `addressSchema`: label, deliveryAddress, details, selected, street, city, state, postalCode, country, location (locationSchema), instructions, timestamps
- `riderProfileSchema`: vehicleType, licenseNumber, available, location (locationSchema), lastSeenAt
- `sellerProfileSchema`: businessName, restaurant (ObjectId, ref: 'Restaurant'), notificationToken, enableNotification

**Methods**:
- `matchPassword(enteredPassword)`: Compares password with bcrypt
- `toJSON()`: Removes password from JSON output

**Pre-save Hook**:
- Hashes password before saving (if modified)

**Indexes**:
- `riderProfile.location` (2dsphere)

---

### `Zone.js`
**Role**: Delivery zone model
**Schema**: `zoneSchema`
**Key Fields**:
- `title` (String, required, trimmed)
- `description` (String, trimmed)
- `location` (locationSchema - Point or Polygon with coordinates)
- `tax` (Number, default: 0)
- `isActive` (Boolean, default: true)
- `createdAt`, `updatedAt` (timestamps)

**Nested Schemas**:
- `locationSchema`: type (enum: 'Point', 'Polygon'), coordinates (Mixed, required)

**Indexes**:
- `location` (2dsphere)

---

## payments/

### `stripe.service.js`
**Role**: Stripe payment integration service
- Creates payment intents
- Handles Stripe webhooks
- Converts amounts to minor units (cents)
- Integrates with audit logging
- Validates webhook signatures

**Models/Schemas**: None (uses Stripe API)

---

## realtime/

### `emitter.js`
**Role**: Socket.IO event emitter utilities
- Registers Socket.IO namespaces
- Emits order update events
- Emits rider location updates
- Emits general notifications

**Models/Schemas**: None

---

### `index.js`
**Role**: Socket.IO server initialization and management
- Initializes Socket.IO server with CORS configuration
- Sets up Redis adapter for multi-instance support
- Creates namespaces: `/orders` and `/riders`
- Handles socket connections and room management
- Implements error handling and Sentry integration
- Provides shutdown functionality

**Models/Schemas**: None

---

## routes/

### `addressRoutes.js`
**Role**: Address management routes
- REST endpoints for address CRUD operations

**Models/Schemas**: Uses `User` model (addressBook)

---

### `admin.routes.js`
**Role**: Admin API routes
- Administrative endpoints

**Models/Schemas**: Uses various models

---

### `auth.routes.js`
**Role**: Authentication routes
- Registration, login, current user endpoints

**Models/Schemas**: Uses `User` model

---

### `authRoutes.js`
**Role**: Alternative authentication routes (multivendor)
- Additional auth endpoints

**Models/Schemas**: Uses `User` model

---

### `categoryRoutes.js`
**Role**: Category management routes
- Category CRUD endpoints

**Models/Schemas**: Uses `Category` model

---

### `customer.routes.js`
**Role**: Customer-specific routes
- Customer profile and order endpoints

**Models/Schemas**: Uses `User`, `Order` models

---

### `health.routes.js`
**Role**: Health check routes
- System health and readiness endpoints

**Models/Schemas**: None

---

### `index.js`
**Role**: Main route aggregator
- Redirects non-v1 routes to `/api/v1`
- Mounts all route modules

**Models/Schemas**: None

---

### `metrics.routes.js`
**Role**: Metrics endpoints
- Prometheus metrics export endpoint

**Models/Schemas**: None

---

### `order.routes.js`
**Role**: Order management routes
- Order CRUD and status endpoints

**Models/Schemas**: Uses `Order` model

---

### `payments.routes.js`
**Role**: Payment processing routes
- Stripe payment intent creation
- Stripe webhook handler

**Models/Schemas**: None (uses Stripe service)

---

### `privacy.routes.js`
**Role**: Privacy request routes (GDPR)
- Data deletion and portability endpoints

**Models/Schemas**: Uses `PrivacyRequest` model

---

### `product.routes.js`
**Role**: Product management routes
- Product CRUD endpoints

**Models/Schemas**: Uses `Product` model

---

### `restaurantRoutes.js`
**Role**: Restaurant management routes
- Restaurant CRUD endpoints

**Models/Schemas**: Uses `Restaurant` model

---

### `rider.routes.js`
**Role**: Rider-specific routes
- Rider profile, orders, location endpoints

**Models/Schemas**: Uses `User`, `Order` models

---

### `seller.routes.js`
**Role**: Seller/restaurant owner routes
- Restaurant and order management endpoints

**Models/Schemas**: Uses `User`, `Restaurant`, `Order` models

---

### `user.routes.js`
**Role**: User management routes
- User profile and settings endpoints

**Models/Schemas**: Uses `User` model

---

### `version.routes.js`
**Role**: API version information
- Returns API version details

**Models/Schemas**: None

---

### `v1/index.js`
**Role**: Version 1 API route aggregator
- Mounts all v1 route modules

**Models/Schemas**: None

---

## services/

### `alerts.service.js`
**Role**: Alert notification service
- Sends alerts to Slack and Discord webhooks
- Notifies on errors and latency issues
- Formats alert messages

**Models/Schemas**: None

---

### `auditLogger.js`
**Role**: Audit logging service
- Logs security and business events
- Tracks user actions
- Records payment events
- Provides structured audit trail

**Models/Schemas**: None (logs to collection or external service)

---

### `dataRetention.service.js`
**Role**: Data retention and archival service
- Handles data retention policies
- Archives old data to S3
- Manages data lifecycle

**Models/Schemas**: None

---

### `index.js`
**Role**: Services module aggregator
- Placeholder for service exports

**Models/Schemas**: None

---

### `maintenance.service.js`
**Role**: Maintenance mode management
- Gets/sets maintenance state (Redis or in-memory)
- Manages read-only mode
- Handles maintenance messages

**Models/Schemas**: None

---

### `metricsPush.service.js`
**Role**: Metrics pushing service
- Pushes metrics to Grafana
- Handles metric aggregation
- Manages metric export

**Models/Schemas**: None

---

### `notifications.service.js`
**Role**: Push notification service
- Sends Firebase Cloud Messaging (FCM) notifications
- Handles notification topics (admin, seller, rider, customer)
- Sends analytics events

**Models/Schemas**: None

---

## utils/

### `ApiError.js`
**Role**: Custom error class
- Extends Error with statusCode and details
- Used for API error handling

**Models/Schemas**: None

---

### `generateOrderId.js`
**Role**: Order ID generation utility
- Generates unique order IDs in format: `TFT-{timestamp}-{random}`
- Uses crypto for random component

**Models/Schemas**: None

---

### `token.js`
**Role**: JWT token utilities
- `signToken(payload, options)`: Creates JWT tokens
- `verifyToken(token)`: Verifies JWT tokens
- Uses JWT_SECRET from config

**Models/Schemas**: None

---

## Summary of All Models/Schemas

### Mongoose Models (11 total):

1. **User** - Multi-role user (customer, seller, rider, admin)
2. **Order** - Food delivery orders
3. **Restaurant** - Restaurant/vendor information
4. **Product** - Food items/products
5. **Category** - Product categories
6. **Review** - Order reviews
7. **Offer** - Promotional offers
8. **Cuisine** - Cuisine types
9. **Section** - Restaurant sections/groups
10. **Zone** - Delivery zones
11. **Configuration** - Application configuration (singleton)
12. **PrivacyRequest** - GDPR privacy requests

### GraphQL Types (defined in schema.js):
- Location, OpeningTime, TimeSlot, Variation, AddonOption, Addon, Food, Category, Review, ReviewData, Zone, Restaurant, RestaurantPreview, Offer, Section, RestaurantListResponse, RestaurantPreviewListResponse, User, Address, OrderItem, Order, Configuration, Cuisine, Tax

### Nested Schemas (used within models):
- `locationSchema` - GeoJSON Point coordinates
- `polygonSchema` - GeoJSON Polygon for delivery bounds
- `addressSchema` - User address information
- `riderProfileSchema` - Rider-specific profile data
- `sellerProfileSchema` - Seller-specific profile data
- `orderItemSchema` - Order line items
- `orderStatusHistorySchema` - Order status change history
- `deliveryAddressSchema` - Delivery address with location
- `variationSchema` - Product variations (size, etc.)
- `addonSchema` - Product addons with options
- `addonOptionSchema` - Individual addon options
- `openingTimesSchema` - Restaurant opening hours

---

## File Count Summary

- **Root files**: 2 (app.js, logger.js)
- **auth/**: 1 file
- **config/**: 5 files
- **controllers/**: 13 files
- **docs/**: 2 files
- **graphql/**: 2 files
- **metrics/**: 1 file
- **middleware/**: 4 files
- **migrations/**: 2 files
- **models/**: 12 files
- **payments/**: 1 file
- **realtime/**: 2 files
- **routes/**: 18 files (including v1/)
- **services/**: 7 files
- **utils/**: 3 files

**Total: ~75 files** (excluding node_modules and other non-source files)

