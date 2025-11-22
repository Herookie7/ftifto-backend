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
  }

  type RestaurantPreview {
    _id: ID
    orderId: String
    orderPrefix: String
    name: String
    image: String
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

  type Query {
    # Restaurant queries
    nearByRestaurants(latitude: Float, longitude: Float, shopType: String): RestaurantListResponse
    nearByRestaurantsPreview(latitude: Float, longitude: Float, shopType: String): RestaurantPreviewListResponse
    restaurant(id: String): Restaurant
    topRatedVendors(latitude: Float!, longitude: Float!): [Restaurant]
    topRatedVendorsPreview(latitude: Float!, longitude: Float!): [RestaurantPreview]
    mostOrderedRestaurants: [Restaurant]
    recentOrderRestaurants: [Restaurant]

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
  }

  type Mutation {
    # User mutations
    addFavourite(id: String!): User
    reviewOrder(reviewInput: ReviewInput!): Order
    selectAddress(id: String!): User
    updateUser(updateUserInput: UpdateUserInput!): User
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
`;

module.exports = typeDefs;

