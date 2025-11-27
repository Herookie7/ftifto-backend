const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type Location {
    type: String
    coordinates: [Float]
  }

  type OpeningTime {
    day: String
    times: [TimeSlot]
  }

  type TimeSlot {
    startTime: String
    endTime: String
  }

  type Variation {
    _id: ID
    title: String
    price: Float
    discounted: Float
    addons: [String]
  }

  type AddonOption {
    _id: ID
    title: String
    description: String
    price: Float
  }

  type Addon {
    _id: ID
    title: String
    description: String
    quantityMinimum: Int
    quantityMaximum: Int
    options: [AddonOption]
  }

  type Food {
    _id: ID
    title: String
    description: String
    image: String
    subCategory: String
    isOutOfStock: Boolean
    variations: [Variation]
    isActive: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type Category {
    _id: ID
    title: String
    foods: [Food]
    createdAt: Date
    updatedAt: Date
  }

  type Review {
    _id: ID
    rating: Int
    description: String
    isActive: Boolean
    createdAt: Date
    updatedAt: Date
    order: Order
    restaurant: Restaurant
  }

  type ReviewData {
    reviews: [Review]
    ratings: Float
    total: Int
  }

  type Zone {
    _id: ID
    title: String
    tax: Float
    description: String
    location: Location
    isActive: Boolean
  }

  type Restaurant {
    _id: ID
    orderId: String
    orderPrefix: String
    name: String
    image: String
    logo: String
    address: String
    location: Location
    deliveryTime: Int
    minimumOrder: Float
    tax: Float
    rating: Float
    reviewCount: Int
    reviewData: ReviewData
    reviewAverage: Float
    isActive: Boolean
    isAvailable: Boolean
    openingTimes: [OpeningTime]
    slug: String
    cuisines: [String]
    tags: [String]
    keywords: [String]
    shopType: String
    categories: [Category]
    options: [AddonOption]
    addons: [Addon]
    zone: Zone
    phone: String
    restaurantUrl: String
    stripeDetailsSubmitted: Boolean
    commissionRate: Float
    username: String
    password: String
    sections: [String]
    notificationToken: String
    enableNotification: Boolean
    deliveryBounds: Location
    owner: User
    bussinessDetails: BussinessDetails
    totalWalletAmount: Float
    withdrawnWalletAmount: Float
    currentWalletAmount: Float
  }

  type RestaurantPreview {
    _id: ID
    orderId: String
    orderPrefix: String
    name: String
    image: String
    logo: String
    address: String
    location: Location
    deliveryTime: Int
    minimumOrder: Float
    tax: Float
    rating: Float
    reviewCount: Int
    reviewAverage: Float
    isActive: Boolean
    isAvailable: Boolean
    openingTimes: [OpeningTime]
    slug: String
    cuisines: [String]
    tags: [String]
    keywords: [String]
    shopType: String
    username: String
    password: String
    sections: [String]
    stripeDetailsSubmitted: Boolean
    commissionRate: Float
    notificationToken: String
    enableNotification: Boolean
    distanceWithCurrentLocation: Float
    freeDelivery: Boolean
    acceptVouchers: Boolean
  }

  type Offer {
    _id: ID
    name: String
    tag: String
    restaurants: [String]
  }

  type Section {
    _id: ID
    name: String
    restaurants: [String]
  }

  type RestaurantListResponse {
    offers: [Offer]
    sections: [Section]
    restaurants: [Restaurant]
  }

  type RestaurantPreviewListResponse {
    offers: [Offer]
    sections: [Section]
    restaurants: [RestaurantPreview]
  }

  type User {
    _id: ID
    name: String
    email: String
    phone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
    password: String
    isActive: Boolean
    isOrderNotification: Boolean
    isOfferNotification: Boolean
    createdAt: Date
    updatedAt: Date
    addresses: [Address]
    notificationToken: String
    favourite: [String]
    userType: String
    image: String
    available: Boolean
    accountNumber: String
    currentWalletAmount: Float
    totalWalletAmount: Float
    withdrawnWalletAmount: Float
  }

  type Address {
    _id: ID
    deliveryAddress: String
    details: String
    label: String
    selected: Boolean
    location: Location
  }

  type OrderItem {
    _id: ID
    title: String
    food: String
    description: String
    image: String
    quantity: Int
    variation: Variation
    addons: [Addon]
    specialInstructions: String
    isActive: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type Order {
    _id: ID
    orderId: String
    restaurant: Restaurant
    user: User
    rider: User
    items: [OrderItem]
    paymentMethod: String
    paidAmount: Float
    orderAmount: Float
    status: Boolean
    paymentStatus: String
    orderStatus: String
    reason: String
    isActive: Boolean
    createdAt: Date
    updatedAt: Date
    deliveryAddress: Address
    deliveryCharges: Float
    tipping: Float
    taxationAmount: Float
    review: Review
    completionTime: Date
    orderDate: Date
    expectedTime: Date
    preparationTime: Int
    isPickedUp: Boolean
    acceptedAt: Date
    pickedAt: Date
    deliveredAt: Date
    cancelledAt: Date
    assignedAt: Date
    instructions: String
    isRinged: Boolean
    isRiderRinged: Boolean
  }

  type Configuration {
    _id: ID
    currency: String
    currencySymbol: String
    deliveryRate: Float
    androidClientID: String
    iOSClientID: String
    googleApiKey: String
    expoClientID: String
    termsAndConditions: String
    privacyPolicy: String
    testOtp: String
    skipMobileVerification: Boolean
    skipEmailVerification: Boolean
    costType: String
    customerAppVersion: String
    twilioEnabled: Boolean
    appAmplitudeApiKey: String
    customerAppSentryUrl: String
  }

  type Cuisine {
    _id: ID
    name: String
    description: String
    image: String
    shopType: String
  }

  type Tax {
    _id: ID
    taxationCharges: Float
    enabled: Boolean
  }

  type SubCategory {
    _id: ID
    title: String
    parentCategoryId: String
  }

  type AppVersion {
    android: String
    ios: String
  }

  type Versions {
    customerAppVersion: AppVersion
    riderAppVersion: String
    restaurantAppVersion: String
  }

  type Banner {
    _id: ID
    title: String
    description: String
    action: String
    screen: String
    file: String
    parameters: String
    isActive: Boolean
    order: Int
    createdAt: Date
    updatedAt: Date
  }

  type City {
    id: String
    name: String
    latitude: Float
    longitude: Float
  }

  type Country {
    cities: [City]
  }

  type LoginResponse {
    userId: ID
    token: String
    tokenExpiration: String
    isActive: Boolean
    name: String
    email: String
    phone: String
    isNewUser: Boolean
  }

  type AuthResponse {
    userId: ID
    token: String
    tokenExpiration: String
    name: String
    email: String
    phone: String
  }

  type VerifyOtpResponse {
    result: String
  }

  type ResultResponse {
    result: String
  }

  type UserExistResponse {
    userType: String
    _id: ID
    email: String
    phone: String
  }

  type Coupon {
    _id: ID
    title: String
    discount: Float
    enabled: Boolean
  }

  type ChatMessage {
    id: ID
    orderId: String
    message: String
    user: User
    createdAt: Date
  }

  type ChatMessageResponse {
    success: Boolean
    message: String
    data: ChatMessage
  }

  type OrderStatusUpdate {
    userId: ID
    origin: String
    order: Order
  }

  type EarningsData {
    grandTotalEarnings: GrandTotalEarnings
    earnings: [EarningsDetail]
  }

  type GrandTotalEarnings {
    storeTotal: Float
  }

  type EarningsDetail {
    storeEarnings: StoreEarnings
  }

  type StoreEarnings {
    totalEarnings: Float
  }

  type EarningsResponse {
    data: EarningsData
    message: String
  }

  type TransactionHistoryData {
    status: String
    amountTransferred: Float
    createdAt: Date
  }

  type TransactionHistoryResponse {
    data: [TransactionHistoryData]
  }

  type WithdrawRequest {
    _id: ID
    requestAmount: Float
    status: String
    createdAt: Date
    userId: String
    storeId: String
  }

  type StoreEarningsGraphData {
    totalCount: Int
    earnings: [StoreEarningsGraphItem]
  }

  type StoreEarningsGraphItem {
    _id: ID
    totalEarningsSum: Float
    earningsArray: [EarningsArrayItem]
  }

  type EarningsArrayItem {
    totalOrderAmount: Float
    totalEarnings: Float
    orderDetails: OrderDetails
    date: String
  }

  type OrderDetails {
    orderId: String
    orderType: String
    paymentMethod: String
  }

  enum UserTypeEnum {
    CUSTOMER
    SELLER
    RIDER
  }

  enum OrderTypeEnum {
    DELIVERY
    PICKUP
  }

  enum PaymentMethodEnum {
    CASH
    CARD
    WALLET
  }

  input PaginationInput {
    page: Int
    limit: Int
  }

  input DateFilter {
    startDate: String
    endDate: String
  }

  input TimingsInput {
    day: String!
    times: [TimeSlotInput!]!
  }

  input TimeSlotInput {
    startTime: String!
    endTime: String!
  }

  type Query {
    # Restaurant queries
    nearByRestaurants(latitude: Float, longitude: Float, shopType: String): RestaurantListResponse
    nearByRestaurantsPreview(latitude: Float, longitude: Float, shopType: String): RestaurantPreviewListResponse
    restaurant(id: String): Restaurant
    topRatedVendors(latitude: Float!, longitude: Float!): [Restaurant]
    topRatedVendorsPreview(latitude: Float!, longitude: Float!): [RestaurantPreview]
    mostOrderedRestaurants: [Restaurant]
    mostOrderedRestaurantsPreview(latitude: Float, longitude: Float): [RestaurantPreview]
    recentOrderRestaurants: [Restaurant]
    recentOrderRestaurantsPreview(latitude: Float, longitude: Float): [RestaurantPreview]

    # Product/Food queries
    popularFoodItems(restaurantId: String!): [Food]
    fetchCategoryDetailsByStoreIdForMobile(storeId: String!): [Category]

    # Configuration
    configuration: Configuration

    # Other queries
    cuisines: [Cuisine]
    myOrders: [Order]
    orders(offset: Int): [Order]
    order(id: String!): Order
    reviewsByRestaurant(restaurant: String!): ReviewData
    taxes: [Tax]
    users: [User]
    rider(id: String): User
    userFavourite(latitude: Float, longitude: Float): [Restaurant]
    zones: [Zone]
    subCategories: [SubCategory]
    subCategoriesByParentId(parentCategoryId: String!): [SubCategory]
    getVersions: Versions
    banners: [Banner]
    profile: User
    getCountryByIso(iso: String!): Country
    
    # Seller/Restaurant queries
    restaurantOrders: [Order]
    earnings(userType: UserTypeEnum, userId: String, orderType: OrderTypeEnum, paymentMethod: PaymentMethodEnum, pagination: PaginationInput, dateFilter: DateFilter): EarningsResponse
    transactionHistory(userType: UserTypeEnum, userId: String): TransactionHistoryResponse
    storeCurrentWithdrawRequest(storeId: String): WithdrawRequest
    storeEarningsGraph(storeId: ID!, page: Int, limit: Int, startDate: String, endDate: String): StoreEarningsGraphData
    chat(order: String!): [ChatMessage]
  }

  type Mutation {
    # User mutations
    addFavourite(id: String!): User
    reviewOrder(reviewInput: ReviewInput!): Order
    selectAddress(id: String!): User
    updateUser(updateUserInput: UpdateUserInput!): User
    # Configuration mutations
    setVersions(customerAppVersion: String!): String

    # Authentication mutations
    login(email: String, password: String, type: String!, appleId: String, name: String, notificationToken: String): LoginResponse
    createUser(userInput: CreateUserInput!): AuthResponse
    verifyOtp(otp: String!, email: String, phone: String): VerifyOtpResponse
    sendOtpToEmail(email: String!): ResultResponse
    sendOtpToPhoneNumber(phone: String!): ResultResponse

    # User management mutations
    emailExist(email: String!): UserExistResponse
    phoneExist(phone: String!): UserExistResponse
    changePassword(oldPassword: String!, newPassword: String!): String
    updateNotificationStatus(offerNotification: Boolean!, orderNotification: Boolean!): User
    Deactivate(isActive: Boolean!, email: String!): User
    pushToken(token: String): User

    # Address mutations
    createAddress(addressInput: AddressInput!): User
    editAddress(addressInput: AddressInput!): User
    deleteAddress(id: ID!): User
    deleteBulkAddresses(ids: [ID!]!): User

    # Order mutations
    placeOrder(restaurant: String!, orderInput: [OrderInput!]!, paymentMethod: String!, couponCode: String, tipping: Float!, taxationAmount: Float!, address: AddressInput!, orderDate: String!, isPickedUp: Boolean!, deliveryCharges: Float!, instructions: String): Order
    abortOrder(id: String!): Order
    assignOrder(id: String!): Order
    updateOrderStatusRider(id: String!, status: String!): Order

    # Other mutations
    forgotPassword(email: String!): ResultResponse
    resetPassword(password: String!, email: String!): ResultResponse
    getCoupon(coupon: String!): Coupon
    sendChatMessage(message: ChatMessageInput!, orderId: ID!): ChatMessageResponse
    createActivity(groupId: String!, module: String!, screenPath: String!, type: String!, details: String!): String
    
    # Seller/Restaurant mutations
    createWithdrawRequest(requestAmount: Float!, userId: String!): WithdrawRequest
    updateTimings(id: String!, openingTimes: [TimingsInput!]!): Restaurant
    toggleStoreAvailability(restaurantId: String!): Restaurant
    updateRiderLocation(latitude: String!, longitude: String!): User
    updateRiderLicenseDetails(id: String!, licenseDetails: LicenseDetailsInput): User
    updateRiderVehicleDetails(id: String!, vehicleDetails: VehicleDetailsInput): User
    updateRestaurantBussinessDetails(id: String!, bussinessDetails: BussinessDetailsInput): UpdateRestaurantResponse
  }

  type Subscription {
    subscriptionOrder(id: String!): Order
    subscriptionRiderLocation(riderId: String!): User
    orderStatusChanged(userId: String!): OrderStatusUpdate
    subscriptionNewMessage(order: ID!): ChatMessage
  }

  input ReviewInput {
    order: String!
    rating: Int!
    description: String
  }

  input UpdateUserInput {
    name: String
    phone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
    isOrderNotification: Boolean
    isOfferNotification: Boolean
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
  }

  input AddressInput {
    _id: ID
    label: String
    deliveryAddress: String
    details: String
    location: LocationInput
    selected: Boolean
  }

  input LocationInput {
    type: String
    coordinates: [Float]
  }

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

  input VariationInput {
    _id: ID
    title: String
    price: Float
    discounted: Float
    addons: [String]
  }

  input AddonInput {
    _id: ID
    title: String
    description: String
    quantityMinimum: Int
    quantityMaximum: Int
    options: [AddonOptionInput]
  }

  input AddonOptionInput {
    _id: ID
    title: String
    description: String
    price: Float
  }

  input ChatMessageInput {
    message: String!
    userId: ID
  }

  input LicenseDetailsInput {
    licenseNumber: String
    expiryDate: String
    licenseImage: String
  }

  input VehicleDetailsInput {
    vehicleType: String
    vehicleNumber: String
    vehicleModel: String
    vehicleImage: String
  }

  type BussinessDetails {
    bankName: String
    accountNumber: String
    accountName: String
    accountCode: String
  }

  input BussinessDetailsInput {
    bankName: String
    accountNumber: String
    accountName: String
    accountCode: String
  }

  type UpdateRestaurantResponse {
    success: Boolean
    message: String
    data: Restaurant
  }
`;

module.exports = typeDefs;

