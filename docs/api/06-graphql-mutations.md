# Chunk 6: GraphQL Mutations

**Endpoint:** `POST /graphql`

**Request:** `{ "query": "mutation ... { ... }", "variables": { ... } }`

**Headers:** `Authorization: Bearer <token>` (required for most mutations)

---

## Auth Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `login` | `email`, `password`, `type: String!`, `appleId`, `name`, `notificationToken` | `LoginResponse` |
| `restaurantLogin` | `username: String!`, `password: String!`, `notificationToken` | `RestaurantLoginResponse` |
| `ownerLogin` | `email: String!`, `password: String!` | `OwnerLoginResponse` |
| `riderLogin` | `username`, `password`, `notificationToken`, `timeZone: String!` | `LoginResponse` |
| `createUser` | `userInput: CreateUserInput!` | `AuthResponse` |
| `verifyOtp` | `otp: String!`, `email`, `phone` | `VerifyOtpResponse` |
| `sendOtpToEmail` | `email: String!`, `phone` | `ResultResponse` |
| `sendOtpToPhoneNumber` | `phone: String!` | `ResultResponse` |

---

## User Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `addFavourite` | `id: String!` | `User` |
| `reviewOrder` | `reviewInput: ReviewInput!` | `Order` |
| `selectAddress` | `id: String!` | `User` |
| `updateUser` | `updateUserInput: UpdateUserInput!` | `User` |
| `changePassword` | `oldPassword: String!`, `newPassword: String!` | `String` |
| `updateNotificationStatus` | `offerNotification: Boolean!`, `orderNotification: Boolean!` | `User` |
| `Deactivate` | `isActive: Boolean!`, `email: String!` | `User` |
| `pushToken` | `token: String` | `User` |
| `emailExist` | `email: String!` | `UserExistResponse` |
| `phoneExist` | `phone: String!` | `UserExistResponse` |

---

## Address Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `createAddress` | `addressInput: AddressInput!` | `User` |
| `editAddress` | `addressInput: AddressInput!` | `User` |
| `deleteAddress` | `id: ID!` | `User` |
| `deleteBulkAddresses` | `ids: [ID!]!` | `User` |

---

## Order Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `placeOrder` | `restaurant: String!`, `orderInput: [OrderInput!]!`, `paymentMethod: String!`, `couponCode`, `tipping: Float!`, `taxationAmount: Float!`, `address: AddressInput!`, `orderDate: String!`, `isPickedUp: Boolean!`, `deliveryCharges: Float!`, `instructions` | `Order` |
| `verifyRazorpayOrderPayment` | `orderId: String!`, `razorpayOrderId: String!`, `razorpayPaymentId: String!`, `razorpaySignature: String!` | `Order` |
| `abortOrder` | `id: String!` | `Order` |
| `acceptOrder` | `_id: String!`, `time: String` | `Order` |
| `cancelOrder` | `_id: String!`, `reason: String!` | `Order` |
| `orderPickedUp` | `_id: String!` | `Order` |
| `muteRing` | `orderId: String!` | `Boolean` |
| `assignOrder` | `id: String!` | `Order` |
| `updateOrderStatusRider` | `id: String!`, `status: String!`, `reason: String` | `Order` |

---

## Restaurant / Seller Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `createRestaurant` | `restaurant: RestaurantInput!`, `owner: ID!` | `Restaurant` |
| `updateTimings` | `id: String!`, `openingTimes: [TimingsInput!]!` | `Restaurant` |
| `toggleStoreAvailability` | `restaurantId: String!` | `Restaurant` |
| `updateRestaurantBussinessDetails` | `id: String!`, `bussinessDetails: BussinessDetailsInput` | `UpdateRestaurantResponse` |
| `updateRestaurantInfo` | `id: String!`, `restaurantInput: RestaurantInfoInput!` | `UpdateRestaurantResponse` |
| `updateRestaurantSubscriptionPricing` | `restaurantId: ID!`, `pricing: JSON!` | `Restaurant` |
| `updateDeliveryBoundsAndLocation` | `id: ID!`, `boundType: String!`, `bounds`, `circleBounds`, `location: CoordinatesInput!`, `address`, `postCode`, `city` | `UpdateRestaurantResponse` |
| `updateRestaurantDelivery` | `id: ID!`, `minDeliveryFee`, `deliveryDistance`, `deliveryFee` | `UpdateRestaurantResponse` |
| `toggleRestaurantPin` | `restaurantId: String!`, `isPinned: Boolean!`, `pinDurationDays: Int` | `Restaurant` |
| `createCategory` | `restaurantId: ID!`, `title: String!`, `description`, `image`, `order` | `Category` |
| `updateCategory` | `id: ID!`, `title`, `description`, `image`, `order`, `isActive` | `Category` |
| `deleteCategory` | `id: ID!` | `Boolean` |
| `createProduct` | `restaurantId: ID!`, `categoryId`, `productInput: ProductInput!` | `Product` |
| `updateProduct` | `id: ID!`, `productInput: ProductInput!`, `categoryId` | `Product` |
| `deleteProduct` | `id: ID!` | `Boolean` |
| `bulkUpdateProducts` | `productIds: [ID!]!`, `updates: BulkProductUpdateInput!` | `BulkUpdateResponse` |
| `createWithdrawRequest` | `requestAmount: Float!`, `userId: String!` | `WithdrawRequest` |

---

## Vendor Mutations (Admin)

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `createVendor` | `vendorInput: VendorInput` | `User` |
| `editVendor` | `vendorInput: VendorInput` | `User` |
| `deleteVendor` | `id: String!` | `Boolean` |

---

## Rider Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `updateRiderLocation` | `latitude: String!`, `longitude: String!` | `User` |
| `updateRiderLicenseDetails` | `id: String!`, `licenseDetails: LicenseDetailsInput` | `User` |
| `updateRiderVehicleDetails` | `id: String!`, `vehicleDetails: VehicleDetailsInput` | `User` |
| `createRiderWithdrawRequest` | `requestAmount: Float!` | `WithdrawRequest` |
| `cancelRiderWithdrawRequest` | `id: ID!` | `WithdrawRequest` |
| `createRider` | `riderInput: RiderInput!` | `User` |
| `editRider` | `riderInput: RiderInput!` | `User` |
| `deleteRider` | `id: String!` | `User` |
| `toggleAvailablity` | `id: String!` | `User` |
| `toggleRiderAvailability` | (none) | `User` |

---

## Admin Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `markWebNotificationsAsRead` | (none) | `[WebNotification]` |
| `updateCommission` | `id: String!`, `commissionType: String!`, `commissionRate: Float!` | `Restaurant` |
| `updateWithdrawReqStatus` | `id: ID!`, `status: String!` | `UpdateWithdrawRequestResponse` |

---

## Wallet Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `createRazorpayOrder` | `amount: Float!` | `RazorpayOrderResponse` |
| `verifyRazorpayPayment` | `paymentId: String!`, `orderId: String!`, `signature: String!`, `amount: Float!` | `WalletTransaction` |
| `convertRewardCoinsToWallet` | `coins: Int!` | `WalletTransaction` |

---

## Subscription Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `createSubscription` | `restaurantId: String!`, `planType: String!`, `paymentMethod: String!`, `frequencyType`, `selectedSlots` | `SubscriptionResponse` |
| `updateSubscription` | `subscriptionId: String!`, `restaurantId` | `SubscriptionResponse` |
| `cancelSubscription` | `subscriptionId: String!` | `SubscriptionResponse` |
| `createMenuSchedule` | `restaurantId: String!`, `scheduleType: String!`, `dayOfWeek`, `date`, `mealType`, `menuItems: [MenuScheduleItemInput!]!` | `MenuSchedule` |
| `updateMenuSchedule` | `scheduleId: String!`, `menuItems: [MenuScheduleItemInput!]!` | `MenuSchedule` |
| `deleteMenuSchedule` | `scheduleId: String!` | `Boolean` |
| `setSubscriptionPreferences` | `subscriptionId: ID!`, `preferences: SubscriptionPreferenceInput!` | `SubscriptionPreference` |
| `updateMealPreference` | `subscriptionId: ID!`, `dayOfWeek: String!`, `mealType: String!`, `isEnabled: Boolean!`, `deliveryTime` | `SubscriptionPreference` |
| `skipSubscriptionDelivery` | `deliveryId: ID!`, `reason` | `SubscriptionDelivery` |
| `assignMenuToDelivery` | `deliveryId: ID!`, `menuItems: [DeliveryMenuItemInput!]!` | `SubscriptionDelivery` |
| `generateWeeklyDeliveries` | `subscriptionId: ID!`, `weekStart: Date!` | `[SubscriptionDelivery]` |
| `updateDeliveryStatus` | `deliveryId: ID!`, `status: String!`, `reason` | `SubscriptionDelivery` |
| `assignSubscriptionDelivery` | `deliveryId: ID!` | `SubscriptionDelivery` |

---

## Holiday Request Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `createHolidayRequest` | `startDate: String!`, `endDate: String!`, `reason` | `HolidayRequest` |
| `updateHolidayRequestStatus` | `requestId: String!`, `status: String!`, `rejectionReason` | `HolidayRequest` |

---

## Franchise Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `createFranchise` | `franchiseInput: FranchiseInput!` | `Franchise` |
| `updateFranchise` | `franchiseId: String!`, `franchiseInput: FranchiseInput!` | `Franchise` |
| `deleteFranchise` | `franchiseId: String!` | `Boolean` |

---

## Configuration Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `setVersions` | `customerAppVersion`, `riderAppVersion`, `restaurantAppVersion` | `String` |
| `saveEmailConfiguration` | `configurationInput: EmailConfigurationInput!` | `Configuration` |
| `saveStripeConfiguration` | `configurationInput: StripeConfigurationInput!` | `Configuration` |
| `savePaypalConfiguration` | `configurationInput: PaypalConfigurationInput!` | `Configuration` |
| `saveRazorpayConfiguration` | `configurationInput: RazorpayConfigurationInput!` | `Configuration` |
| `saveFast2SMSConfiguration` | `configurationInput: Fast2SMSConfigurationInput!` | `Configuration` |
| `saveCurrencyConfiguration` | `configurationInput: CurrencyConfigurationInput!` | `Configuration` |
| `saveDeliveryRateConfiguration` | `configurationInput: DeliveryCostConfigurationInput!` | `Configuration` |
| `saveGoogleApiKeyConfiguration` | `configurationInput: GoogleApiKeyConfigurationInput!` | `Configuration` |
| `saveCloudinaryConfiguration` | `configurationInput: CloudinaryConfigurationInput!` | `Configuration` |
| `saveGoogleClientIDConfiguration` | `configurationInput: GoogleClientIDConfigurationInput!` | `Configuration` |
| `saveFirebaseConfiguration` | `configurationInput: FirebaseConfigurationInput!` | `Configuration` |
| `saveAppConfigurations` | `configurationInput: AppConfigurationsInput!` | `Configuration` |
| `saveVerificationsToggle` | `configurationInput: VerificationConfigurationInput!` | `Configuration` |
| `saveWebConfiguration` | `configurationInput: WebConfigurationInput!` | `Configuration` |

---

## Other Mutations

| Mutation | Arguments | Returns |
|----------|-----------|---------|
| `forgotPassword` | `email: String!` | `ResultResponse` |
| `resetPassword` | `password: String!`, `email: String!` | `ResultResponse` |
| `getCoupon` | `coupon: String!` | `Coupon` |
| `createCoupon` | `couponInput: CouponInput!` | `Coupon` |
| `editCoupon` | `couponInput: CouponInput!` | `Coupon` |
| `deleteCoupon` | `id: String!` | `Boolean` |
| `createCuisine` | `cuisineInput: CuisineInput!` | `Cuisine` |
| `editCuisine` | `cuisineInput: CuisineInput!` | `Cuisine` |
| `deleteCuisine` | `id: String!` | `Boolean` |
| `uploadImageToS3` | `image: String!` | `UploadImageResponse` |
| `sendChatMessage` | `message: ChatMessageInput!`, `orderId: ID!` | `ChatMessageResponse` |
| `createActivity` | `groupId: String!`, `module: String!`, `screenPath: String!`, `type: String!`, `details: String!` | `String` |
| `sendNotificationUser` | `notificationTitle`, `notificationBody: String!` | `Boolean` |

---

## Key Input Types

```graphql
input OrderInput {
  food: String!
  title: String!
  description: String
  image: String
  quantity: Int!
  variation: VariationInput
  addons: [AddonInput]
  specialInstructions: String
}

input AddressInput {
  _id: ID
  label: String
  deliveryAddress: String
  details: String
  location: LocationInput
  selected: Boolean
}

input ReviewInput {
  order: String!
  rating: Float!
  description: String
}

input CreateUserInput {
  phone: String
  email: String
  password: String
  name: String
  notificationToken: String
  appleId: String
  emailIsVerified: Boolean
  isPhoneExists: Boolean
  referralCode: String
}

input RestaurantInput {
  name: String!
  address: String!
  phone: String
  email: String
  description: String
  image: String
  logo: String
  deliveryTime: Int
  minimumOrder: Float
  deliveryCharges: Float
  location: [Float]
  username: String
  password: String
  shopType: String
  salesTax: Float
  tax: Float
  cuisines: [String]
  isPinned: Boolean
}

input ProductInput {
  title: String!
  description: String
  image: String
  price: Float!
  discountedPrice: Float
  subCategory: String
  isActive: Boolean
  available: Boolean
  isOutOfStock: Boolean
  preparationTime: Int
  variations: [VariationInput]
  addons: [AddonInput]
}

input RiderInput {
  _id: ID
  name: String!
  username: String!
  password: String!
  phone: String!
  zone: ID
  vehicleType: String
  available: Boolean
}

input VendorInput {
  _id: ID
  email: String
  password: String
  name: String
  image: String
  phone: String
  phoneNumber: String
  firstName: String
  lastName: String
}
```

---

## Example Request

```json
{
  "query": "mutation PlaceOrder($restaurant: String!, $orderInput: [OrderInput!]!, ...) { placeOrder(restaurant: $restaurant, orderInput: $orderInput, ...) { _id orderId status } }",
  "variables": {
    "restaurant": "restaurantId",
    "orderInput": [ { "food": "productId", "title": "Item", "quantity": 2 } ],
    ...
  }
}
```

---

**Source file:** `src/graphql/schema.js`
