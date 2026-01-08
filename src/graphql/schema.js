const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date
  scalar JSON

  type Location {
    type: String
    coordinates: JSON
  }

  type UserLocation {
    coordinates: JSON
    deliveryAddress: String
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
    isOutOfStock: Boolean
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
    price: Float
    discountedPrice: Float
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
    description: String
    image: String
    foods: [Food]
    createdAt: Date
    updatedAt: Date
  }

  type Review {
    _id: ID
    rating: Float
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
    email: String
    restaurantUrl: String
    stripeDetailsSubmitted: Boolean
    commissionRate: Float
    commissionType: String
    deliveryCharges: Float
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
    # Admin app fields
    unique_restaurant_id: String
    deliveryInfo: DeliveryInfo
    city: String
    postCode: String
    isPinned: Boolean
    pinExpiry: Date
    pinPaymentId: String
    franchise: Franchise
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
    commissionType: String
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
    # Admin app fields
    status: String
    lastLogin: Date
    notes: String
    username: String
    unique_id: String
    plainPassword: String
    vehicleType: String
    assigned: Boolean
    permissions: [String]
    zone: Zone
    restaurants: [Restaurant]
    bussinessDetails: BussinessDetails
    licenseDetails: LicenseDetails
    vehicleDetails: VehicleDetails
    # Customer profile fields
    customerProfile: CustomerProfile
    rewardCoins: Float
    referralCode: String
    referredBy: User
    isFirstOrder: Boolean
    location: UserLocation
    addressBook: [Address]
    # Franchise fields
    franchise: Franchise
    role: String
  }

  type CustomerProfile {
    currentWalletAmount: Float
    totalWalletAmount: Float
    rewardCoins: Float
    referralCode: String
    referredBy: ID
    isFirstOrder: Boolean
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
    zone: Zone
    franchise: Franchise
  }

  type Configuration {
    _id: ID
    currency: String
    currencySymbol: String
    deliveryRate: Float
    freeDeliveryAmount: Float
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
    # Email configuration
    email: String
    emailName: String
    password: String
    enableEmail: Boolean
    formEmail: String
    # PayPal configuration
    clientId: String
    clientSecret: String
    sandbox: Boolean
    # Stripe configuration
    publishableKey: String
    secretKey: String
    # Razorpay configuration
    razorpayKeyId: String
    razorpayKeySecret: String
    razorpaySandbox: Boolean
    # Fast2SMS configuration
    fast2smsApiKey: String
    fast2smsEnabled: Boolean
    fast2smsRoute: String
    # WhatsApp OTP
    skipWhatsAppOTP: Boolean
    # SendGrid configuration
    sendGridApiKey: String
    sendGridEnabled: Boolean
    sendGridEmail: String
    sendGridEmailName: String
    sendGridPassword: String
    # Cloudinary configuration
    cloudinaryUploadUrl: String
    cloudinaryApiKey: String
    # Google Client ID
    webClientID: String
    googleMapLibraries: String
    googleColor: String
    # Firebase configuration
    firebaseKey: String
    authDomain: String
    projectId: String
    storageBucket: String
    msgSenderId: String
    appId: String
    measurementId: String
    # App configuration
    isPaidVersion: Boolean
    vapidKey: String
    supportPhone: String
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
    riderAppVersion: AppVersion
    restaurantAppVersion: AppVersion
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

  type RestaurantLoginResponse {
    token: String
    restaurantId: ID
  }

  type OwnerRestaurantPreview {
    _id: ID
    orderId: String
    name: String
    image: String
    address: String
  }

  type OwnerLoginResponse {
    userId: ID
    token: String
    email: String
    userType: String
    restaurants: [OwnerRestaurantPreview]
    permissions: [String]
    userTypeId: String
    image: String
    name: String
    shopType: String
  }

  type LastOrderCredsResponse {
    restaurantUsername: String
    restaurantPassword: String
  }

  type Coupon {
    _id: ID
    title: String
    discount: Float
    enabled: Boolean
    code: String
    minOrderAmount: Float
  }

  input CouponInput {
    _id: ID
    title: String!
    discount: Float!
    enabled: Boolean
    code: String
    minOrderAmount: Float
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

  type ZoneOrderUpdate {
    zoneId: String
    origin: String
    order: Order
  }

  type EarningsData {
    grandTotalEarnings: GrandTotalEarnings
    earnings: [EarningsDetail]
  }

  type GrandTotalEarnings {
    storeTotal: Float
    platformTotal: Float
    riderTotal: Float
  }

  type EarningsDetail {
    storeEarnings: StoreEarnings
    # Admin app fields
    _id: ID
    orderId: String
    orderType: String
    paymentMethod: String
    createdAt: Date
    updatedAt: Date
    platformEarnings: PlatformEarnings
    riderEarnings: RiderEarnings
  }

  type PlatformEarnings {
    marketplaceCommission: Float
    deliveryCommission: Float
    tax: Float
    platformFee: Float
    totalEarnings: Float
  }

  type RiderEarnings {
    riderId: String
    deliveryFee: Float
    tip: Float
    totalEarnings: Float
    rider: User
  }

  type StoreEarnings {
    totalEarnings: Float
    storeId: String
    orderAmount: Float
    store: Restaurant
  }

  type EarningsResponse {
    data: EarningsData
    message: String
    success: Boolean
    pagination: PaginationInfo
  }

  type TransactionHistoryData {
    status: String
    amountTransferred: Float
    createdAt: Date
    # Admin app fields
    _id: ID
    amountCurrency: String
    transactionId: String
    userType: String
    userId: String
    toBank: ToBankInfo
    rider: User
    store: Restaurant
  }

  type ToBankInfo {
    bankName: String
    accountNumber: String
    accountName: String
    accountCode: String
  }

  type TransactionHistoryResponse {
    data: [TransactionHistoryData]
    pagination: PaginationInfo
  }

  type PaginationInfo {
    page: Int
    limit: Int
    total: Int
    totalPages: Int
  }

  type PaginationResponse {
    total: Int
    pageSize: Int
    pageNo: Int
    totalPages: Int
  }

  type WithdrawRequest {
    _id: ID
    requestAmount: Float
    status: String
    createdAt: Date
    userId: String
    storeId: String
    # Admin app fields
    requestId: String
    requestTime: Date
    rider: User
    store: Restaurant
  }

  type WithdrawRequestResponse {
    success: Boolean
    message: String
    pagination: PaginationResponse
    data: [WithdrawRequest]
  }

  type UpdateWithdrawRequestResponse {
    success: Boolean
    message: String
    data: WithdrawRequest
  }

  type DeliveryInfo {
    minDeliveryFee: Float
    deliveryDistance: Float
    deliveryFee: Float
  }

  type Notification {
    _id: ID
    title: String
    message: String
    type: String
    userId: String
    restaurantId: String
    orderId: String
    isRead: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type WebNotification {
    _id: ID
    title: String
    message: String
    body: String
    navigateTo: String
    type: String
    userId: String
    isRead: Boolean
    read: Boolean
    createdAt: Date
  }

  type AuditLog {
    _id: ID
    userId: String
    action: String
    module: String
    screenPath: String
    details: String
    createdAt: Date
    user: User
  }

  type AuditLogResponse {
    data: [AuditLog]
    total: Int
  }

  type Tipping {
    _id: ID
    enabled: Boolean
    amounts: [Float]
    defaultAmount: Float
  }

  type DashboardUsersResponse {
    usersCount: [Int]
    vendorsCount: [Int]
    restaurantsCount: [Int]
    ridersCount: [Int]
    # Legacy fields for backward compatibility
    total: Int
    active: Int
    inactive: Int
    newToday: Int
    newThisWeek: Int
    newThisMonth: Int
  }

  type DashboardOrdersByTypeItem {
    label: String
    value: Int
  }

  type DashboardSalesByTypeItem {
    label: String
    value: Float
  }

  type DashboardOrdersByTypeResponse {
    delivery: Int
    pickup: Int
    total: Int
    # Array format for frontend
    items: [DashboardOrdersByTypeItem]
  }

  type DashboardSalesByTypeResponse {
    delivery: Float
    pickup: Float
    total: Float
    # Array format for frontend
    items: [DashboardSalesByTypeItem]
  }

  type RestaurantDashboardOrdersSalesStats {
    totalOrders: Int
    totalSales: Float
    totalCODOrders: Int
    totalCardOrders: Int
    orderStatusBreakdown: OrderStatusBreakdown
  }

  type SellerDashboardQuickStats {
    todayOrders: Int
    todayRevenue: Float
    pendingOrders: Int
    activeOrders: Int
  }

  type OrderStatusBreakdown {
    received: Int
    prepared: Int
    pending: Int
    onWay: Int
    return: Int
    delivered: Int
    cancelled: Int
  }

  type RestaurantDashboardSalesOrderCountDetailsByYear {
    salesAmount: Float
    ordersCount: Int
  }

  type PaymentMethodSalesData {
    _type: String
    data: PaymentMethodSalesDataDetails
  }

  type PaymentMethodSalesDataDetails {
    total_orders: Int
    total_sales: Float
    total_sales_without_delivery: Float
    total_delivery_fee: Float
  }

  type DashboardOrderSalesDetailsByPaymentMethod {
    all: PaymentMethodSalesData
    cod: PaymentMethodSalesData
    card: PaymentMethodSalesData
  }

  type LicenseDetails {
    licenseNumber: String
    expiryDate: String
    licenseImage: String
  }

  type VehicleDetails {
    vehicleType: String
    vehicleNumber: String
    vehicleModel: String
    vehicleImage: String
  }

  type RestaurantPaginatedResponse {
    data: [Restaurant]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type OrdersByUserResponse {
    orders: [Order]
    totalCount: Int
    totalPages: Int
    currentPage: Int
    nextPage: Int
    prevPage: Int
  }

  type ActiveOrdersResponse {
    totalCount: Int
    orders: [Order]
  }

  type SupportTicket {
    _id: ID
    userId: String
    subject: String
    status: String
    priority: String
    createdAt: Date
    updatedAt: Date
    user: User
    latestMessage: SupportTicketMessage
  }

  type SupportTicketMessage {
    _id: ID
    ticketId: String
    message: String
    senderId: String
    senderType: String
    createdAt: Date
    sender: User
  }

  type RestaurantDeliveryZoneInfo {
    restaurantId: String
    deliveryBounds: Location
    zone: Zone
    deliveryInfo: DeliveryInfo
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

  type RiderEarningsGraphData {
    totalCount: Int
    earnings: [RiderEarningsGraphItem]
  }

  type RiderEarningsGraphItem {
    _id: ID
    date: String
    totalEarningsSum: Float
    totalTipsSum: Float
    totalDeliveries: Int
    totalHours: Float
    earningsArray: [RiderEarningsArrayItem]
  }

  type RiderEarningsArrayItem {
    tip: Float
    deliveryFee: Float
    totalEarnings: Float
    date: String
    orderDetails: OrderDetails
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

  type WalletTransaction {
    _id: ID
    userId: ID
    userType: String
    type: String
    amount: Float
    balanceAfter: Float
    description: String
    transactionType: String
    orderId: ID
    referenceId: String
    status: String
    createdAt: Date
    updatedAt: Date
    franchise: Franchise
  }

  type WalletBalance {
    currentBalance: Float
    totalAdded: Float
    minimumBalance: Float
  }

  type WalletTransactionResponse {
    data: [WalletTransaction]
    pagination: PaginationInfo
  }

  type TransactionSummary {
    totalReferralPayouts: Float
    totalCoinConversions: Float
    totalWalletTopUps: Float
    referralCount: Int
    coinConversionCount: Int
  }

  type Subscription {
    _id: ID
    userId: ID
    user: User
    restaurantId: Restaurant
    restaurant: Restaurant
    planType: String
    planName: String
    duration: Int
    totalTiffins: Int
    remainingTiffins: Int
    remainingDays: Int
    price: Float
    startDate: Date
    endDate: Date
    status: String
    freeDelivery: Boolean
    paymentMethod: String
    paymentStatus: String
    orderId: String
    frequencyType: String
    selectedSlots: [String]
    createdAt: Date
    updatedAt: Date
  }

  type MenuSchedule {
    _id: ID
    restaurantId: ID
    scheduleType: String
    dayOfWeek: String
    date: Date
    mealType: String
    menuItems: [MenuScheduleItem]
    isActive: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type MenuScheduleItem {
    productId: ID
    product: Product
    isAvailable: Boolean
    priceOverride: Float
  }

  # Subscription-Menu Linking Types
  type MealPreference {
    dayOfWeek: String!
    mealType: String
    isEnabled: Boolean!
    deliveryTime: String
  }

  type ProductPreference {
    productId: ID!
    product: Product
    isPreferred: Boolean!
  }

  type SubscriptionPreference {
    _id: ID
    subscriptionId: ID!
    subscription: Subscription
    mealPreferences: [MealPreference]
    defaultProductPreferences: [ProductPreference]
    dietaryRestrictions: [String]
    specialInstructions: String
    createdAt: Date
    updatedAt: Date
  }

  type DeliveryMenuItem {
    productId: ID!
    product: Product
    title: String!
    quantity: Int!
    price: Float!
  }

  type SubscriptionDelivery {
    _id: ID
    subscriptionId: Subscription!
    subscription: Subscription
    menuScheduleId: ID
    menuSchedule: MenuSchedule
    scheduledDate: Date!
    dayOfWeek: String!
    mealType: String
    menuItems: [DeliveryMenuItem]
    status: String!
    deliveryTime: String
    orderId: ID
    order: Order
    skipReason: String
    deliveredAt: Date
    notes: String
    canSkip: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type HolidayRequest {
    _id: ID
    riderId: ID
    rider: User
    startDate: Date
    endDate: Date
    reason: String
    status: String
    approvedBy: User
    approvedAt: Date
    rejectionReason: String
    createdAt: Date
    updatedAt: Date
  }

  type Franchise {
    _id: ID
    name: String
    city: String
    area: String
    workingArea: Location
    zone: Zone
    owner: User
    contactPerson: ContactPerson
    isActive: Boolean
    startDate: Date
    endDate: Date
    createdAt: Date
    updatedAt: Date
  }

  type ContactPerson {
    name: String
    email: String
    phone: String
  }

  type SubscriptionExpiryReport {
    expired: [Subscription]
    expiringSoon: [Subscription]
    total: Int
  }

  type RemainingTiffinsReport {
    users: [UserRemainingTiffins]
    total: Int
  }

  type UserRemainingTiffins {
    user: User
    subscription: Subscription
    remainingTiffins: Int
    remainingDays: Int
  }

  type WalletLowBalanceReport {
    users: [UserWalletBalance]
    total: Int
  }

  type UserWalletBalance {
    user: User
    currentBalance: Float
    minimumBalance: Float
  }

  type WeeklySellerPaymentsReport {
    sellers: [SellerPayment]
    totalAmount: Float
    total: Int
  }

  type SellerPayment {
    seller: User
    restaurant: Restaurant
    amount: Float
    ordersCount: Int
  }

  type SubscriptionPlan {
    _id: ID
    planType: String
    planName: String
    duration: Int
    totalTiffins: Int
    price: Float
    description: String
    isActive: Boolean
  }

  type SubscriptionResponse {
    subscription: Subscription
    message: String
    success: Boolean
  }

  type RazorpayOrderResponse {
    id: String
    amount: Float
    currency: String
    key: String
    error: String
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

  input TimingsInput {
    day: String!
    times: [TimeSlotInput!]!
  }

  input TimeSlotInput {
    startTime: String!
    endTime: String!
  }

  # Configuration Input Types
  input EmailConfigurationInput {
    email: String
    emailName: String
    password: String
    enableEmail: Boolean
  }

  input StripeConfigurationInput {
    publishableKey: String
    secretKey: String
  }

  input PaypalConfigurationInput {
    clientId: String
    clientSecret: String
    sandbox: Boolean
  }

  input RazorpayConfigurationInput {
    keyId: String
    keySecret: String
    sandbox: Boolean
  }

  input Fast2SMSConfigurationInput {
    apiKey: String
    enabled: Boolean
    route: String
  }

  input CurrencyConfigurationInput {
    currency: String
    currencySymbol: String
  }

  input DeliveryCostConfigurationInput {
    deliveryRate: Float
    freeDeliveryAmount: Float
    costType: String
  }

  input GoogleApiKeyConfigurationInput {
    googleApiKey: String
  }

  input CloudinaryConfigurationInput {
    cloudinaryUploadUrl: String
    cloudinaryApiKey: String
  }

  input GoogleClientIDConfigurationInput {
    webClientID: String
    androidClientID: String
    iOSClientID: String
    expoClientID: String
  }

  input FirebaseConfigurationInput {
    firebaseKey: String
    authDomain: String
    projectId: String
    storageBucket: String
    msgSenderId: String
    appId: String
    measurementId: String
    vapidKey: String
  }

  input AppConfigurationsInput {
    termsAndConditions: String
    privacyPolicy: String
    testOtp: String
    supportPhone: String
  }

  input VerificationConfigurationInput {
    skipEmailVerification: Boolean
    skipMobileVerification: Boolean
    skipWhatsAppOTP: Boolean
  }

  input WebConfigurationInput {
    googleMapLibraries: String
    googleColor: String
  }

  input VersionsInput {
    customerAppVersion: AppVersionInput
    riderAppVersion: AppVersionInput
    restaurantAppVersion: AppVersionInput
  }

  input AppVersionInput {
    android: String
    ios: String
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
    restaurantCategories(restaurantId: ID!): [Category]

    # Configuration
    configuration: Configuration

    # Other queries
    cuisines: [Cuisine]
    myOrders: [Order]
    orders(offset: Int): [Order]
    order(id: String!): Order
    reviews: [Review]
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
    lastOrderCreds: LastOrderCredsResponse
    earnings(userType: UserTypeEnum, userId: String, orderType: OrderTypeEnum, paymentMethod: PaymentMethodEnum, pagination: PaginationInput, dateFilter: DateFilter, search: String): EarningsResponse
    transactionHistory(userType: UserTypeEnum, userId: String, search: String, pagination: PaginationInput, dateFilter: DateFilter): TransactionHistoryResponse
    storeCurrentWithdrawRequest(storeId: String): WithdrawRequest
    storeEarningsGraph(storeId: ID!, page: Int, limit: Int, startDate: String, endDate: String): StoreEarningsGraphData
    chat(order: String!): [ChatMessage]
    
    # Rider queries
    riderOrders: [Order]
    riderEarningsGraph(riderId: ID!, page: Int, limit: Int, startDate: String, endDate: String): RiderEarningsGraphData
    riderCurrentWithdrawRequest(riderId: String): WithdrawRequest
    
    # Admin app queries
    webNotifications(userId: String, pagination: PaginationInput): [WebNotification]
    getDashboardUsers: DashboardUsersResponse
    getDashboardUsersByYear(year: Int): DashboardUsersResponse
    getDashboardOrdersByType(dateFilter: DateFilter): [DashboardOrdersByTypeItem]
    getDashboardSalesByType(dateFilter: DateFilter): [DashboardSalesByTypeItem]
    getRestaurantDashboardOrdersSalesStats(restaurant: String!, starting_date: String!, ending_date: String!, dateKeyword: String): RestaurantDashboardOrdersSalesStats
    getRestaurantDashboardSalesOrderCountDetailsByYear(restaurant: String!, year: Int!): RestaurantDashboardSalesOrderCountDetailsByYear
    getDashboardOrderSalesDetailsByPaymentMethod(restaurant: String!, starting_date: String!, ending_date: String!): DashboardOrderSalesDetailsByPaymentMethod
    getSellerDashboardQuickStats(restaurantId: String!): SellerDashboardQuickStats
    vendors(filters: FiltersInput): [User]
    riders(filters: FiltersInput): [User]
    availableRiders(zoneId: String): [User]
    ridersByZone(zoneId: String!): [User]
    staffs(filters: FiltersInput): [User]
    restaurants(filters: FiltersInput): [Restaurant]
    restaurantsPaginated(filters: FiltersInput): RestaurantPaginatedResponse
    restaurantByOwner(ownerId: String!): User
    getVendor(vendorId: String!): User
    user(id: ID!): User
    allOrdersWithoutPagination(filters: FiltersInput): [Order]
    ordersByRestIdWithoutPagination(restaurantId: String!, filters: FiltersInput): [Order]
    getActiveOrders(restaurantId: ID, page: Int, rowsPerPage: Int, actions: [String], search: String): ActiveOrdersResponse
    ordersByRestId(restaurantId: String!, filters: FiltersInput): [Order]
    ordersByUser(userId: ID!, page: Int, limit: Int): OrdersByUserResponse
    coupons: [Coupon]
    restaurantCoupons(restaurantId: String!): [Coupon]
    tips: Tipping
    notifications(filters: FiltersInput): [Notification]
    auditLogs(filters: FiltersInput): AuditLogResponse
    withdrawRequests(userType: UserTypeEnum, userId: String, pagination: PaginationInput, search: String): WithdrawRequestResponse
    getTicketUsers(filters: FiltersInput): [User]
    getTicketUsersWithLatest(filters: FiltersInput): [User]
    getSingleUserSupportTickets(userId: String!): [SupportTicket]
    getSingleSupportTicket(ticketId: String!): SupportTicket
    getTicketMessages(ticketId: String!): [SupportTicketMessage]
    getClonedRestaurants: [Restaurant]
    getClonedRestaurantsPaginated(filters: FiltersInput): RestaurantPaginatedResponse
    getRestaurantDeliveryZoneInfo(restaurantId: String!): RestaurantDeliveryZoneInfo
    
    # Wallet queries
    getWalletBalance: WalletBalance
    getWalletTransactions(pagination: PaginationInput): WalletTransactionResponse
    getTransactionSummary: TransactionSummary
    
    # Subscription queries
    getUserSubscription: Subscription
    getSubscriptionPlans: [SubscriptionPlan]

    # Menu schedule queries (Seller app)
    getMenuSchedules(restaurantId: ID!, scheduleType: String): [MenuSchedule]
    getMenuSchedule(scheduleId: ID!): MenuSchedule
    
    # Subscription-Menu Linking queries
    getSubscriptionPreferences(subscriptionId: ID!): SubscriptionPreference

    getSubscriptionDeliveries(subscriptionId: ID!, status: String, startDate: Date, endDate: Date): [SubscriptionDelivery]
    getWeeklyMenuForSubscription(subscriptionId: ID!, weekStart: Date!): [MenuSchedule]
    getTodaysDeliveries(restaurantId: ID!): [SubscriptionDelivery]
    getDailyDeliveries(restaurantId: ID!, date: Date, mealType: String): [SubscriptionDelivery]
    
    # Rider App Queries
    getPendingDeliveriesForZone: [SubscriptionDelivery]
    getRiderAssignments: [SubscriptionDelivery]
    getActiveRiders: [User]
    
    # Holiday Request Queries
    getHolidayRequests(status: String): [HolidayRequest]
  }

  type Mutation {
    # User mutations
    addFavourite(id: String!): User
    reviewOrder(reviewInput: ReviewInput!): Order
    selectAddress(id: String!): User
    updateUser(updateUserInput: UpdateUserInput!): User
    # Configuration mutations
    setVersions(customerAppVersion: AppVersionInput, riderAppVersion: AppVersionInput, restaurantAppVersion: AppVersionInput): String
    saveEmailConfiguration(configurationInput: EmailConfigurationInput!): Configuration
    saveStripeConfiguration(configurationInput: StripeConfigurationInput!): Configuration
    savePaypalConfiguration(configurationInput: PaypalConfigurationInput!): Configuration
    saveRazorpayConfiguration(configurationInput: RazorpayConfigurationInput!): Configuration
    saveFast2SMSConfiguration(configurationInput: Fast2SMSConfigurationInput!): Configuration
    saveCurrencyConfiguration(configurationInput: CurrencyConfigurationInput!): Configuration
    saveDeliveryRateConfiguration(configurationInput: DeliveryCostConfigurationInput!): Configuration
    saveGoogleApiKeyConfiguration(configurationInput: GoogleApiKeyConfigurationInput!): Configuration
    saveCloudinaryConfiguration(configurationInput: CloudinaryConfigurationInput!): Configuration
    saveGoogleClientIDConfiguration(configurationInput: GoogleClientIDConfigurationInput!): Configuration
    saveFirebaseConfiguration(configurationInput: FirebaseConfigurationInput!): Configuration
    saveAppConfigurations(configurationInput: AppConfigurationsInput!): Configuration
    saveVerificationsToggle(configurationInput: VerificationConfigurationInput!): Configuration
    saveWebConfiguration(configurationInput: WebConfigurationInput!): Configuration

    # Authentication mutations
    login(email: String, password: String, type: String!, appleId: String, name: String, notificationToken: String): LoginResponse
    restaurantLogin(username: String!, password: String!, notificationToken: String): RestaurantLoginResponse
    ownerLogin(email: String!, password: String!): OwnerLoginResponse
    riderLogin(username: String, password: String, notificationToken: String, timeZone: String!): LoginResponse
    createRiderWithdrawRequest(requestAmount: Float!): WithdrawRequest
    cancelRiderWithdrawRequest(id: ID!): WithdrawRequest
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
    acceptOrder(_id: String!, time: String): Order
    cancelOrder(_id: String!, reason: String!): Order
    orderPickedUp(_id: String!): Order
    muteRing(orderId: String!): Boolean
    assignOrder(id: String!): Order
    updateOrderStatusRider(id: String!, status: String!, reason: String): Order

    # Other mutations
    forgotPassword(email: String!): ResultResponse
    resetPassword(password: String!, email: String!): ResultResponse
    getCoupon(coupon: String!): Coupon
    createCoupon(couponInput: CouponInput!): Coupon
    editCoupon(couponInput: CouponInput!): Coupon
    deleteCoupon(id: String!): Boolean
    createCuisine(cuisineInput: CuisineInput!): Cuisine
    editCuisine(cuisineInput: CuisineInput!): Cuisine
    deleteCuisine(id: String!): Boolean
    uploadImageToS3(image: String!): UploadImageResponse
    sendChatMessage(message: ChatMessageInput!, orderId: ID!): ChatMessageResponse
    createActivity(groupId: String!, module: String!, screenPath: String!, type: String!, details: String!): String
    
    # Seller/Restaurant mutations
    createRestaurant(restaurant: RestaurantInput!, owner: ID!): Restaurant
    createWithdrawRequest(requestAmount: Float!, userId: String!): WithdrawRequest
    updateTimings(id: String!, openingTimes: [TimingsInput!]!): Restaurant
    toggleStoreAvailability(restaurantId: String!): Restaurant
    updateRiderLocation(latitude: String!, longitude: String!): User
    updateRiderLicenseDetails(id: String!, licenseDetails: LicenseDetailsInput): User
    updateRiderVehicleDetails(id: String!, vehicleDetails: VehicleDetailsInput): User
    updateRestaurantBussinessDetails(id: String!, bussinessDetails: BussinessDetailsInput): UpdateRestaurantResponse
    updateRestaurantInfo(id: String!, restaurantInput: RestaurantInfoInput!): UpdateRestaurantResponse
    toggleRestaurantPin(restaurantId: String!, isPinned: Boolean!, pinDurationDays: Int): Restaurant
    createCategory(restaurantId: ID!, title: String!, description: String, image: String, order: Int): Category
    updateCategory(id: ID!, title: String, description: String, image: String, order: Int, isActive: Boolean): Category
    deleteCategory(id: ID!): Boolean
    createProduct(restaurantId: ID!, categoryId: ID, productInput: ProductInput!): Product
    updateProduct(id: ID!, productInput: ProductInput!, categoryId: ID): Product
    deleteProduct(id: ID!): Boolean
    bulkUpdateProducts(productIds: [ID!]!, updates: BulkProductUpdateInput!): BulkUpdateResponse
    
    # Rider management mutations (Admin app)
    createRider(riderInput: RiderInput!): User
    editRider(riderInput: RiderInput!): User
    deleteRider(id: String!): User
    toggleAvailablity(id: String!): User
    
    # Admin app mutations
    markWebNotificationsAsRead: [WebNotification]
    updateCommission(id: String!, commissionType: String!, commissionRate: Float!): Restaurant
    updateWithdrawReqStatus(id: ID!, status: String!): UpdateWithdrawRequestResponse
    
    # Wallet mutations
    createRazorpayOrder(amount: Float!): RazorpayOrderResponse
    verifyRazorpayPayment(paymentId: String!, orderId: String!, signature: String!, amount: Float!): WalletTransaction
    # Deprecated: addWalletBalance(amount: Float!, paymentMethod: String!): WalletTransaction
    convertRewardCoinsToWallet(coins: Int!): WalletTransaction
    
    # Subscription mutations
    createSubscription(restaurantId: String!, planType: String!, paymentMethod: String!, frequencyType: String, selectedSlots: [String]): SubscriptionResponse
    updateSubscription(subscriptionId: String!, restaurantId: String): SubscriptionResponse
    cancelSubscription(subscriptionId: String!): SubscriptionResponse
    
    # Menu schedule mutations
    createMenuSchedule(restaurantId: String!, scheduleType: String!, dayOfWeek: String, date: String, mealType: String, menuItems: [MenuScheduleItemInput!]!): MenuSchedule
    updateMenuSchedule(scheduleId: String!, menuItems: [MenuScheduleItemInput!]!): MenuSchedule
    deleteMenuSchedule(scheduleId: String!): Boolean
    
    # Holiday request mutations
    createHolidayRequest(startDate: String!, endDate: String!, reason: String): HolidayRequest
    updateHolidayRequestStatus(requestId: String!, status: String!, rejectionReason: String): HolidayRequest
    
    # Franchise mutations
    createFranchise(franchiseInput: FranchiseInput!): Franchise
    updateFranchise(franchiseId: String!, franchiseInput: FranchiseInput!): Franchise
    deleteFranchise(franchiseId: String!): Boolean
    
    # Notification mutations
    sendNotificationUser(notificationTitle: String, notificationBody: String!): Boolean
    
    # Subscription-Menu Linking mutations
    setSubscriptionPreferences(subscriptionId: ID!, preferences: SubscriptionPreferenceInput!): SubscriptionPreference
    updateMealPreference(subscriptionId: ID!, dayOfWeek: String!, mealType: String!, isEnabled: Boolean!, deliveryTime: String): SubscriptionPreference

    skipSubscriptionDelivery(deliveryId: ID!, reason: String): SubscriptionDelivery
    assignMenuToDelivery(deliveryId: ID!, menuItems: [DeliveryMenuItemInput!]!): SubscriptionDelivery
    generateWeeklyDeliveries(subscriptionId: ID!, weekStart: Date!): [SubscriptionDelivery]
    updateDeliveryStatus(deliveryId: ID!, status: String!, reason: String): SubscriptionDelivery

    # Rider App Mutations
    toggleRiderAvailability: User
    assignSubscriptionDelivery(deliveryId: ID!): SubscriptionDelivery


  }

  type Subscription {
    subscriptionOrder(id: String!): Order
    subscriptionRiderLocation(riderId: String!): User
    orderStatusChanged(userId: String!): OrderStatusUpdate
    subscriptionNewMessage(order: ID!): ChatMessage
    subscriptionZoneOrders(zoneId: String!): ZoneOrderUpdate
  }

  input ReviewInput {
    order: String!
    rating: Float!
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
    referralCode: String
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
    coordinates: JSON
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
    bussinessRegNo: Int
    companyRegNo: Int
    taxRate: Float
  }

  input BussinessDetailsInput {
    bankName: String
    accountNumber: String
    accountName: String
    accountCode: String
    bussinessRegNo: Int
    companyRegNo: Int
    taxRate: Float
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

  input RestaurantInfoInput {
    name: String
    address: String
    phone: String
    email: String
    description: String
    image: String
    logo: String
    deliveryTime: Int
    minimumOrder: Float
    deliveryCharges: Float
    location: [Float]
    isPinned: Boolean
  }

  input CuisineInput {
    _id: ID
    name: String!
    description: String
    image: String
    shopType: String
    isActive: Boolean
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

  input BulkProductUpdateInput {
    isActive: Boolean
    available: Boolean
    isOutOfStock: Boolean
  }

  type BulkUpdateResponse {
    success: Boolean
    message: String
    updatedCount: Int
  }

  type UploadImageResponse {
    imageUrl: String!
  }

  type Product {
    _id: ID
    title: String
    description: String
    image: String
    price: Float
    discountedPrice: Float
    subCategory: String
    isActive: Boolean
    available: Boolean
    isOutOfStock: Boolean
    preparationTime: Int
    variations: [Variation]
    addons: [Addon]
    menuType: String
    restaurant: ID
    createdAt: Date
    updatedAt: Date
  }

  type UpdateRestaurantResponse {
    success: Boolean
    message: String
    data: Restaurant
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

  input MenuScheduleItemInput {
    productId: ID!
    isAvailable: Boolean
    priceOverride: Float
  }

  input FranchiseInput {
    name: String!
    city: String!
    area: String
    workingArea: LocationInput!
    zone: ID
    owner: ID!
    contactPerson: ContactPersonInput
    isActive: Boolean
    startDate: String
    endDate: String
  }

  input ContactPersonInput {
    name: String
    email: String
    phone: String
  }

  # Subscription-Menu Linking Input Types
  input MealPreferenceInput {
    dayOfWeek: String!
    mealType: String
    isEnabled: Boolean!
    deliveryTime: String
  }

  input ProductPreferenceInput {
    productId: ID!
    isPreferred: Boolean!
  }

  input SubscriptionPreferenceInput {
    mealPreferences: [MealPreferenceInput!]
    defaultProductPreferences: [ProductPreferenceInput]
    dietaryRestrictions: [String]
    specialInstructions: String
  }

  input DeliveryMenuItemInput {
    productId: ID!
    title: String!
    quantity: Int!
    price: Float!
  }
`;

module.exports = typeDefs;

