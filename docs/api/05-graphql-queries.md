# Chunk 5: GraphQL Queries

**Endpoint:** `POST /graphql`

**Request:** `{ "query": "...", "variables": { ... }, "operationName": "..." }`

**Headers:** `Authorization: Bearer <token>` (required for most queries; some are public)

**Auth:** Most queries require a valid JWT. Role restrictions vary per query (customer, seller, rider, admin).

---

## Common Input Types

```graphql
input PaginationInput {
  page: Int
  limit: Int
  pageSize: Int
  pageNo: Int
}

input DateFilter {
  startDate: String
  endDate: String
  starting_date: String
  ending_date: String
}

input FiltersInput {
  search: String
  status: String
  userType: String
  isActive: Boolean
  page: Int
  limit: Int
  pageSize: Int
  pageNo: Int
  starting_date: String
  ending_date: String
  dateKeyword: String
}
```

**Enums:** `UserTypeEnum` (CUSTOMER, SELLER, RIDER), `OrderTypeEnum` (DELIVERY, PICKUP), `PaymentMethodEnum` (CASH, CARD, WALLET)

---

## Restaurant Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `nearByRestaurants` | `latitude: Float`, `longitude: Float`, `shopType: String` | `RestaurantListResponse` (offers, sections, restaurants) |
| `nearByRestaurantsPreview` | `latitude: Float`, `longitude: Float`, `shopType: String` | `RestaurantPreviewListResponse` |
| `restaurant` | `id: String` | `Restaurant` |
| `topRatedVendors` | `latitude: Float!`, `longitude: Float!` | `[Restaurant]` |
| `topRatedVendorsPreview` | `latitude: Float!`, `longitude: Float!` | `[RestaurantPreview]` |
| `mostOrderedRestaurants` | (none) | `[Restaurant]` |
| `mostOrderedRestaurantsPreview` | `latitude: Float`, `longitude: Float` | `[RestaurantPreview]` |
| `recentOrderRestaurants` | (none) | `[Restaurant]` |
| `recentOrderRestaurantsPreview` | `latitude: Float`, `longitude: Float` | `[RestaurantPreview]` |
| `restaurantCategories` | `restaurantId: ID!` | `[Category]` |
| `popularFoodItems` | `restaurantId: String!` | `[Food]` |
| `fetchCategoryDetailsByStoreIdForMobile` | `storeId: String!` | `[Category]` |

---

## Product/Food Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `popularFoodItems` | `restaurantId: String!` | `[Food]` |
| `fetchCategoryDetailsByStoreIdForMobile` | `storeId: String!` | `[Category]` |
| `restaurantCategories` | `restaurantId: ID!` | `[Category]` |

---

## Order Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `myOrders` | (none) | `[Order]` |
| `orders` | `offset: Int` | `[Order]` |
| `order` | `id: String!` | `Order` |
| `restaurantOrders` | (none) | `[Order]` |
| `riderOrders` | (none) | `[Order]` |
| `ordersByRestId` | `restaurantId: String!`, `filters: FiltersInput` | `[Order]` |
| `ordersByRestIdWithoutPagination` | `restaurantId: String!`, `filters: FiltersInput` | `[Order]` |
| `allOrdersWithoutPagination` | `filters: FiltersInput` | `[Order]` |
| `getActiveOrders` | `restaurantId: ID`, `page: Int`, `rowsPerPage: Int`, `actions: [String]`, `search: String` | `ActiveOrdersResponse` |
| `ordersByUser` | `userId: ID!`, `page: Int`, `limit: Int` | `OrdersByUserResponse` |

---

## User / Profile Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `profile` | (none) | `User` |
| `users` | (none) | `[User]` |
| `user` | `id: ID!` | `User` |
| `rider` | `id: String` | `User` |
| `userFavourite` | `latitude: Float`, `longitude: Float` | `[Restaurant]` |
| `vendors` | `filters: FiltersInput` | `[User]` |
| `riders` | `filters: FiltersInput` | `[User]` |
| `availableRiders` | `zoneId: String` | `[User]` |
| `ridersByZone` | `zoneId: String!` | `[User]` |
| `staffs` | `filters: FiltersInput` | `[User]` |
| `restaurantByOwner` | `ownerId: String!` | `User` |
| `getVendor` | `vendorId: String!` | `User` |
| `getActiveRiders` | (none) | `[User]` |

---

## Configuration & Misc Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `configuration` | (none) | `Configuration` |
| `cuisines` | (none) | `[Cuisine]` |
| `banners` | (none) | `[Banner]` |
| `zones` | (none) | `[Zone]` |
| `reviews` | (none) | `[Review]` |
| `reviewsByRestaurant` | `restaurant: String!` | `ReviewData` |
| `taxes` | (none) | `[Tax]` |
| `getVersions` | (none) | `Versions` |
| `getCountryByIso` | `iso: String!` | `Country` |
| `subCategories` | (none) | `[SubCategory]` |
| `subCategoriesByParentId` | `parentCategoryId: String!` | `[SubCategory]` |

---

## Dashboard / Admin Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `webNotifications` | `userId: String`, `pagination: PaginationInput` | `[WebNotification]` |
| `getDashboardUsers` | (none) | `DashboardUsersResponse` |
| `getDashboardUsersByYear` | `year: Int` | `DashboardUsersResponse` |
| `getDashboardOrdersByType` | `dateFilter: DateFilter` | `[DashboardOrdersByTypeItem]` |
| `getDashboardSalesByType` | `dateFilter: DateFilter` | `[DashboardSalesByTypeItem]` |
| `getRestaurantDashboardOrdersSalesStats` | `restaurant: String!`, `starting_date: String!`, `ending_date: String!`, `dateKeyword: String` | `RestaurantDashboardOrdersSalesStats` |
| `getRestaurantDashboardSalesOrderCountDetailsByYear` | `restaurant: String!`, `year: Int!` | `RestaurantDashboardSalesOrderCountDetailsByYear` |
| `getDashboardOrderSalesDetailsByPaymentMethod` | `restaurant: String!`, `starting_date: String!`, `ending_date: String!` | `DashboardOrderSalesDetailsByPaymentMethod` |
| `getSellerDashboardQuickStats` | `restaurantId: String!` | `SellerDashboardQuickStats` |
| `earnings` | `userType`, `userId`, `orderType`, `paymentMethod`, `pagination`, `dateFilter`, `search` | `EarningsResponse` |
| `transactionHistory` | `userType`, `userId`, `search`, `pagination`, `dateFilter` | `TransactionHistoryResponse` |
| `storeCurrentWithdrawRequest` | `storeId: String` | `WithdrawRequest` |
| `storeEarningsGraph` | `storeId: ID!`, `page`, `limit`, `startDate`, `endDate` | `StoreEarningsGraphData` |
| `riderEarningsGraph` | `riderId: ID!`, `page`, `limit`, `startDate`, `endDate` | `RiderEarningsGraphData` |
| `riderCurrentWithdrawRequest` | `riderId: String` | `WithdrawRequest` |
| `restaurants` | `filters: FiltersInput` | `[Restaurant]` |
| `restaurantsPaginated` | `filters: FiltersInput` | `RestaurantPaginatedResponse` |
| `coupons` | (none) | `[Coupon]` |
| `restaurantCoupons` | `restaurantId: String!` | `[Coupon]` |
| `tips` | (none) | `Tipping` |
| `notifications` | `filters: FiltersInput` | `[Notification]` |
| `auditLogs` | `filters: FiltersInput` | `AuditLogResponse` |
| `withdrawRequests` | `userType`, `userId`, `pagination`, `search` | `WithdrawRequestResponse` |
| `getTicketUsers` | `filters: FiltersInput` | `[User]` |
| `getTicketUsersWithLatest` | `filters: FiltersInput` | `[User]` |
| `getSingleUserSupportTickets` | `userId: String!` | `[SupportTicket]` |
| `getSingleSupportTicket` | `ticketId: String!` | `SupportTicket` |
| `getTicketMessages` | `ticketId: String!` | `[SupportTicketMessage]` |
| `getClonedRestaurants` | (none) | `[Restaurant]` |
| `getClonedRestaurantsPaginated` | `filters: FiltersInput` | `RestaurantPaginatedResponse` |
| `getRestaurantDeliveryZoneInfo` | `restaurantId: String!` | `RestaurantDeliveryZoneInfo` |
| `chat` | `order: String!` | `[ChatMessage]` |
| `lastOrderCreds` | (none) | `LastOrderCredsResponse` |

---

## Wallet Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `getWalletBalance` | (none) | `WalletBalance` |
| `getWalletTransactions` | `pagination: PaginationInput` | `WalletTransactionResponse` |
| `getTransactionSummary` | (none) | `TransactionSummary` |

---

## Subscription Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `getUserSubscription` | (none) | `Subscription` |
| `getSubscriptionPlans` | `restaurantId: ID` | `[SubscriptionPlan]` |
| `getMenuSchedules` | `restaurantId: ID!`, `scheduleType: String` | `[MenuSchedule]` |
| `getMenuSchedule` | `scheduleId: ID!` | `MenuSchedule` |
| `getSubscriptionPreferences` | `subscriptionId: ID!` | `SubscriptionPreference` |
| `getSubscriptionDeliveries` | `subscriptionId: ID!`, `status`, `startDate`, `endDate` | `[SubscriptionDelivery]` |
| `getWeeklyMenuForSubscription` | `subscriptionId: ID!`, `weekStart: Date!` | `[MenuSchedule]` |
| `getTodaysDeliveries` | `restaurantId: ID!` | `[SubscriptionDelivery]` |
| `getDailyDeliveries` | `restaurantId: ID!`, `date: Date`, `mealType: String` | `[SubscriptionDelivery]` |
| `getPendingDeliveriesForZone` | (none) | `[SubscriptionDelivery]` |
| `getRiderAssignments` | (none) | `[SubscriptionDelivery]` |
| `getHolidayRequests` | `status: String` | `[HolidayRequest]` |
| `getCustomerLeaveRequests` | `status: String` | `[HolidayRequest]` |

---

## Example Request

```json
{
  "query": "query GetProfile { profile { _id name email phone role } }",
  "operationName": "GetProfile"
}
```

---

**Source file:** `src/graphql/schema.js`
