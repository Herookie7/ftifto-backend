const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date
  scalar JSON

  type Location {
    type: String
    coordinates: JSON
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
    # Admin app fields
    unique_restaurant_id: String
    deliveryInfo: DeliveryInfo
    city: String
    postCode: String
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
  }

  input CouponInput {
    _id: ID
    title: String!
    discount: Float!
    enabled: Boolean
    code: String
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
    data: [WithdrawRequest]
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
    usersCount: Int
    vendorsCount: Int
    restaurantsCount: Int
    ridersCount: Int
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
    
    # Admin app queries
    webNotifications(userId: String, pagination: PaginationInput): [WebNotification]
    getDashboardUsers: DashboardUsersResponse
    getDashboardUsersByYear(year: Int): DashboardUsersResponse
    getDashboardOrdersByType(dateFilter: DateFilter): [DashboardOrdersByTypeItem]
    getDashboardSalesByType(dateFilter: DateFilter): [DashboardSalesByTypeItem]
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
    getActiveOrders(restaurantId: ID, page: Int, rowsPerPage: Int, actions: [String], search: String): ActiveOrdersResponse
    ordersByRestId(restaurantId: String!, filters: FiltersInput): [Order]
    ordersByUser(userId: ID!, page: Int, limit: Int): OrdersByUserResponse
    coupons: [Coupon]
    tips: Tipping
    notifications(filters: FiltersInput): [Notification]
    auditLogs(filters: FiltersInput): AuditLogResponse
    withdrawRequests(filters: FiltersInput): WithdrawRequestResponse
    getTicketUsers(filters: FiltersInput): [User]
    getTicketUsersWithLatest(filters: FiltersInput): [User]
    getSingleUserSupportTickets(userId: String!): [SupportTicket]
    getSingleSupportTicket(ticketId: String!): SupportTicket
    getTicketMessages(ticketId: String!): [SupportTicketMessage]
    getClonedRestaurants: [Restaurant]
    getClonedRestaurantsPaginated(filters: FiltersInput): RestaurantPaginatedResponse
    getRestaurantDeliveryZoneInfo(restaurantId: String!): RestaurantDeliveryZoneInfo
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
    restaurantLogin(username: String!, password: String!, notificationToken: String): RestaurantLoginResponse
    ownerLogin(email: String!, password: String!): OwnerLoginResponse
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
    updateOrderStatusRider(id: String!, status: String!): Order

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
    createWithdrawRequest(requestAmount: Float!, userId: String!): WithdrawRequest
    updateTimings(id: String!, openingTimes: [TimingsInput!]!): Restaurant
    toggleStoreAvailability(restaurantId: String!): Restaurant
    updateRiderLocation(latitude: String!, longitude: String!): User
    updateRiderLicenseDetails(id: String!, licenseDetails: LicenseDetailsInput): User
    updateRiderVehicleDetails(id: String!, vehicleDetails: VehicleDetailsInput): User
    updateRestaurantBussinessDetails(id: String!, bussinessDetails: BussinessDetailsInput): UpdateRestaurantResponse
    updateRestaurantInfo(id: String!, restaurantInput: RestaurantInfoInput!): UpdateRestaurantResponse
    createCategory(restaurantId: ID!, title: String!, description: String, image: String, order: Int): Category
    updateCategory(id: ID!, title: String, description: String, image: String, order: Int, isActive: Boolean): Category
    deleteCategory(id: ID!): Boolean
    createProduct(restaurantId: ID!, categoryId: ID, productInput: ProductInput!): Product
    updateProduct(id: ID!, productInput: ProductInput!): Product
    deleteProduct(id: ID!): Boolean
    
    # Rider management mutations (Admin app)
    createRider(riderInput: RiderInput!): User
    editRider(riderInput: RiderInput!): User
    deleteRider(id: String!): User
    toggleAvailablity(id: String!): User
    
    # Admin app mutations
    markWebNotificationsAsRead: [WebNotification]
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
  }

  input BussinessDetailsInput {
    bankName: String
    accountNumber: String
    accountName: String
    accountCode: String
  }

  input RestaurantInfoInput {
    name: String
    address: String
    phone: String
    description: String
    image: String
    logo: String
    deliveryTime: Int
    minimumOrder: Float
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
`;

module.exports = typeDefs;

