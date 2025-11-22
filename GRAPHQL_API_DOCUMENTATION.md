# GraphQL API & Resolvers Documentation

## Overview
This document lists all GraphQL resolvers, queries, mutations, and subscriptions found in the `ftifto-backend/src` folder.

**GraphQL Endpoint**: `/graphql` (configured in `app.js`)

**Note**: This implementation uses Apollo Server Express. Real-time updates are handled via Socket.IO (not GraphQL subscriptions).

---

## GraphQL Files

### 1. `schema.js`
**Location**: `src/graphql/schema.js`

**Role**: GraphQL type definitions and schema
- Defines all GraphQL types, queries, mutations, and input types
- Uses `apollo-server-express` with `gql` template literal

---

### 2. `resolvers.js`
**Location**: `src/graphql/resolvers.js`

**Role**: GraphQL query and mutation resolvers
- Implements all Query resolvers (17 total)
- Implements all Mutation resolvers (4 total)
- No Subscription resolvers (real-time handled via Socket.IO)

---

## GraphQL Types

### Scalar Types
- `Date` - Custom scalar for date/time values

### Object Types (20 total)

1. **Location** - GeoJSON location with coordinates
2. **OpeningTime** - Restaurant opening hours
3. **TimeSlot** - Time range (startTime, endTime)
4. **Variation** - Product variation (size, etc.)
5. **AddonOption** - Individual addon option
6. **Addon** - Product addon with options
7. **Food** - Food item/product
8. **Category** - Product category
9. **Review** - Order review
10. **ReviewData** - Review aggregation data
11. **Zone** - Delivery zone
12. **Restaurant** - Restaurant/vendor (full details)
13. **RestaurantPreview** - Restaurant preview (lightweight)
14. **Offer** - Promotional offer
15. **Section** - Restaurant section/grouping
16. **RestaurantListResponse** - Response with restaurants, offers, sections
17. **RestaurantPreviewListResponse** - Preview response
18. **User** - User account
19. **Address** - User address
20. **OrderItem** - Order line item
21. **Order** - Order details
22. **Configuration** - App configuration
23. **Cuisine** - Cuisine type
24. **Tax** - Tax configuration

### Input Types (2 total)

1. **ReviewInput** - Input for order review
2. **UpdateUserInput** - Input for user updates

---

## GraphQL Queries

### Restaurant Queries (7 queries)

#### 1. `nearByRestaurants`
**Resolver**: `nearByRestaurants(_, { latitude, longitude, shopType })`

**Parameters**:
- `latitude` (Float, optional) - User latitude
- `longitude` (Float, optional) - User longitude
- `shopType` (String, optional) - Filter by shop type

**Returns**: `RestaurantListResponse`
- Includes full restaurant details with categories, foods, reviews
- Filters by 50km radius if coordinates provided
- Includes offers and sections

**Implementation Details**:
- Filters restaurants by `isActive: true, isAvailable: true`
- Calculates distance using Haversine formula
- Populates owner, categories (with foods), and zone
- Aggregates review data (ratings, total, reviews)

---

#### 2. `nearByRestaurantsPreview`
**Resolver**: `nearByRestaurantsPreview(_, { latitude, longitude, shopType })`

**Parameters**:
- `latitude` (Float, optional) - User latitude
- `longitude` (Float, optional) - User longitude
- `shopType` (String, optional) - Filter by shop type

**Returns**: `RestaurantPreviewListResponse`
- Lightweight restaurant preview (no full category/food details)
- Includes distance calculation
- Includes `freeDelivery` and `acceptVouchers` flags

**Implementation Details**:
- Similar to `nearByRestaurants` but without full population
- Adds `distanceWithCurrentLocation` field
- Calculates `freeDelivery` based on `minimumOrder === 0`

---

#### 3. `restaurant`
**Resolver**: `restaurant(_, { id })`

**Parameters**:
- `id` (String, required) - Restaurant ID

**Returns**: `Restaurant` or `null`
- Single restaurant with full details
- Includes categories, foods, reviews, owner, zone

**Implementation Details**:
- Populates owner, categories (with foods), and zone
- Aggregates review data (first 10 reviews, average rating, total)

---

#### 4. `topRatedVendors`
**Resolver**: `topRatedVendors(_, { latitude, longitude })`

**Parameters**:
- `latitude` (Float, required) - User latitude
- `longitude` (Float, required) - User longitude

**Returns**: `[Restaurant]`
- Top 10 restaurants sorted by rating
- Full restaurant details with categories and foods

**Implementation Details**:
- Sorts by `rating: -1`
- Limits to 10 results
- Includes review data (first 5 reviews)

---

#### 5. `topRatedVendorsPreview`
**Resolver**: `topRatedVendorsPreview(_, { latitude, longitude })`

**Parameters**:
- `latitude` (Float, required) - User latitude
- `longitude` (Float, required) - User longitude

**Returns**: `[RestaurantPreview]`
- Top 10 restaurants (preview format)
- Includes distance calculation

**Implementation Details**:
- Similar to `topRatedVendors` but in preview format
- Adds distance and delivery flags

---

#### 6. `mostOrderedRestaurants`
**Resolver**: `mostOrderedRestaurants()`

**Parameters**: None

**Returns**: `[Restaurant]`
- Top 10 restaurants by order count
- Full restaurant details

**Implementation Details**:
- Uses MongoDB aggregation to count orders per restaurant
- Sorts by order count (descending)
- Populates owner, categories (with foods)

---

#### 7. `recentOrderRestaurants`
**Resolver**: `recentOrderRestaurants()`

**Parameters**: None

**Returns**: `[Restaurant]`
- Recently active restaurants (sorted by updatedAt)
- Full restaurant details

**Implementation Details**:
- Filters by `isActive: true, isAvailable: true`
- Sorts by `updatedAt: -1`
- Limits to 10 results
- Populates owner, categories (with foods)

---

### Product/Food Queries (2 queries)

#### 8. `popularFoodItems`
**Resolver**: `popularFoodItems(_, { restaurantId })`

**Parameters**:
- `restaurantId` (String, required) - Restaurant ID

**Returns**: `[Food]`
- Top 10 most ordered food items for a restaurant
- Based on order item quantities

**Implementation Details**:
- Uses MongoDB aggregation to count item quantities
- Groups by product ID and sums quantities
- Sorts by count (descending)
- Returns top 10 products

---

#### 9. `fetchCategoryDetailsByStoreIdForMobile`
**Resolver**: `fetchCategoryDetailsByStoreIdForMobile(_, { storeId })`

**Parameters**:
- `storeId` (String, required) - Restaurant/store ID

**Returns**: `[Category]`
- Categories with foods for a restaurant
- Formatted for mobile app compatibility

**Implementation Details**:
- Finds categories by restaurant ID
- Populates foods (only active and available)
- Sorts by `order: 1`
- Returns in both standard and mobile-compatible format

---

### Configuration Queries (1 query)

#### 10. `configuration`
**Resolver**: `configuration()`

**Parameters**: None

**Returns**: `Configuration`
- Application configuration (singleton)
- Includes currency, delivery rates, client IDs, etc.

**Implementation Details**:
- Uses `Configuration.getConfiguration()` static method
- Ensures only one configuration document exists

---

### Other Queries (7 queries)

#### 11. `cuisines`
**Resolver**: `cuisines()`

**Parameters**: None

**Returns**: `[Cuisine]`
- All active cuisines

**Implementation Details**:
- Filters by `isActive: true`

---

#### 12. `myOrders`
**Resolver**: `myOrders()`

**Parameters**: None

**Returns**: `[Order]`
- User's orders (currently returns all active orders - needs user context)

**Implementation Details**:
- Currently returns all active orders (limit 50)
- Should filter by authenticated user in production
- Populates restaurant, user, and rider

---

#### 13. `orders`
**Resolver**: `orders(_, { offset })`

**Parameters**:
- `offset` (Int, optional, default: 0) - Pagination offset

**Returns**: `[Order]`
- Paginated list of orders

**Implementation Details**:
- Filters by `isActive: true`
- Sorts by `createdAt: -1`
- Skips by offset, limits to 20
- Populates restaurant, user, and rider

---

#### 14. `order`
**Resolver**: `order(_, { id })`

**Parameters**:
- `id` (String, required) - Order ID

**Returns**: `Order` or `null`
- Single order by ID

**Implementation Details**:
- Populates restaurant, user, and rider

---

#### 15. `reviewsByRestaurant`
**Resolver**: `reviewsByRestaurant(_, { restaurant })`

**Parameters**:
- `restaurant` (String, required) - Restaurant ID

**Returns**: `ReviewData`
- Reviews for a restaurant with aggregated ratings

**Implementation Details**:
- Finds reviews by restaurant ID
- Populates order and user
- Calculates average rating and total count
- Sorts by `createdAt: -1`

---

#### 16. `taxes`
**Resolver**: `taxes()`

**Parameters**: None

**Returns**: `[Tax]`
- Tax configuration (currently returns default 10% tax)

**Implementation Details**:
- Returns hardcoded default tax configuration
- `taxationCharges: 0.1` (10%), `enabled: true`

---

#### 17. `users`
**Resolver**: `users()`

**Parameters**: None

**Returns**: `[User]`
- All users (for testing purposes)

**Implementation Details**:
- Returns all users (should be restricted in production)

---

#### 18. `rider`
**Resolver**: `rider(_, { id })`

**Parameters**:
- `id` (String, optional) - Rider user ID

**Returns**: `User` or `null`
- Rider user with location information

**Implementation Details**:
- Finds user by ID
- Validates role is 'rider'
- Returns user with location from `riderProfile`

---

#### 19. `userFavourite`
**Resolver**: `userFavourite(_, { latitude, longitude }, context)`

**Parameters**:
- `latitude` (Float, optional) - User latitude
- `longitude` (Float, optional) - User longitude

**Returns**: `[Restaurant]`
- User's favorite restaurants

**Implementation Details**:
- Currently returns all favorited restaurants (needs user context)
- Should filter by authenticated user in production
- Includes review data

---

## GraphQL Mutations

### User Mutations (4 mutations)

#### 1. `addFavourite`
**Resolver**: `addFavourite(_, { id }, context)`

**Parameters**:
- `id` (String, required) - Restaurant ID to add to favorites

**Returns**: `User`
- Updated user with favorite restaurant added

**Input**:
```graphql
{
  id: "restaurant_id"
}
```

**Implementation Details**:
- Currently uses first customer user (needs authentication context)
- Adds restaurant ID to user's `favourite` array
- Populates favorite restaurants

---

#### 2. `reviewOrder`
**Resolver**: `reviewOrder(_, { reviewInput }, context)`

**Parameters**:
- `reviewInput` (ReviewInput, required) - Review input object

**Returns**: `Order`
- Updated order with review

**Input Type**: `ReviewInput`
```graphql
{
  order: String!      # Order ID
  rating: Int!        # Rating (1-5)
  description: String # Optional review text
}
```

**Implementation Details**:
- Creates or updates review for order
- Updates order with review data
- Recalculates restaurant rating and review count
- Updates restaurant's `rating`, `reviewCount`, and `reviewAverage`

---

#### 3. `selectAddress`
**Resolver**: `selectAddress(_, { id }, context)`

**Parameters**:
- `id` (String, required) - Address ID to select

**Returns**: `User`
- Updated user with selected address

**Input**:
```graphql
{
  id: "address_id"
}
```

**Implementation Details**:
- Currently uses first customer user (needs authentication context)
- Sets `selected: true` for specified address
- Sets `selected: false` for all other addresses

---

#### 4. `updateUser`
**Resolver**: `updateUser(_, { updateUserInput }, context)`

**Parameters**:
- `updateUserInput` (UpdateUserInput, required) - User update input

**Returns**: `User`
- Updated user

**Input Type**: `UpdateUserInput`
```graphql
{
  name: String
  phone: String
  phoneIsVerified: Boolean
  emailIsVerified: Boolean
  isOrderNotification: Boolean
  isOfferNotification: Boolean
}
```

**Implementation Details**:
- Currently uses first customer user (needs authentication context)
- Updates user fields with provided values
- All fields are optional

---

## GraphQL Subscriptions

**Status**: No GraphQL subscriptions are defined in the schema.

**Real-time Updates**: Real-time functionality is handled via Socket.IO, not GraphQL subscriptions.

**Socket.IO Namespaces**:
- `/orders` - Order updates
- `/riders` - Rider location updates

**Socket.IO Events**:
- `joinOrder(orderId)` - Join order room
- `leaveOrder(orderId)` - Leave order room
- `order:update` - Order update event
- `joinRiderRoom(riderId)` - Join rider room
- `leaveRiderRoom(riderId)` - Leave rider room
- `rider:location:update` - Rider location update event

---

## Resolver Summary

### Query Resolvers (17 total)

| # | Resolver Name | Parameters | Returns | Category |
|---|--------------|------------|---------|----------|
| 1 | `nearByRestaurants` | latitude, longitude, shopType | RestaurantListResponse | Restaurant |
| 2 | `nearByRestaurantsPreview` | latitude, longitude, shopType | RestaurantPreviewListResponse | Restaurant |
| 3 | `restaurant` | id | Restaurant | Restaurant |
| 4 | `topRatedVendors` | latitude, longitude | [Restaurant] | Restaurant |
| 5 | `topRatedVendorsPreview` | latitude, longitude | [RestaurantPreview] | Restaurant |
| 6 | `mostOrderedRestaurants` | - | [Restaurant] | Restaurant |
| 7 | `recentOrderRestaurants` | - | [Restaurant] | Restaurant |
| 8 | `popularFoodItems` | restaurantId | [Food] | Product |
| 9 | `fetchCategoryDetailsByStoreIdForMobile` | storeId | [Category] | Product |
| 10 | `configuration` | - | Configuration | Configuration |
| 11 | `cuisines` | - | [Cuisine] | Other |
| 12 | `myOrders` | - | [Order] | Other |
| 13 | `orders` | offset | [Order] | Other |
| 14 | `order` | id | Order | Other |
| 15 | `reviewsByRestaurant` | restaurant | ReviewData | Other |
| 16 | `taxes` | - | [Tax] | Other |
| 17 | `users` | - | [User] | Other |
| 18 | `rider` | id | User | Other |
| 19 | `userFavourite` | latitude, longitude | [Restaurant] | Other |

### Mutation Resolvers (4 total)

| # | Resolver Name | Parameters | Returns | Category |
|---|--------------|------------|---------|----------|
| 1 | `addFavourite` | id | User | User |
| 2 | `reviewOrder` | reviewInput | Order | User |
| 3 | `selectAddress` | id | User | User |
| 4 | `updateUser` | updateUserInput | User | User |

### Subscription Resolvers

**None** - Real-time updates handled via Socket.IO

---

## Authentication & Context

**Current Implementation**:
- Context is extracted from request headers: `context.token`
- Most resolvers currently use demo data (first customer user)
- **Note**: Authentication should be implemented in production

**Recommended Implementation**:
```javascript
context: ({ req }) => {
  const token = req.headers.authorization || '';
  // Verify token and extract user
  const user = verifyToken(token);
  return { user, token };
}
```

---

## Helper Functions

### `calculateDistance(lat1, lon1, lat2, lon2)`
**Location**: `resolvers.js`

**Purpose**: Calculate distance between two coordinates using Haversine formula

**Parameters**:
- `lat1` (Number) - Latitude of first point
- `lon1` (Number) - Longitude of first point
- `lat2` (Number) - Latitude of second point
- `lon2` (Number) - Longitude of second point

**Returns**: Distance in kilometers (Number)

**Used By**:
- `nearByRestaurants`
- `nearByRestaurantsPreview`
- `topRatedVendors`
- `topRatedVendorsPreview`
- `userFavourite`

---

## GraphQL Schema Structure

### Root Types

```graphql
type Query {
  # 19 query fields
}

type Mutation {
  # 4 mutation fields
}

# No Subscription type defined
```

### Type Definitions

- **20 Object Types** (Location, Restaurant, Order, User, etc.)
- **2 Input Types** (ReviewInput, UpdateUserInput)
- **1 Scalar Type** (Date)

---

## Example Queries

### Get Nearby Restaurants
```graphql
query {
  nearByRestaurants(latitude: 40.7128, longitude: -74.0060, shopType: "restaurant") {
    restaurants {
      _id
      name
      address
      rating
      reviewCount
      deliveryTime
      minimumOrder
    }
    offers {
      _id
      name
      tag
    }
    sections {
      _id
      name
    }
  }
}
```

### Get Restaurant Details
```graphql
query {
  restaurant(id: "restaurant_id") {
    _id
    name
    address
    location {
      coordinates
    }
    categories {
      _id
      title
      foods {
        _id
        title
        price
        image
      }
    }
    reviewData {
      ratings
      total
      reviews {
        rating
        description
      }
    }
  }
}
```

### Get Orders
```graphql
query {
  orders(offset: 0) {
    _id
    orderId
    orderAmount
    orderStatus
    restaurant {
      name
      address
    }
    user {
      name
      phone
    }
  }
}
```

### Review Order
```graphql
mutation {
  reviewOrder(reviewInput: {
    order: "order_id"
    rating: 5
    description: "Great food!"
  }) {
    _id
    orderId
    review {
      rating
      comment
    }
  }
}
```

### Add Favorite
```graphql
mutation {
  addFavourite(id: "restaurant_id") {
    _id
    name
    favourite
  }
}
```

---

## Summary Statistics

- **Total GraphQL Types**: 24 (20 Object Types + 2 Input Types + 1 Scalar + 1 Root Types)
- **Total Queries**: 19
- **Total Mutations**: 4
- **Total Subscriptions**: 0 (real-time via Socket.IO)
- **Total Resolvers**: 23 (19 Query + 4 Mutation)

---

## Notes

1. **Authentication**: Most resolvers need proper authentication context implementation
2. **User Context**: Several resolvers use demo data (first customer user) - should use authenticated user
3. **Real-time**: GraphQL subscriptions are not implemented; real-time updates use Socket.IO
4. **Distance Calculation**: Uses Haversine formula for geospatial queries
5. **Data Population**: Many resolvers use Mongoose `.populate()` for related data
6. **Review Aggregation**: Restaurant ratings are calculated from reviews dynamically

