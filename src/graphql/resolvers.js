const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Configuration = require('../models/Configuration');
const Cuisine = require('../models/Cuisine');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Section = require('../models/Section');
const Zone = require('../models/Zone');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const { signToken } = require('../utils/token');
const config = require('../config');
const generateOrderId = require('../utils/generateOrderId');
const { emitOrderUpdate } = require('../realtime/emitter');
const auditLogger = require('../services/auditLogger');
const { registerSubscription } = require('./subscriptionBridge');

// JSON Scalar resolver (matching the schema)
const { GraphQLScalarType, Kind } = require('graphql');

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON scalar type for flexible data structures',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        return JSON.parse(ast.value);
      case Kind.OBJECT:
        return ast;
      default:
        return null;
    }
  }
});

const resolvers = {
  JSON: JSONScalar,
  WebNotification: {
    // Map fields for backward compatibility
    body: (parent) => parent.body || parent.message || '',
    read: (parent) => parent.read !== undefined ? parent.read : parent.isRead || false,
    navigateTo: (parent) => {
      // Derive navigateTo from type and related IDs
      if (parent.navigateTo) return parent.navigateTo;
      if (parent.type === 'order' && parent.orderId) return `/orders/${parent.orderId}`;
      if (parent.type === 'restaurant' && parent.restaurantId) return `/restaurants/${parent.restaurantId}`;
      return null;
    }
  },
  Order: {
    // Resolve zone from restaurant or by zone string/id
    async zone(parent) {
      if (parent.zone) {
        // If zone is already populated, return it
        if (typeof parent.zone === 'object') return parent.zone;
        // If zone is a string ID, look it up
        if (typeof parent.zone === 'string') {
          return await Zone.findById(parent.zone).lean();
        }
      }
      // Try to get zone from restaurant
      if (parent.restaurant) {
        const restaurant = typeof parent.restaurant === 'object' 
          ? parent.restaurant 
          : await Restaurant.findById(parent.restaurant).populate('zone').lean();
        if (restaurant?.zone) {
          return typeof restaurant.zone === 'object' ? restaurant.zone : await Zone.findById(restaurant.zone).lean();
        }
      }
      return null;
    }
  },
  Query: {
    // Nearby restaurants with full details
    async nearByRestaurants(_, { latitude, longitude, shopType }) {
      const query = { isActive: true, isAvailable: true };
      if (shopType) {
        query.shopType = shopType;
      }

      let restaurants = await Restaurant.find(query)
        .populate('owner')
        .populate({
          path: 'categories',
          populate: {
            path: 'foods',
            model: 'Product'
          }
        })
        .populate('zone')
        .lean();

      // Filter by distance if coordinates provided
      if (latitude && longitude) {
        restaurants = restaurants.filter((r) => {
          if (!r.location?.coordinates || r.location.coordinates.length < 2) return false;
          const distance = calculateDistance(
            latitude,
            longitude,
            r.location.coordinates[1],
            r.location.coordinates[0]
          );
          return distance <= 50; // 50km radius
        });
      }

      // Get review data for each restaurant
      for (const restaurant of restaurants) {
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true })
          .populate('order')
          .populate('user')
          .lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewData = {
          reviews: reviews.slice(0, 10),
          ratings: reviews.length > 0 ? ratings / reviews.length : 0,
          total: reviews.length
        };
      }

      const offers = await Offer.find({ isActive: true }).lean();
      const sections = await Section.find({ isActive: true }).lean();

      return {
        offers: offers.map((o) => ({
          _id: o._id,
          name: o.name,
          tag: o.tag,
          restaurants: o.restaurants.map((r) => r.toString())
        })),
        sections: sections.map((s) => ({
          _id: s._id,
          name: s.name,
          restaurants: s.restaurants.map((r) => r.toString())
        })),
        restaurants
      };
    },

    // Nearby restaurants preview (lightweight)
    async nearByRestaurantsPreview(_, { latitude, longitude, shopType }) {
      const query = { isActive: true, isAvailable: true };
      if (shopType) {
        query.shopType = shopType;
      }

      let restaurants = await Restaurant.find(query).lean();

      // Filter by distance if coordinates provided
      if (latitude && longitude) {
        restaurants = restaurants.filter((r) => {
          if (!r.location?.coordinates || r.location.coordinates.length < 2) return false;
          const distance = calculateDistance(
            latitude,
            longitude,
            r.location.coordinates[1],
            r.location.coordinates[0]
          );
          return distance <= 50; // 50km radius
        });
      }

      // Get review data
      for (const restaurant of restaurants) {
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true }).lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewCount = reviews.length;
        restaurant.reviewAverage = reviews.length > 0 ? ratings / reviews.length : 0;
      }

      const offers = await Offer.find({ isActive: true }).lean();
      const sections = await Section.find({ isActive: true }).lean();

      return {
        offers: offers.map((o) => ({
          _id: o._id,
          name: o.name,
          tag: o.tag,
          restaurants: o.restaurants.map((r) => r.toString())
        })),
        sections: sections.map((s) => ({
          _id: s._id,
          name: s.name,
          restaurants: s.restaurants.map((r) => r.toString())
        })),
        restaurants: restaurants.map((r) => ({
          ...r,
          distanceWithCurrentLocation: latitude && longitude && r.location?.coordinates
            ? calculateDistance(
                latitude,
                longitude,
                r.location.coordinates[1],
                r.location.coordinates[0]
              )
            : null,
          freeDelivery: r.minimumOrder === 0,
          acceptVouchers: true
        }))
      };
    },

    // Single restaurant by ID
    async restaurant(_, { id }) {
      if (!id) {
        console.error('Restaurant query called without id parameter');
        return null;
      }

      try {
        const restaurant = await Restaurant.findById(id)
          .populate('owner')
          .populate({
            path: 'categories',
            populate: {
              path: 'foods',
              model: 'Product'
            }
          })
          .populate('zone')
          .lean();

        if (!restaurant) {
          console.warn(`Restaurant not found with id: ${id}`);
          return null;
        }

        // Get review data
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true })
          .populate('order')
          .populate('user')
          .lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewData = {
          reviews: reviews.slice(0, 10),
          ratings: reviews.length > 0 ? ratings / reviews.length : 0,
          total: reviews.length
        };
        restaurant.reviewCount = reviews.length;

        return restaurant;
      } catch (error) {
        console.error(`Error fetching restaurant with id ${id}:`, error);
        throw error;
      }
    },

    // Top rated vendors
    // eslint-disable-next-line no-unused-vars
    async topRatedVendors(_, { latitude, longitude }) {
      const restaurants = await Restaurant.find({ isActive: true, isAvailable: true })
        .populate('owner')
        .populate({
          path: 'categories',
          populate: {
            path: 'foods',
            model: 'Product'
          }
        })
        .lean()
        .sort({ rating: -1 })
        .limit(10);

      // Add review data
      for (const restaurant of restaurants) {
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true })
          .populate('order')
          .populate('user')
          .lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewData = {
          reviews: reviews.slice(0, 5),
          ratings: reviews.length > 0 ? ratings / reviews.length : 0,
          total: reviews.length
        };
      }

      return restaurants;
    },

    // Top rated vendors preview
    async topRatedVendorsPreview(_, { latitude, longitude }) {
      const restaurants = await Restaurant.find({ isActive: true, isAvailable: true })
        .lean()
        .sort({ rating: -1 })
        .limit(10);

      // Add review data
      for (const restaurant of restaurants) {
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true }).lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewCount = reviews.length;
        restaurant.reviewAverage = reviews.length > 0 ? ratings / reviews.length : 0;
        restaurant.reviewData = {
          reviews: reviews.slice(0, 5).map((r) => ({ _id: r._id, rating: r.rating })),
          ratings: reviews.length > 0 ? ratings / reviews.length : 0,
          total: reviews.length
        };
      }

      return restaurants.map((r) => ({
        ...r,
        distanceWithCurrentLocation: latitude && longitude && r.location?.coordinates
          ? calculateDistance(
              latitude,
              longitude,
              r.location.coordinates[1],
              r.location.coordinates[0]
            )
          : null,
        freeDelivery: r.minimumOrder === 0,
        acceptVouchers: true
      }));
    },

    // Most ordered restaurants
    async mostOrderedRestaurants() {
      const orders = await Order.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$restaurant', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const restaurantIds = orders.map((o) => o._id);
      const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
        .populate('owner')
        .populate({
          path: 'categories',
          populate: {
            path: 'foods',
            model: 'Product'
          }
        })
        .lean();

      return restaurants;
    },

    // Most ordered restaurants preview
    async mostOrderedRestaurantsPreview(_, { latitude, longitude }) {
      const orders = await Order.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$restaurant', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const restaurantIds = orders.map((o) => o._id);
      const restaurants = await Restaurant.find({ _id: { $in: restaurantIds }, isActive: true, isAvailable: true })
        .lean();

      // Add review data
      for (const restaurant of restaurants) {
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true }).lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewCount = reviews.length;
        restaurant.reviewAverage = reviews.length > 0 ? ratings / reviews.length : 0;
      }

      return restaurants.map((r) => ({
        ...r,
        distanceWithCurrentLocation: latitude && longitude && r.location?.coordinates
          ? calculateDistance(
              latitude,
              longitude,
              r.location.coordinates[1],
              r.location.coordinates[0]
            )
          : null,
        freeDelivery: r.minimumOrder === 0,
        acceptVouchers: true
      }));
    },

    // Recent order restaurants - filtered by authenticated user
    async recentOrderRestaurants(_, __, context) {
      if (!context.user) {
        return [];
      }

      // Get user's recent orders
      const recentOrders = await Order.find({ 
        customer: context.user._id, 
        isActive: true 
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('restaurant')
        .lean();

      const restaurantIds = [...new Set(recentOrders.map(o => o.restaurant?.toString()).filter(Boolean))];
      
      if (restaurantIds.length === 0) {
        return [];
      }

      const restaurants = await Restaurant.find({ 
        _id: { $in: restaurantIds }, 
        isActive: true, 
        isAvailable: true 
      })
        .populate('owner')
        .populate({
          path: 'categories',
          populate: {
            path: 'foods',
            model: 'Product'
          }
        })
        .lean();

      return restaurants;
    },

    // Recent order restaurants preview - filtered by authenticated user
    async recentOrderRestaurantsPreview(_, { latitude, longitude }, context) {
      if (!context.user) {
        return [];
      }

      // Get user's recent orders
      const recentOrders = await Order.find({ 
        customer: context.user._id, 
        isActive: true 
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('restaurant')
        .lean();

      const restaurantIds = [...new Set(recentOrders.map(o => o.restaurant?.toString()).filter(Boolean))];
      
      if (restaurantIds.length === 0) {
        return [];
      }

      const restaurants = await Restaurant.find({ 
        _id: { $in: restaurantIds }, 
        isActive: true, 
        isAvailable: true 
      })
        .lean();

      // Add review data
      for (const restaurant of restaurants) {
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true }).lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewCount = reviews.length;
        restaurant.reviewAverage = reviews.length > 0 ? ratings / reviews.length : 0;
      }

      return restaurants.map((r) => ({
        ...r,
        distanceWithCurrentLocation: latitude && longitude && r.location?.coordinates
          ? calculateDistance(
              latitude,
              longitude,
              r.location.coordinates[1],
              r.location.coordinates[0]
            )
          : null,
        freeDelivery: r.minimumOrder === 0,
        acceptVouchers: true
      }));
    },

    // Popular food items for a restaurant
    async popularFoodItems(_, { restaurantId }) {
      const orders = await Order.aggregate([
        { $match: { restaurant: restaurantId, isActive: true } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const productIds = orders.map((o) => o._id);
      const products = await Product.find({ _id: { $in: productIds } }).lean();

      return products.map((p) => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        image: p.image,
        subCategory: p.subCategory,
        isOutOfStock: p.isOutOfStock || !p.available,
        variations: p.variations || [],
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
    },

    // Category details by store
    async fetchCategoryDetailsByStoreIdForMobile(_, { storeId }) {
      const categories = await Category.find({ restaurant: storeId, isActive: true })
        .populate({
          path: 'foods',
          model: 'Product',
          match: { isActive: true, available: true }
        })
        .lean()
        .sort({ order: 1 });

      // Return in format expected by frontend
      return categories.map((cat) => ({
        id: cat._id.toString(),
        category_name: cat.title,
        url: cat.image || null,
        food_id: (cat.foods || []).map((f) => f._id.toString()),
        // Also include standard format for compatibility
        _id: cat._id,
        title: cat.title,
        foods: (cat.foods || []).map((food) => ({
          _id: food._id,
          title: food.title,
          image: food.image,
          subCategory: food.subCategory,
          description: food.description,
          isOutOfStock: food.isOutOfStock || !food.available,
          variations: food.variations || [],
          isActive: food.isActive,
          createdAt: food.createdAt,
          updatedAt: food.updatedAt
        })),
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      }));
    },

    // Configuration
    async configuration() {
      const config = await Configuration.getConfiguration();
      return config;
    },

    // Cuisines
    async cuisines() {
      return await Cuisine.find({ isActive: true }).lean();
    },

    // My orders - filtered by authenticated user
    async myOrders(_, __, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      return await Order.find({ customer: context.user._id, isActive: true })
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean()
        .sort({ createdAt: -1 })
        .limit(50);
    },

    // Reviews by restaurant
    async reviews() {
      return await Review.find({ isActive: true })
        .populate('order')
        .populate('user')
        .populate('restaurant')
        .sort({ createdAt: -1 })
        .lean();
    },

    async reviewsByRestaurant(_, { restaurant }) {
      const reviews = await Review.find({ restaurant, isActive: true })
        .populate('order')
        .populate('user')
        .lean()
        .sort({ createdAt: -1 });

      const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);

      return {
        reviews,
        ratings: reviews.length > 0 ? ratings / reviews.length : 0,
        total: reviews.length
      };
    },

    // Taxes
    async taxes() {
      // Return default tax configuration
      return [
        {
          _id: 'default',
          taxationCharges: 0.1, // 10%
          enabled: true
        }
      ];
    },

    // Users (for testing)
    async users() {
      return await User.find().lean();
    },

    async user(_, { id }) {
      const user = await User.findById(id).lean();
      if (!user) {
        throw new Error('User not found');
      }
      // Map addressBook to addresses for GraphQL
      return {
        ...user,
        addresses: (user.addressBook || []).map(addr => ({
          _id: addr._id,
          deliveryAddress: addr.deliveryAddress,
          details: addr.details,
          label: addr.label,
          selected: addr.selected || false,
          location: addr.location || null
        })),
        favourite: (user.favourite || []).map(fav => fav._id?.toString() || fav.toString())
      };
    },

    // Rider by ID
    async rider(_, { id }) {
      const rider = await User.findById(id).lean();
      if (!rider || rider.role !== 'rider') return null;
      return {
        _id: rider._id,
        location: rider.riderProfile?.location || { type: 'Point', coordinates: [0, 0] }
      };
    },

    // Orders with pagination
    async orders(_, { offset = 0 }) {
      return await Order.find({ isActive: true })
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(20);
    },

    // Single order by ID
    async order(_, { id }) {
      return await Order.findById(id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    // User favourite restaurants - filtered by authenticated user
    // eslint-disable-next-line no-unused-vars
    async userFavourite(_, { latitude, longitude }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user || !user.favourite || user.favourite.length === 0) {
        return [];
      }

      const favouriteIds = user.favourite.map((id) => id.toString());
      let restaurants = await Restaurant.find({ _id: { $in: favouriteIds }, isActive: true, isAvailable: true })
        .populate({
          path: 'categories',
          populate: {
            path: 'foods',
            model: 'Product'
          }
        })
        .lean();

      // Add review data
      for (const restaurant of restaurants) {
        const reviews = await Review.find({ restaurant: restaurant._id, isActive: true }).lean();
        const ratings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        restaurant.reviewCount = reviews.length;
        restaurant.reviewAverage = reviews.length > 0 ? ratings / reviews.length : 0;
      }

      return restaurants;
    },

    // Zones query
    async zones() {
      try {
        const zones = await Zone.find({ isActive: true }).lean();
        console.log(`Zones resolver: Found ${zones.length} active zones`);
        return zones;
      } catch (error) {
        console.error('Zones resolver error:', error);
        throw new Error(`Failed to fetch zones: ${error.message}`);
      }
    },

    // Banners query
    async banners() {
      return await Banner.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .lean();
    },

    // Get app versions
    async getVersions() {
      const config = await Configuration.getConfiguration();
      
      // Parse customerAppVersion if it's a JSON string, otherwise create default structure
      let customerAppVersion = { android: null, ios: null };
      
      if (config.customerAppVersion) {
        try {
          // Try to parse as JSON if it's a string
          if (typeof config.customerAppVersion === 'string') {
            const parsed = JSON.parse(config.customerAppVersion);
            if (parsed.android || parsed.ios) {
              customerAppVersion = parsed;
            } else {
              // If it's just a version string, use it for both platforms
              customerAppVersion = {
                android: config.customerAppVersion,
                ios: config.customerAppVersion
              };
            }
          } else if (typeof config.customerAppVersion === 'object') {
            customerAppVersion = config.customerAppVersion;
          }
        } catch (e) {
          // If parsing fails, treat as single version string
          customerAppVersion = {
            android: config.customerAppVersion,
            ios: config.customerAppVersion
          };
        }
      }
      
      return {
        customerAppVersion,
        riderAppVersion: null, // Add if needed
        restaurantAppVersion: null // Add if needed
      };
    },

    // SubCategories - extract unique subcategories from Categories
    async subCategories() {
      try {
        // Get all categories with subCategory field
        const categories = await Category.find({ 
          isActive: true,
          subCategory: { $exists: true, $ne: null, $ne: '' }
        }).lean();

        // Create a map of unique subcategories
        const subCategoryMap = new Map();
        
        categories.forEach((category) => {
          if (category.subCategory) {
            const key = `${category._id}_${category.subCategory}`;
            if (!subCategoryMap.has(key)) {
              subCategoryMap.set(key, {
                _id: `${category._id}_${category.subCategory}`,
                title: category.subCategory,
                parentCategoryId: category._id.toString()
              });
            }
          }
        });

        return Array.from(subCategoryMap.values());
      } catch (error) {
        console.error('Error fetching subCategories:', error);
        return [];
      }
    },

    // SubCategories by parent category ID
    async subCategoriesByParentId(_, { parentCategoryId }) {
      try {
        const category = await Category.findById(parentCategoryId).lean();
        if (!category || !category.subCategory) {
          return [];
        }

        // Find all categories with the same subCategory value under this parent
        const subCategories = await Category.find({
          _id: parentCategoryId,
          isActive: true,
          subCategory: { $exists: true, $ne: null, $ne: '' }
        }).lean();

        return subCategories
          .filter(cat => cat.subCategory)
          .map(cat => ({
            _id: `${cat._id}_${cat.subCategory}`,
            title: cat.subCategory,
            parentCategoryId: cat._id.toString()
          }));
      } catch (error) {
        console.error('Error fetching subCategoriesByParentId:', error);
        return [];
      }
    },

    // Profile query - get current authenticated user
    async profile(_, __, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id)
        .populate('favourite')
        .lean();

      if (!user) {
        throw new Error('User not found');
      }

      // Map addressBook to addresses for GraphQL
      return {
        ...user,
        addresses: (user.addressBook || []).map(addr => ({
          _id: addr._id,
          deliveryAddress: addr.deliveryAddress,
          details: addr.details,
          label: addr.label,
          selected: addr.selected || false,
          location: addr.location || null
        })),
        favourite: (user.favourite || []).map(fav => fav._id?.toString() || fav.toString())
      };
    },

    // Get country by ISO code - placeholder implementation
    async getCountryByIso(_, { iso }) {
      // This is a placeholder - implement actual country/city lookup if needed
      // For now, return empty cities array
      return {
        cities: []
      };
    },

    // Seller/Restaurant queries
    async restaurantOrders(_, __, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Get restaurant owned by the authenticated user
      const restaurant = await Restaurant.findOne({ owner: context.user._id }).lean();
      if (!restaurant) {
        return [];
      }

      // Get all orders for this restaurant
      const orders = await Order.find({ restaurant: restaurant._id, isActive: true })
        .populate('customer', 'name phone email')
        .populate('rider', 'name username available')
        .populate('restaurant', 'name image address location')
        .sort({ createdAt: -1 })
        .lean();

      return orders.map(order => ({
        ...order,
        id: order._id.toString(),
        user: order.customer,
        items: (order.items || []).map(item => ({
          ...item,
          id: item._id?.toString() || item._id,
          food: item.product?.toString() || item.food
        }))
      }));
    },

    async lastOrderCreds(_, __, context) {
      // Get the most recent order to retrieve restaurant credentials
      const lastOrder = await Order.findOne({ isActive: true })
        .populate('restaurant', 'username password')
        .sort({ createdAt: -1 })
        .lean();

      if (!lastOrder || !lastOrder.restaurant) {
        return {
          restaurantUsername: '',
          restaurantPassword: ''
        };
      }

      return {
        restaurantUsername: lastOrder.restaurant.username || '',
        restaurantPassword: lastOrder.restaurant.password || ''
      };
    },

    async earnings(_, { userType, userId, orderType, paymentMethod, pagination, dateFilter, search }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Get restaurant owned by the authenticated user
      const restaurant = await Restaurant.findOne({ owner: context.user._id }).lean();
      if (!restaurant) {
        return {
          data: {
            grandTotalEarnings: { storeTotal: 0, platformTotal: 0, riderTotal: 0 },
            earnings: []
          },
          message: 'No restaurant found',
          success: false,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        };
      }

      // Build query for orders
      const orderQuery = { restaurant: restaurant._id, isActive: true };
      
      if (orderType) {
        orderQuery.isPickedUp = orderType === 'PICKUP';
      }
      
      if (paymentMethod) {
        orderQuery.paymentMethod = paymentMethod.toLowerCase();
      }

      if (search) {
        orderQuery.$or = [
          { orderId: { $regex: search, $options: 'i' } }
        ];
      }

      if (dateFilter?.startDate || dateFilter?.endDate || dateFilter?.starting_date || dateFilter?.ending_date) {
        orderQuery.createdAt = {};
        const startDate = dateFilter.startDate || dateFilter.starting_date;
        const endDate = dateFilter.endDate || dateFilter.ending_date;
        if (startDate) orderQuery.createdAt.$gte = new Date(startDate);
        if (endDate) orderQuery.createdAt.$lte = new Date(endDate);
      }

      const page = pagination?.page || pagination?.pageNo || 1;
      const limit = pagination?.limit || pagination?.pageSize || 10;
      const skip = (page - 1) * limit;

      const orders = await Order.find(orderQuery)
        .populate('rider')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Order.countDocuments(orderQuery);
      
      // Helper function to calculate commission based on type
      const calculateCommission = (orderAmount, commissionRate, commissionType) => {
        if (!commissionRate || commissionRate === 0) return 0;
        if (commissionType === 'fixed') {
          return commissionRate;
        } else {
          // percentage (default for backward compatibility)
          return (orderAmount * commissionRate) / 100;
        }
      };

      const commissionType = restaurant.commissionType || 'percentage';
      
      // Calculate earnings
      const totalEarnings = orders.reduce((sum, order) => {
        const commission = calculateCommission(order.orderAmount, restaurant.commissionRate || 0, commissionType);
        return sum + (order.orderAmount - commission);
      }, 0);

      const platformTotal = orders.reduce((sum, order) => {
        const commission = calculateCommission(order.orderAmount, restaurant.commissionRate || 0, commissionType);
        return sum + commission;
      }, 0);

      const riderTotal = orders.reduce((sum, order) => {
        return sum + (order.deliveryCharges || 0) + (order.tipping || 0);
      }, 0);

      const earnings = orders.map(order => {
        const commission = calculateCommission(order.orderAmount, restaurant.commissionRate || 0, commissionType);
        const storeEarnings = order.orderAmount - commission;
        const riderEarnings = (order.deliveryCharges || 0) + (order.tipping || 0);

        return {
          _id: order._id.toString(),
          orderId: order.orderId || '',
          orderType: order.isPickedUp ? 'PICKUP' : 'DELIVERY',
          paymentMethod: order.paymentMethod?.toUpperCase() || 'CASH',
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          platformEarnings: {
            marketplaceCommission: commission,
            deliveryCommission: 0,
            tax: order.taxationAmount || 0,
            platformFee: 0,
            totalEarnings: commission
          },
          riderEarnings: {
            riderId: order.rider?._id?.toString() || null,
            deliveryFee: order.deliveryCharges || 0,
            tip: order.tipping || 0,
            totalEarnings: riderEarnings,
            rider: order.rider || null
          },
          storeEarnings: {
            totalEarnings: storeEarnings,
            storeId: restaurant._id.toString(),
            orderAmount: order.orderAmount,
            store: restaurant
          }
        };
      });

      return {
        data: {
          grandTotalEarnings: {
            storeTotal: totalEarnings,
            platformTotal,
            riderTotal
          },
          earnings
        },
        message: 'Success',
        success: true,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    },

    async transactionHistory(_, { userType, userId, search, pagination, dateFilter }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Get restaurant owned by the authenticated user
      const restaurant = await Restaurant.findOne({ owner: context.user._id }).lean();
      if (!restaurant) {
        return { 
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        };
      }

      // Build query
      const query = { 
        restaurant: restaurant._id, 
        isActive: true,
        paymentStatus: 'paid'
      };

      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: 'i' } }
        ];
      }

      if (dateFilter?.startDate || dateFilter?.endDate || dateFilter?.starting_date || dateFilter?.ending_date) {
        query.createdAt = {};
        const startDate = dateFilter.startDate || dateFilter.starting_date;
        const endDate = dateFilter.endDate || dateFilter.ending_date;
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const page = pagination?.page || pagination?.pageNo || 1;
      const limit = pagination?.limit || pagination?.pageSize || 10;
      const skip = (page - 1) * limit;

      // Get orders with payment status
      const orders = await Order.find(query)
        .populate('rider')
        .populate('restaurant')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Order.countDocuments(query);

      return {
        data: orders.map(order => ({
          _id: order._id.toString(),
          status: order.paymentStatus || 'paid',
          amountTransferred: order.orderAmount,
          amountCurrency: 'INR', // Default currency
          transactionId: order.orderId || order._id.toString(),
          userType: 'SELLER',
          userId: context.user._id.toString(),
          toBank: restaurant.bussinessDetails ? {
            bankName: restaurant.bussinessDetails.bankName || '',
            accountNumber: restaurant.bussinessDetails.accountNumber || '',
            accountName: restaurant.bussinessDetails.accountName || '',
            accountCode: restaurant.bussinessDetails.accountCode || ''
          } : null,
          rider: order.rider || null,
          store: order.restaurant || null,
          createdAt: order.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    },

    async restaurantCategories(_, { restaurantId }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: restaurantId,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or access denied');
      }

      const categories = await Category.find({ restaurant: restaurantId })
        .populate('foods')
        .sort({ order: 1 })
        .lean();

      return categories;
    },

    async storeCurrentWithdrawRequest(_, { storeId }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Get restaurant
      const restaurant = await Restaurant.findOne({ 
        _id: storeId || undefined,
        owner: context.user._id 
      }).lean();

      if (!restaurant) {
        return null;
      }

      // Placeholder - implement actual withdraw request model if exists
      // For now, return null as withdraw requests may not be implemented yet
      return null;
    },

    // Rider queries
    async riderOrders(_, __, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (context.user.role !== 'rider') {
        throw new Error('Only riders can access rider orders');
      }

      // Get orders assigned to this rider or available for assignment
      const orders = await Order.find({
        $or: [
          { rider: context.user._id },
          { orderStatus: 'accepted', rider: null }
        ],
        isActive: true
      })
        .populate('restaurant', '_id name image address location')
        .populate('customer', '_id name phone')
        .populate('rider', '_id name username')
        .sort({ createdAt: -1 })
        .lean();

      return orders;
    },

    async riderEarningsGraph(_, { riderId, page = 1, limit = 10, startDate, endDate }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Verify rider access
      if (context.user.role !== 'rider' || context.user._id.toString() !== riderId) {
        throw new Error('Access denied');
      }

      // Build query
      const orderQuery = { rider: riderId, isActive: true, orderStatus: 'delivered' };
      if (startDate || endDate) {
        orderQuery.deliveredAt = {};
        if (startDate) orderQuery.deliveredAt.$gte = new Date(startDate);
        if (endDate) orderQuery.deliveredAt.$lte = new Date(endDate);
      }

      const orders = await Order.find(orderQuery)
        .sort({ deliveredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const totalCount = await Order.countDocuments(orderQuery);

      // Group by date and calculate earnings
      const earningsByDate = {};
      orders.forEach(order => {
        const date = order.deliveredAt ? new Date(order.deliveredAt).toISOString().split('T')[0] : new Date(order.createdAt).toISOString().split('T')[0];
        if (!earningsByDate[date]) {
          earningsByDate[date] = {
            totalEarningsSum: 0,
            totalTipsSum: 0,
            totalDeliveries: 0,
            totalHours: 0,
            earningsArray: []
          };
        }
        const deliveryFee = order.deliveryCharges || 0;
        const tip = order.tipping || 0;
        const totalEarnings = deliveryFee + tip;
        
        earningsByDate[date].totalEarningsSum += totalEarnings;
        earningsByDate[date].totalTipsSum += tip;
        earningsByDate[date].totalDeliveries += 1;
        earningsByDate[date].earningsArray.push({
          tip,
          deliveryFee,
          totalEarnings,
          date,
          orderDetails: {
            orderType: order.isPickedUp ? 'PICKUP' : 'DELIVERY',
            orderId: order.orderId || '',
            paymentMethod: order.paymentMethod?.toUpperCase() || 'CASH'
          }
        });
      });

      // Convert to array format
      const earnings = Object.keys(earningsByDate).map(date => ({
        _id: date,
        date,
        totalEarningsSum: earningsByDate[date].totalEarningsSum,
        totalTipsSum: earningsByDate[date].totalTipsSum,
        totalDeliveries: earningsByDate[date].totalDeliveries,
        totalHours: earningsByDate[date].totalHours,
        earningsArray: earningsByDate[date].earningsArray
      }));

      return {
        totalCount,
        earnings
      };
    },

    async riderCurrentWithdrawRequest(_, { riderId }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Verify rider access
      if (context.user.role !== 'rider' || context.user._id.toString() !== riderId) {
        throw new Error('Access denied');
      }

      // Placeholder - implement actual withdraw request model if exists
      // For now, return null as withdraw requests may not be implemented yet
      return null;
    },

    async storeEarningsGraph(_, { storeId, page = 1, limit = 10, startDate, endDate }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Get restaurant
      const restaurant = await Restaurant.findOne({ 
        _id: storeId,
        owner: context.user._id 
      }).lean();

      if (!restaurant) {
        return {
          totalCount: 0,
          earnings: []
        };
      }

      // Build query
      const orderQuery = { restaurant: restaurant._id, isActive: true };
      if (startDate || endDate) {
        orderQuery.createdAt = {};
        if (startDate) orderQuery.createdAt.$gte = new Date(startDate);
        if (endDate) orderQuery.createdAt.$lte = new Date(endDate);
      }

      const orders = await Order.find(orderQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Group by date and calculate earnings
      const earningsByDate = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        if (!earningsByDate[date]) {
          earningsByDate[date] = {
            totalOrderAmount: 0,
            totalEarnings: 0,
            orders: []
          };
        }
        const commission = (order.orderAmount * (restaurant.commissionRate || 0)) / 100;
        earningsByDate[date].totalOrderAmount += order.orderAmount;
        earningsByDate[date].totalEarnings += (order.orderAmount - commission);
        earningsByDate[date].orders.push(order);
      });

      const earnings = Object.entries(earningsByDate).map(([date, data]) => ({
        _id: date,
        totalEarningsSum: data.totalEarnings,
        earningsArray: [{
          totalOrderAmount: data.totalOrderAmount,
          totalEarnings: data.totalEarnings,
          orderDetails: {
            orderId: data.orders[0]?.orderId || '',
            orderType: data.orders[0]?.isPickedUp ? 'PICKUP' : 'DELIVERY',
            paymentMethod: data.orders[0]?.paymentMethod || 'CASH'
          },
          date: date
        }]
      }));

      return {
        totalCount: earnings.length,
        earnings
      };
    },

    async chat(_, { order }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Verify user has access to this order
      const orderDoc = await Order.findById(order).lean();
      if (!orderDoc) {
        throw new Error('Order not found');
      }

      // Check if user is restaurant owner, customer, or rider
      const restaurant = await Restaurant.findById(orderDoc.restaurant).lean();
      const isRestaurantOwner = restaurant?.owner?.toString() === context.user._id.toString();
      const isCustomer = orderDoc.customer?.toString() === context.user._id.toString();
      const isRider = orderDoc.rider?.toString() === context.user._id.toString();

      if (!isRestaurantOwner && !isCustomer && !isRider) {
        throw new Error('Access denied');
      }

      // Placeholder - return empty array for now
      // In production, implement actual chat message storage
      return [];
    },

    // Admin app queries
    async webNotifications(_, { userId, pagination }, context) {
      // Placeholder - implement notification model if exists
      // For now, return empty array with proper structure
      // When Notification model is implemented, map fields:
      // message -> body, isRead -> read, add navigateTo based on type
      const targetUserId = userId || context?.user?._id?.toString();
      if (!targetUserId) {
        return [];
      }
      
      // Placeholder: return empty array
      // TODO: Implement with actual Notification model
      // Example structure:
      // return notifications.map(n => ({
      //   ...n,
      //   body: n.message,
      //   read: n.isRead,
      //   navigateTo: n.type === 'order' ? `/orders/${n.orderId}` : null
      // }));
      return [];
    },

    async getDashboardUsers() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Count by role
      const usersCount = await User.countDocuments({ role: 'customer' });
      const vendorsCount = await User.countDocuments({ role: 'seller' });
      const restaurantsCount = await Restaurant.countDocuments({ isActive: true });
      const ridersCount = await User.countDocuments({ role: 'rider' });

      // Legacy fields for backward compatibility
      const total = await User.countDocuments();
      const active = await User.countDocuments({ isActive: true });
      const inactive = await User.countDocuments({ isActive: false });
      const newToday = await User.countDocuments({ createdAt: { $gte: today } });
      const newThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
      const newThisMonth = await User.countDocuments({ createdAt: { $gte: monthAgo } });

      return {
        usersCount,
        vendorsCount,
        restaurantsCount,
        ridersCount,
        total,
        active,
        inactive,
        newToday,
        newThisWeek,
        newThisMonth
      };
    },

    async getDashboardUsersByYear(_, { year }) {
      const targetYear = year || new Date().getFullYear();
      const usersCount = [];
      const vendorsCount = [];
      const restaurantsCount = [];
      const ridersCount = [];

      // Aggregate by month for the year
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(targetYear, month, 1);
        const monthEnd = new Date(targetYear, month + 1, 0, 23, 59, 59);

        usersCount.push(await User.countDocuments({ 
          role: 'customer', 
          createdAt: { $gte: monthStart, $lte: monthEnd } 
        }));
        vendorsCount.push(await User.countDocuments({ 
          role: 'seller', 
          createdAt: { $gte: monthStart, $lte: monthEnd } 
        }));
        restaurantsCount.push(await Restaurant.countDocuments({ 
          isActive: true, 
          createdAt: { $gte: monthStart, $lte: monthEnd } 
        }));
        ridersCount.push(await User.countDocuments({ 
          role: 'rider', 
          createdAt: { $gte: monthStart, $lte: monthEnd } 
        }));
      }

      // Legacy fields for backward compatibility
      const startDate = new Date(targetYear, 0, 1);
      const endDate = new Date(targetYear, 11, 31, 23, 59, 59);
      const total = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
      const active = await User.countDocuments({ isActive: true, createdAt: { $gte: startDate, $lte: endDate } });
      const inactive = await User.countDocuments({ isActive: false, createdAt: { $gte: startDate, $lte: endDate } });
      const newToday = 0;
      const newThisWeek = 0;
      const newThisMonth = 0;

      return {
        usersCount,
        vendorsCount,
        restaurantsCount,
        ridersCount,
        total,
        active,
        inactive,
        newToday,
        newThisWeek,
        newThisMonth
      };
    },

    async getDashboardOrdersByType(_, { dateFilter }) {
      const query = { isActive: true };
      if (dateFilter?.startDate || dateFilter?.endDate || dateFilter?.starting_date || dateFilter?.ending_date) {
        query.createdAt = {};
        const startDate = dateFilter.startDate || dateFilter.starting_date;
        const endDate = dateFilter.endDate || dateFilter.ending_date;
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const delivery = await Order.countDocuments({ ...query, isPickedUp: false });
      const pickup = await Order.countDocuments({ ...query, isPickedUp: true });
      const total = await Order.countDocuments(query);

      // Return array format for frontend
      return [
        { label: 'Delivery', value: delivery },
        { label: 'Pickup', value: pickup },
        { label: 'Total', value: total }
      ];
    },

    async getDashboardSalesByType(_, { dateFilter }) {
      const query = { isActive: true, paymentStatus: 'paid' };
      if (dateFilter?.startDate || dateFilter?.endDate || dateFilter?.starting_date || dateFilter?.ending_date) {
        query.createdAt = {};
        const startDate = dateFilter.startDate || dateFilter.starting_date;
        const endDate = dateFilter.endDate || dateFilter.ending_date;
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const deliveryOrders = await Order.find({ ...query, isPickedUp: false }).lean();
      const pickupOrders = await Order.find({ ...query, isPickedUp: true }).lean();

      const delivery = deliveryOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0);
      const pickup = pickupOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0);
      const total = delivery + pickup;

      // Return array format for frontend
      return [
        { label: 'Delivery', value: delivery },
        { label: 'Pickup', value: pickup },
        { label: 'Total', value: total }
      ];
    },

    async getRestaurantDashboardOrdersSalesStats(_, { restaurant, starting_date, ending_date, dateKeyword }) {
      const query = { restaurant, isActive: true };
      
      if (starting_date && ending_date) {
        query.createdAt = {
          $gte: new Date(starting_date),
          $lte: new Date(ending_date)
        };
      } else if (dateKeyword) {
        const now = new Date();
        let startDate, endDate;
        
        switch (dateKeyword) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            endDate = new Date();
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            endDate = new Date();
            break;
          default:
            startDate = null;
            endDate = null;
        }
        
        if (startDate && endDate) {
          query.createdAt = { $gte: startDate, $lte: endDate };
        }
      }

      const orders = await Order.find(query).lean();
      
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + (order.orderAmount || 0), 0);
      const totalCODOrders = orders.filter(order => order.paymentMethod === 'cod' || order.paymentMethod === 'COD').length;
      const totalCardOrders = orders.filter(order => order.paymentMethod === 'card' || order.paymentMethod === 'CARD').length;

      return {
        totalOrders,
        totalSales,
        totalCODOrders,
        totalCardOrders
      };
    },

    async getRestaurantDashboardSalesOrderCountDetailsByYear(_, { restaurant, year }) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      
      const orders = await Order.find({
        restaurant,
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();

      const salesAmount = orders.reduce((sum, order) => sum + (order.orderAmount || 0), 0);
      const ordersCount = orders.length;

      return {
        salesAmount,
        ordersCount
      };
    },

    async getDashboardOrderSalesDetailsByPaymentMethod(_, { restaurant, starting_date, ending_date }) {
      const query = {
        restaurant,
        isActive: true,
        createdAt: {
          $gte: new Date(starting_date),
          $lte: new Date(ending_date)
        }
      };

      const orders = await Order.find(query).lean();

      const allData = {
        total_orders: orders.length,
        total_sales: orders.reduce((sum, order) => sum + (order.orderAmount || 0), 0),
        total_sales_without_delivery: orders.reduce((sum, order) => sum + ((order.orderAmount || 0) - (order.deliveryFee || 0)), 0),
        total_delivery_fee: orders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0)
      };

      const codOrders = orders.filter(order => order.paymentMethod === 'cod' || order.paymentMethod === 'COD');
      const codData = {
        total_orders: codOrders.length,
        total_sales: codOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0),
        total_sales_without_delivery: codOrders.reduce((sum, order) => sum + ((order.orderAmount || 0) - (order.deliveryFee || 0)), 0),
        total_delivery_fee: codOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0)
      };

      const cardOrders = orders.filter(order => order.paymentMethod === 'card' || order.paymentMethod === 'CARD');
      const cardData = {
        total_orders: cardOrders.length,
        total_sales: cardOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0),
        total_sales_without_delivery: cardOrders.reduce((sum, order) => sum + ((order.orderAmount || 0) - (order.deliveryFee || 0)), 0),
        total_delivery_fee: cardOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0)
      };

      return {
        all: { _type: 'all', data: allData },
        cod: { _type: 'cod', data: codData },
        card: { _type: 'card', data: cardData }
      };
    },

    async vendors(_, { filters }) {
      const query = { role: 'seller' };
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const vendors = await User.find(query)
        .lean();

      return vendors;
    },

    async riders(_, { filters }) {
      const query = { role: 'rider' };
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { phone: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      return await User.find(query).lean();
    },

    async availableRiders(_, { zoneId }) {
      const query = { role: 'rider', isActive: true, 'riderProfile.available': true };
      if (zoneId) {
        query.zone = zoneId;
      }
      return await User.find(query).lean();
    },

    async ridersByZone(_, { zoneId }) {
      return await User.find({ role: 'rider', zone: zoneId }).lean();
    },

    async staffs(_, { filters }) {
      const query = { role: { $in: ['admin', 'staff'] } };
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      return await User.find(query).lean();
    },

    async restaurants(_, { filters }) {
      const query = {};
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { address: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      return await Restaurant.find(query)
        .populate('owner')
        .populate('zone')
        .lean();
    },

    async restaurantsPaginated(_, { filters }) {
      const query = {};
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { address: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const page = filters?.page || filters?.pageNo || 1;
      const limit = filters?.limit || filters?.pageSize || 10;
      const skip = (page - 1) * limit;

      const data = await Restaurant.find(query)
        .populate('owner')
        .populate('zone')
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Restaurant.countDocuments(query);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    },

    async restaurantByOwner(_, { ownerId }) {
      const user = await User.findById(ownerId).lean();
      if (!user) {
        throw new Error('User not found');
      }
      // Get restaurants for this owner
      const restaurants = await Restaurant.find({ owner: ownerId })
        .populate('zone')
        .lean();
      
      // Return user with restaurants populated
      return {
        ...user,
        restaurants
      };
    },

    async getVendor(_, { vendorId }) {
      const vendor = await User.findById(vendorId)
        .lean();
      if (!vendor || vendor.role !== 'seller') {
        throw new Error('Vendor not found');
      }
      return vendor;
    },

    async allOrdersWithoutPagination(_, { filters }) {
      const query = { isActive: true };
      if (filters?.search) {
        query.$or = [
          { orderId: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.status) {
        query.orderStatus = filters.status;
      }
      
      // Handle date filtering
      if (filters?.starting_date || filters?.ending_date) {
        query.createdAt = {};
        if (filters.starting_date) {
          query.createdAt.$gte = new Date(filters.starting_date);
        }
        if (filters.ending_date) {
          const endDate = new Date(filters.ending_date);
          endDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endDate;
        }
      }

      return await Order.find(query)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .sort({ createdAt: -1 })
        .lean();
    },

    async getActiveOrders(_, { restaurantId, page, rowsPerPage, actions, search }) {
      const query = {
        isActive: true,
        orderStatus: { $in: actions && actions.length > 0 ? actions : ['pending', 'accepted', 'preparing', 'ready', 'picked', 'enroute'] }
      };

      if (restaurantId) {
        query.restaurant = restaurantId;
      }

      if (search) {
        query.orderId = { $regex: search, $options: 'i' };
      }

      const limit = rowsPerPage || 10;
      const skip = page ? (page - 1) * limit : 0;

      const [orders, totalCount] = await Promise.all([
        Order.find(query)
        .populate('restaurant')
          .populate('customer', 'name phone')
        .populate('rider')
        .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query)
      ]);

      return {
        totalCount,
        orders
      };
    },

    async ordersByRestId(_, { restaurantId, filters }) {
      const query = { restaurant: restaurantId, isActive: true };
      if (filters?.search) {
        query.$or = [
          { orderId: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.status) {
        query.orderStatus = filters.status;
      }

      return await Order.find(query)
        .populate('customer')
        .populate('rider')
        .sort({ createdAt: -1 })
        .lean();
    },

    async ordersByRestIdWithoutPagination(_, { restaurantId, filters }) {
      const query = { restaurant: restaurantId, isActive: true };
      if (filters?.search) {
        query.$or = [
          { orderId: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.status) {
        query.orderStatus = filters.status;
      }

      return await Order.find(query)
        .populate('customer')
        .populate('rider')
        .sort({ createdAt: -1 })
        .lean();
    },

    async ordersByUser(_, { userId, page = 1, limit = 10 }) {
      const query = { customer: userId, isActive: true };
      
      const skip = (page - 1) * limit;
      
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .populate('restaurant', '_id name')
          .populate('rider')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const nextPage = page < totalPages ? page + 1 : null;
      const prevPage = page > 1 ? page - 1 : null;

      return {
        orders,
        totalCount,
        totalPages,
        currentPage: page,
        nextPage,
        prevPage
      };
    },

    async coupons() {
      return await Coupon.find().sort({ createdAt: -1 }).lean();
    },

    async restaurantCoupons(_, { restaurantId }) {
      return await Coupon.find({ restaurant: restaurantId, isActive: true })
        .populate('restaurant')
        .sort({ createdAt: -1 })
        .lean();
    },

    async tips() {
      // Placeholder - implement Tipping configuration if exists
      return {
        _id: 'tips',
        enabled: false,
        amounts: [],
        defaultAmount: 0
      };
    },

    async notifications(_, { filters }) {
      // Placeholder - implement Notification model if exists
      return [];
    },

    async auditLogs(_, { filters }) {
      // Use auditLogger service if available
      // Placeholder implementation
      return {
        data: [],
        total: 0
      };
    },

    async withdrawRequests(_, { userType, userId, pagination, search }) {
      const query = {};
      
      if (userType) {
        if (userType === 'SELLER') {
          const restaurants = await Restaurant.find({ owner: userId }).select('_id').lean();
          query.storeId = { $in: restaurants.map(r => r._id.toString()) };
        } else if (userType === 'RIDER') {
          query.riderId = userId;
        }
      } else if (userId) {
        // If userId provided without userType, search both
        const restaurants = await Restaurant.find({ owner: userId }).select('_id').lean();
        query.$or = [
          { storeId: { $in: restaurants.map(r => r._id.toString()) } },
          { riderId: userId }
        ];
      }

      if (search) {
        query.$or = [
          ...(query.$or || []),
          { requestId: { $regex: search, $options: 'i' } }
        ];
      }

      // Placeholder - implement WithdrawRequest model if exists
      // For now, return empty data with pagination
      const pageSize = pagination?.pageSize || 10;
      const pageNo = pagination?.pageNo || 1;
      const total = 0; // Placeholder

      return {
        success: true,
        message: 'Success',
        pagination: {
          total,
          pageSize,
          pageNo,
          totalPages: Math.ceil(total / pageSize)
        },
        data: []
      };
    },

    async getTicketUsers(_, { filters }) {
      // Placeholder - implement support ticket system if exists
      return [];
    },

    async getTicketUsersWithLatest(_, { filters }) {
      // Placeholder - implement support ticket system if exists
      return [];
    },

    async getSingleUserSupportTickets(_, { userId }) {
      // Placeholder - implement support ticket system if exists
      return [];
    },

    async getSingleSupportTicket(_, { ticketId }) {
      // Placeholder - implement support ticket system if exists
      throw new Error('Support tickets not implemented');
    },

    async getTicketMessages(_, { ticketId }) {
      // Placeholder - implement support ticket system if exists
      return [];
    },

    async getClonedRestaurants() {
      // Placeholder - implement cloned restaurants logic if exists
      return [];
    },

    async getClonedRestaurantsPaginated(_, { filters }) {
      // Placeholder - implement cloned restaurants logic if exists
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
    },

    async getRestaurantDeliveryZoneInfo(_, { restaurantId }) {
      const restaurant = await Restaurant.findById(restaurantId)
        .populate('zone')
        .lean();
      
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      return {
        restaurantId: restaurant._id.toString(),
        deliveryBounds: restaurant.deliveryBounds || null,
        zone: restaurant.zone || null,
        deliveryInfo: {
          minDeliveryFee: restaurant.minimumOrder || 0,
          deliveryDistance: 0,
          deliveryFee: 0
        }
      };
    }
  },

  Order: {
    user: (parent) => {
      // Map customer field to user for GraphQL
      if (parent.customer) {
        return parent.customer;
      }
      return parent.user;
    }
  },

  User: {
    addresses: (parent) => {
      // Map addressBook to addresses
      if (parent.addressBook) {
        return parent.addressBook.map(addr => ({
          _id: addr._id,
          deliveryAddress: addr.deliveryAddress,
          details: addr.details,
          label: addr.label,
          selected: addr.selected || false,
          location: addr.location || null
        }));
      }
      return parent.addresses || [];
    },
    favourite: (parent) => {
      // Ensure favourite returns array of strings (restaurant IDs)
      if (!parent.favourite) return [];
      return parent.favourite.map(fav => {
        if (typeof fav === 'object' && fav._id) {
          return fav._id.toString();
        }
        return fav.toString();
      });
    },
    // Admin app fields
    status: (parent) => {
      return parent.isActive ? 'active' : 'inactive';
    },
    lastLogin: async (parent) => {
      // Return from metadata or updatedAt
      if (parent.metadata?.lastLogin) {
        return new Date(parent.metadata.lastLogin);
      }
      return parent.updatedAt || null;
    },
    notes: (parent) => {
      return parent.metadata?.notes || null;
    },
    username: (parent) => {
      return parent.metadata?.username || null;
    },
    unique_id: (parent) => {
      return parent._id?.toString() || null;
    },
    plainPassword: () => {
      // Never expose real passwords
      return null;
    },
    vehicleType: (parent) => {
      return parent.riderProfile?.vehicleType || parent.riderProfile?.vehicleDetails?.vehicleType || null;
    },
    available: (parent) => {
      // Map riderProfile.available to available field for GraphQL
      return parent.riderProfile?.available ?? null;
    },
    assigned: async (parent) => {
      // Check if rider has assigned orders
      if (parent.role !== 'rider') return false;
      const assignedOrder = await Order.findOne({ 
        rider: parent._id, 
        orderStatus: { $in: ['assigned', 'picked', 'enroute'] }
      }).lean();
      return !!assignedOrder;
    },
    permissions: (parent) => {
      // Return permissions array based on role
      if (parent.role === 'admin') {
        return ['ALL'];
      }
      return [];
    },
    zone: async (parent) => {
      if (parent.zone) {
        return await Zone.findById(parent.zone).lean();
      }
      return null;
    },
    restaurants: async (parent) => {
      if (parent.role === 'seller') {
        return await Restaurant.find({ owner: parent._id }).lean();
      }
      return [];
    },
    bussinessDetails: (parent) => {
      // Return from restaurant or user metadata
      return parent.metadata?.bussinessDetails || null;
    },
    licenseDetails: (parent) => {
      return parent.riderProfile?.licenseDetails || null;
    },
    vehicleDetails: (parent) => {
      return parent.riderProfile?.vehicleDetails || null;
    }
  },

  Restaurant: {
    unique_restaurant_id: (parent) => {
      return parent._id?.toString() || parent.orderId || null;
    },
    deliveryInfo: (parent) => {
      return {
        minDeliveryFee: parent.minimumOrder || 0,
        deliveryDistance: 0, // Calculate if needed
        deliveryFee: 0 // Calculate if needed
      };
    },
    city: (parent) => {
      // Extract city from address or metadata
      if (parent.address) {
        const parts = parent.address.split(',');
        return parts[parts.length - 2]?.trim() || null;
      }
      return parent.metadata?.city || null;
    },
    postCode: (parent) => {
      // Extract postcode from address or metadata
      if (parent.address) {
        const parts = parent.address.split(',');
        return parts[parts.length - 1]?.trim() || null;
      }
      return parent.metadata?.postCode || null;
    }
  },

  Mutation: {
    // Add restaurant to favourites
    async addFavourite(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) throw new Error('User not found');

      if (!user.favourite) {
        user.favourite = [];
      }
      if (!user.favourite.includes(id)) {
        user.favourite.push(id);
        await user.save();
      }

      return await User.findById(user._id)
        .populate('favourite')
        .lean();
    },

    // Review an order
    async reviewOrder(_, { reviewInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const { order: orderId, rating, description } = reviewInput;

      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found');

      // Verify the order belongs to the authenticated user
      if (order.customer?.toString() !== context.user._id.toString()) {
        throw new Error('You can only review your own orders');
      }

      // Create or update review
      let review = await Review.findOne({ order: orderId });
      if (review) {
        review.rating = rating;
        review.description = description;
        await review.save();
      } else {
        review = await Review.create({
          order: orderId,
          restaurant: order.restaurant,
          user: context.user._id,
          rating,
          description,
          isActive: true
        });
      }

      // Update order with review
      order.review = {
        rating: review.rating,
        comment: review.description
      };
      await order.save();

      // Update restaurant rating
      const restaurant = await Restaurant.findById(order.restaurant);
      if (restaurant) {
        const allReviews = await Review.find({ restaurant: restaurant._id, isActive: true });
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        restaurant.rating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        restaurant.reviewCount = allReviews.length;
        restaurant.reviewAverage = restaurant.rating;
        await restaurant.save();
      }

      return await Order.findById(orderId)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    // Select address
    async selectAddress(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) throw new Error('User not found');

      // Update address selection
      if (user.addressBook && user.addressBook.length > 0) {
        user.addressBook.forEach((addr) => {
          addr.selected = addr._id?.toString() === id;
        });
        await user.save();
      }

      return await User.findById(user._id).lean();
    },

    // Update user
    async updateUser(_, { updateUserInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) throw new Error('User not found');

      Object.assign(user, updateUserInput);
      await user.save();

      return await User.findById(user._id).lean();
    },

    // Set app versions
    async setVersions(_, { customerAppVersion }) {
      const configDoc = await Configuration.getConfiguration();
      configDoc.customerAppVersion = customerAppVersion;
      await configDoc.save();
      return 'success';
    },

    // Authentication Mutations
    async restaurantLogin(_, { username, password, notificationToken }, context) {
      // Find restaurant by username and password
      const restaurant = await Restaurant.findOne({ username, password }).lean();
      
      if (!restaurant) {
        throw new Error('Invalid restaurant credentials');
      }

      if (!restaurant.isActive) {
        throw new Error('Restaurant account is deactivated');
      }

      // Get the restaurant owner
      const owner = await User.findById(restaurant.owner);
      if (!owner) {
        throw new Error('Restaurant owner not found');
      }

      if (owner.isActive === false) {
        throw new Error('Account is deactivated');
      }

      // Update notification token if provided
      if (notificationToken) {
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          notificationToken
        });
      }

      // Generate token for the owner user
      const token = signToken({ id: owner._id, role: owner.role });

      auditLogger.logEvent({
        category: 'auth',
        action: 'restaurant_login',
        userId: owner._id.toString(),
        entityId: restaurant._id.toString(),
        entityType: 'restaurant'
      });

      return {
        token,
        restaurantId: restaurant._id.toString()
      };
    },

    async ownerLogin(_, { email, password }, context) {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user by email
      const user = await User.findOne({
        $or: [{ email }, { phone: email }]
      }).select('+password');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Check if account is active
      if (user.isActive === false) {
        throw new Error('Account is deactivated');
      }

      // Map role to userType for admin app
      let userType = 'STAFF';
      if (user.role === 'admin') {
        userType = 'ADMIN';
      } else if (user.role === 'seller') {
        userType = 'RESTAURANT'; // Default to RESTAURANT for sellers
      }

      // Generate token
      const token = signToken({ id: user._id, role: user.role });

      // Fetch restaurants based on user role
      let restaurants = [];
      let userTypeId = null;
      let shopType = null;

      if (user.role === 'admin') {
        // Admin can see all restaurants
        restaurants = await Restaurant.find({ isActive: true })
          .select('_id orderId name image address')
          .lean();
      } else if (user.role === 'seller') {
        // Seller can see their own restaurants
        const sellerRestaurants = await Restaurant.find({ owner: user._id, isActive: true })
          .select('_id orderId name image address shopType')
          .lean();
        
        restaurants = sellerRestaurants.map(r => ({
          _id: r._id.toString(),
          orderId: r.orderId || '',
          name: r.name || '',
          image: r.image || '',
          address: r.address || ''
        }));

        // If seller has restaurants, set userTypeId and shopType from first restaurant
        if (sellerRestaurants.length > 0) {
          userTypeId = sellerRestaurants[0]._id.toString();
          shopType = sellerRestaurants[0].shopType || '';
          // If seller has multiple restaurants, set userType to VENDOR
          if (sellerRestaurants.length > 1) {
            userType = 'VENDOR';
          }
        }
      }

      auditLogger.logEvent({
        category: 'auth',
        action: 'owner_login',
        userId: user._id.toString(),
        metadata: { role: user.role, userType }
      });

      // Return admin app expected format
      return {
        userId: user._id.toString(),
        token,
        email: user.email || '',
        userType,
        restaurants: restaurants.map(r => ({
          _id: r._id.toString(),
          orderId: r.orderId || '',
          name: r.name || '',
          image: r.image || '',
          address: r.address || ''
        })),
        permissions: user.role === 'admin' ? ['ALL'] : [], // Admin has all permissions
        userTypeId: userTypeId || user._id.toString(),
        image: user.image || user.avatar || '',
        name: user.name || '',
        shopType: shopType || ''
      };
    },

    async login(_, { email, password, type, appleId, name, notificationToken }, context) {
      let user;

      // Handle Apple Sign In
      if (type === 'apple' && appleId) {
        user = await User.findOne({ 
          $or: [{ email: email || null }, { userType: 'apple', metadata: { appleId } }]
        });
        
        if (!user) {
          // Create new user for Apple Sign In
          user = await User.create({
            name: name || 'User',
            email: email,
            userType: 'apple',
            phoneIsVerified: true,
            emailIsVerified: !!email,
            password: require('crypto').randomBytes(32).toString('hex'), // Random password for Apple users
            metadata: { appleId }
          });
        }
      } else {
        // Regular login with email/password
        if (!email || !password) {
          throw new Error('Email and password are required');
        }

        // Support login with email, phone, or metadata.username (for riders)
        user = await User.findOne({
          $or: [
            { email },
            { phone: email },
            { 'metadata.username': email }
          ]
        }).select('+password');

        if (!user) {
          throw new Error('Invalid credentials');
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
          throw new Error('Invalid credentials');
        }
      }

      if (user.isActive === false) {
        throw new Error('Account is deactivated');
      }

      // Update notification token if provided
      if (notificationToken) {
        if (!user.pushTokens) {
          user.pushTokens = [];
        }
        if (!user.pushTokens.includes(notificationToken)) {
          user.pushTokens.push(notificationToken);
        }
        user.notificationToken = notificationToken;
        await user.save();
      }

      const token = signToken({ id: user._id, role: user.role });
      const tokenExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      return {
        userId: user._id.toString(),
        token,
        tokenExpiration,
        isActive: user.isActive,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isNewUser: false // Could be enhanced to detect new users
      };
    },

    async riderLogin(_, { username, password, notificationToken, timeZone }) {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Find rider by username (stored in metadata.username)
      const user = await User.findOne({
        role: 'rider',
        'metadata.username': username
      }).select('+password');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      if (user.isActive === false) {
        throw new Error('Account is deactivated');
      }

      // Update notification token if provided
      if (notificationToken) {
        if (!user.pushTokens) {
          user.pushTokens = [];
        }
        if (!user.pushTokens.includes(notificationToken)) {
          user.pushTokens.push(notificationToken);
        }
        user.notificationToken = notificationToken;
      }

      // Update timezone if provided
      if (timeZone) {
        user.timeZone = timeZone;
      }

      await user.save();

      const token = signToken({ id: user._id, role: user.role });
      const tokenExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      auditLogger.logEvent({
        category: 'auth',
        action: 'rider_login',
        userId: user._id.toString(),
        metadata: { username }
      });

      return {
        userId: user._id.toString(),
        token,
        tokenExpiration,
        isActive: user.isActive,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isNewUser: false
      };
    },

    async createUser(_, { userInput }) {
      const { phone, email, password, name, notificationToken, appleId, emailIsVerified, isPhoneExists } = userInput;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email: email || null }, { phone: phone || null }]
      });

      if (existingUser) {
        throw new Error('User with provided email or phone already exists');
      }

      const user = await User.create({
        name,
        email,
        phone,
        password: password || require('crypto').randomBytes(32).toString('hex'),
        userType: appleId ? 'apple' : (email ? 'email' : 'phone'),
        phoneIsVerified: isPhoneExists || false,
        emailIsVerified: emailIsVerified || false,
        notificationToken,
        metadata: appleId ? { appleId } : undefined
      });

      const token = signToken({ id: user._id, role: user.role });
      const tokenExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      auditLogger.logEvent({
        category: 'auth',
        action: 'register',
        userId: user._id.toString(),
        metadata: { role: user.role }
      });

      return {
        userId: user._id.toString(),
        token,
        tokenExpiration,
        name: user.name,
        email: user.email,
        phone: user.phone
      };
    },

    async verifyOtp(_, { otp, email, phone }) {
      // Get test OTP from configuration
      const configDoc = await Configuration.getConfiguration();
      const testOtp = configDoc.testOtp || '123456';

      // For now, use test OTP if configured, otherwise validate
      if (testOtp && otp === testOtp) {
        // Update user verification status
        if (email) {
          await User.findOneAndUpdate({ email }, { emailIsVerified: true });
        } else if (phone) {
          await User.findOneAndUpdate({ phone }, { phoneIsVerified: true });
        }
        return { result: 'success' };
      }

      // In production, implement proper OTP verification
      throw new Error('Invalid OTP');
    },

    async sendOtpToEmail(_, { email }) {
      // Get test OTP from configuration
      const configDoc = await Configuration.getConfiguration();
      const testOtp = configDoc.testOtp || '123456';

      // In production, send actual OTP via email service
      // For now, return success (OTP would be sent via email service)
      return { result: 'success' };
    },

    async sendOtpToPhoneNumber(_, { phone }) {
      // Get test OTP from configuration
      const configDoc = await Configuration.getConfiguration();
      const testOtp = configDoc.testOtp || '123456';

      // In production, send actual OTP via SMS service
      // For now, return success (OTP would be sent via SMS service)
      return { result: 'success' };
    },

    // User Management Mutations
    async emailExist(_, { email }) {
      const user = await User.findOne({ email }).lean();
      if (user) {
        return {
          userType: user.userType || 'email',
          _id: user._id.toString(),
          email: user.email
        };
      }
      return {
        userType: null,
        _id: null,
        email: null
      };
    },

    async phoneExist(_, { phone }) {
      const user = await User.findOne({ phone }).lean();
      if (user) {
        return {
          userType: user.userType || 'phone',
          _id: user._id.toString(),
          phone: user.phone
        };
      }
      return {
        userType: null,
        _id: null,
        phone: null
      };
    },

    async changePassword(_, { oldPassword, newPassword }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await user.matchPassword(oldPassword);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      auditLogger.logEvent({
        category: 'auth',
        action: 'password_change',
        userId: user._id.toString()
      });

      return 'success';
    },

    async updateNotificationStatus(_, { offerNotification, orderNotification }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      user.isOfferNotification = offerNotification;
      user.isOrderNotification = orderNotification;
      await user.save();

      return await User.findById(user._id).lean();
    },

    async Deactivate(_, { isActive, email }) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      user.isActive = isActive;
      await user.save();

      auditLogger.logEvent({
        category: 'user',
        action: 'deactivate',
        userId: user._id.toString(),
        metadata: { isActive }
      });

      return await User.findById(user._id).lean();
    },

    async pushToken(_, { token }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.pushTokens) {
        user.pushTokens = [];
      }
      if (!user.pushTokens.includes(token)) {
        user.pushTokens.push(token);
      }
      user.notificationToken = token;
      await user.save();

      return await User.findById(user._id).lean();
    },

    // Address Mutations
    async createAddress(_, { addressInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.addressBook) {
        user.addressBook = [];
      }

      user.addressBook.push({
        ...addressInput,
        selected: addressInput.selected || false
      });
      await user.save();

      return await User.findById(user._id)
        .populate('favourite')
        .lean();
    },

    async editAddress(_, { addressInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.addressBook || user.addressBook.length === 0) {
        throw new Error('Address not found');
      }

      const addressIndex = user.addressBook.findIndex(
        addr => addr._id?.toString() === addressInput._id?.toString()
      );

      if (addressIndex === -1) {
        throw new Error('Address not found');
      }

      user.addressBook[addressIndex] = {
        ...user.addressBook[addressIndex].toObject(),
        ...addressInput
      };
      await user.save();

      return await User.findById(user._id)
        .populate('favourite')
        .lean();
    },

    async deleteAddress(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.addressBook) {
        throw new Error('Address not found');
      }

      user.addressBook = user.addressBook.filter(
        addr => addr._id?.toString() !== id.toString()
      );
      await user.save();

      return await User.findById(user._id)
        .populate('favourite')
        .lean();
    },

    async deleteBulkAddresses(_, { ids }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.addressBook) {
        return await User.findById(user._id)
          .populate('favourite')
          .lean();
      }

      const idStrings = ids.map(id => id.toString());
      user.addressBook = user.addressBook.filter(
        addr => !idStrings.includes(addr._id?.toString())
      );
      await user.save();

      return await User.findById(user._id)
        .populate('favourite')
        .lean();
    },

    // Order Mutations
    async placeOrder(_, { restaurant, orderInput, paymentMethod, couponCode, tipping, taxationAmount, address, orderDate, isPickedUp, deliveryCharges, instructions }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const restaurantDoc = await Restaurant.findById(restaurant);
      if (!restaurantDoc) {
        throw new Error('Restaurant not found');
      }

      const customer = await User.findById(context.user._id);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate order amount from items
      let orderAmount = 0;
      const items = orderInput.map(item => {
        const itemPrice = item.variation?.price || 0;
        const addonPrice = (item.addons || []).reduce((sum, addon) => {
          const optionPrice = (addon.options || []).reduce((optSum, opt) => optSum + (opt.price || 0), 0);
          return sum + optionPrice;
        }, 0);
        const itemTotal = (itemPrice + addonPrice) * item.quantity;
        orderAmount += itemTotal;

        return {
          title: item.title,
          food: item.food,
          description: item.description,
          image: item.image,
          quantity: item.quantity,
          variation: item.variation ? {
            _id: item.variation._id,
            title: item.variation.title,
            price: item.variation.price,
            discounted: item.variation.discounted,
            addons: item.variation.addons || []
          } : undefined,
          addons: item.addons || [],
          specialInstructions: item.specialInstructions
        };
      });

      orderAmount += (deliveryCharges || 0) + (tipping || 0) + (taxationAmount || 0);

      const order = await Order.create({
        restaurant,
        customer: context.user._id,
        seller: restaurantDoc.owner,
        items,
        orderAmount,
        paidAmount: paymentMethod === 'cash' ? 0 : orderAmount,
        deliveryCharges: deliveryCharges || 0,
        tipping: tipping || 0,
        taxationAmount: taxationAmount || 0,
        paymentMethod: paymentMethod || 'cash',
        deliveryAddress: address,
        instructions,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        isPickedUp: isPickedUp || false,
        orderStatus: 'pending',
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        timeline: [{
          status: 'pending',
          note: 'Order placed by customer',
          updatedBy: context.user._id
        }]
      });

      // Generate order ID if not auto-generated
      if (!order.orderId) {
        order.orderId = generateOrderId();
        await order.save();
      }

      emitOrderUpdate(order._id.toString(), {
        action: 'created',
        order
      });

      auditLogger.logEvent({
        category: 'orders',
        action: 'created',
        userId: context.user._id.toString(),
        entityId: order._id.toString(),
        entityType: 'order'
      });

      return await Order.findById(order._id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    async acceptOrder(_, { _id, time }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(_id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify user owns the restaurant
      const restaurant = await Restaurant.findById(order.restaurant).lean();
      if (!restaurant || restaurant.owner?.toString() !== context.user._id.toString()) {
        throw new Error('You can only accept orders for your restaurant');
      }

      // Only allow accepting pending orders
      if (order.orderStatus !== 'pending') {
        throw new Error('Order cannot be accepted at this stage');
      }

      order.orderStatus = 'accepted';
      order.acceptedAt = new Date();
      if (time) {
        order.preparationTime = parseInt(time, 10);
      }
      await order.save();

      emitOrderUpdate(order._id.toString(), {
        action: 'accepted',
        order
      });

      auditLogger.logEvent({
        category: 'orders',
        action: 'accepted',
        userId: context.user._id.toString(),
        entityId: order._id.toString(),
        entityType: 'order'
      });

      return await Order.findById(order._id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    async cancelOrder(_, { _id, reason }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(_id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify user owns the restaurant
      const restaurant = await Restaurant.findById(order.restaurant).lean();
      if (!restaurant || restaurant.owner?.toString() !== context.user._id.toString()) {
        throw new Error('You can only cancel orders for your restaurant');
      }

      // Only allow cancellation if order is pending or accepted
      if (!['pending', 'accepted'].includes(order.orderStatus)) {
        throw new Error('Order cannot be cancelled at this stage');
      }

      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      order.reason = reason;
      order.isActive = false;
      await order.save();

      emitOrderUpdate(order._id.toString(), {
        action: 'cancelled',
        order
      });

      auditLogger.logEvent({
        category: 'orders',
        action: 'cancelled',
        userId: context.user._id.toString(),
        entityId: order._id.toString(),
        entityType: 'order'
      });

      return await Order.findById(order._id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    async orderPickedUp(_, { _id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(_id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify user owns the restaurant
      const restaurant = await Restaurant.findById(order.restaurant).lean();
      if (!restaurant || restaurant.owner?.toString() !== context.user._id.toString()) {
        throw new Error('You can only update orders for your restaurant');
      }

      order.isPickedUp = true;
      order.pickedAt = new Date();
      if (order.orderStatus === 'ready') {
        order.orderStatus = 'picked';
      }
      await order.save();

      emitOrderUpdate(order._id.toString(), {
        action: 'picked_up',
        order
      });

      auditLogger.logEvent({
        category: 'orders',
        action: 'picked_up',
        userId: context.user._id.toString(),
        entityId: order._id.toString(),
        entityType: 'order'
      });

      return await Order.findById(order._id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    async muteRing(_, { orderId }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify user owns the restaurant
      const restaurant = await Restaurant.findById(order.restaurant).lean();
      if (!restaurant || restaurant.owner?.toString() !== context.user._id.toString()) {
        throw new Error('You can only mute rings for your restaurant orders');
      }

      order.isRinged = true;
      await order.save();

      return true;
    },

    async abortOrder(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify ownership - allow restaurant owner or customer
      const restaurant = await Restaurant.findById(order.restaurant).lean();
      const isOwner = restaurant?.owner?.toString() === context.user._id.toString();
      const isCustomer = order.customer?.toString() === context.user._id.toString();
      
      if (!isOwner && !isCustomer) {
        throw new Error('You can only cancel your own orders');
      }

      // Only allow cancellation if order is pending or accepted
      if (!['pending', 'accepted'].includes(order.orderStatus)) {
        throw new Error('Order cannot be cancelled at this stage');
      }

      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      await order.save();

      emitOrderUpdate(order._id.toString(), {
        action: 'cancelled',
        order
      });

      auditLogger.logEvent({
        category: 'orders',
        action: 'cancelled',
        userId: context.user._id.toString(),
        entityId: order._id.toString(),
        entityType: 'order'
      });

      return await Order.findById(order._id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    async assignOrder(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify user is a rider
      if (context.user.userType !== 'rider') {
        throw new Error('Only riders can assign orders');
      }

      // Assign rider to order
      order.rider = context.user._id;
      order.orderStatus = 'assigned';
      order.assignedAt = new Date();
      await order.save();

      emitOrderUpdate(order._id.toString(), {
        action: 'assigned',
        order
      });

      return await Order.findById(order._id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    async updateOrderStatusRider(_, { id, status }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify user is the assigned rider
      if (order.rider?.toString() !== context.user._id.toString()) {
        throw new Error('You can only update orders assigned to you');
      }

      order.orderStatus = status;
      
      // Update timestamps based on status
      if (status === 'picked') {
        order.pickedAt = new Date();
      } else if (status === 'delivered') {
        order.deliveredAt = new Date();
        order.orderStatus = 'completed';
      }

      await order.save();

      emitOrderUpdate(order._id.toString(), {
        action: 'status_updated',
        order
      });

      return await Order.findById(order._id)
        .populate('restaurant')
        .populate('customer')
        .populate('rider')
        .lean();
    },

    // Other Mutations
    async forgotPassword(_, { email }) {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists for security
        return { result: 'success' };
      }

      // In production, send password reset email
      // For now, return success
      return { result: 'success' };
    },

    async resetPassword(_, { password, email }) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      user.password = password;
      await user.save();

      auditLogger.logEvent({
        category: 'auth',
        action: 'password_reset',
        userId: user._id.toString()
      });

      return { result: 'success' };
    },

    async getCoupon(_, { coupon }) {
      const mongoose = require('mongoose');
      let couponDoc;
      
      // First try to find by code (most common case)
      couponDoc = await Coupon.findOne({ code: coupon }).lean();
      
      // If not found by code and it looks like an ObjectId, try by _id
      if (!couponDoc && mongoose.Types.ObjectId.isValid(coupon)) {
        couponDoc = await Coupon.findById(coupon).lean();
      }
      
      if (!couponDoc) {
        throw new Error('Coupon not found');
      }
      if (!couponDoc.enabled) {
        throw new Error('Coupon is disabled');
      }
      return couponDoc;
    },

    async createCoupon(_, { couponInput }, context) {
      // Check if code already exists
      if (couponInput.code) {
        const existing = await Coupon.findOne({ code: couponInput.code }).lean();
        if (existing) {
          throw new Error('Coupon code already exists');
        }
      }

      const coupon = new Coupon({
        title: couponInput.title,
        code: couponInput.code,
        discount: couponInput.discount,
        enabled: couponInput.enabled !== undefined ? couponInput.enabled : true
      });

      await coupon.save();
      return coupon.toObject();
    },

    async editCoupon(_, { couponInput }, context) {
      if (!couponInput._id) {
        throw new Error('Coupon ID is required for editing');
      }

      const coupon = await Coupon.findById(couponInput._id);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Check if code is being changed and if new code already exists
      if (couponInput.code && couponInput.code !== coupon.code) {
        const existing = await Coupon.findOne({ code: couponInput.code }).lean();
        if (existing) {
          throw new Error('Coupon code already exists');
        }
      }

      if (couponInput.title) coupon.title = couponInput.title;
      if (couponInput.code !== undefined) coupon.code = couponInput.code;
      if (couponInput.discount !== undefined) coupon.discount = couponInput.discount;
      if (couponInput.enabled !== undefined) coupon.enabled = couponInput.enabled;

      await coupon.save();
      return coupon.toObject();
    },

    async deleteCoupon(_, { id }, context) {
      const coupon = await Coupon.findByIdAndDelete(id);
      if (!coupon) {
        throw new Error('Coupon not found');
      }
      return true;
    },

    async createCuisine(_, { cuisineInput }, context) {
      // Check if cuisine with same name already exists
      const existing = await Cuisine.findOne({ name: cuisineInput.name }).lean();
      if (existing) {
        throw new Error('Cuisine with this name already exists');
      }

      const cuisine = new Cuisine({
        name: cuisineInput.name,
        description: cuisineInput.description,
        image: cuisineInput.image,
        shopType: cuisineInput.shopType,
        isActive: cuisineInput.isActive !== undefined ? cuisineInput.isActive : true
      });

      await cuisine.save();
      return cuisine.toObject();
    },

    async editCuisine(_, { cuisineInput }, context) {
      if (!cuisineInput._id) {
        throw new Error('Cuisine ID is required for editing');
      }

      const cuisine = await Cuisine.findById(cuisineInput._id);
      if (!cuisine) {
        throw new Error('Cuisine not found');
      }

      // Check if name is being changed and if new name already exists
      if (cuisineInput.name && cuisineInput.name !== cuisine.name) {
        const existing = await Cuisine.findOne({ name: cuisineInput.name }).lean();
        if (existing) {
          throw new Error('Cuisine with this name already exists');
        }
      }

      if (cuisineInput.name) cuisine.name = cuisineInput.name;
      if (cuisineInput.description !== undefined) cuisine.description = cuisineInput.description;
      if (cuisineInput.image !== undefined) cuisine.image = cuisineInput.image;
      if (cuisineInput.shopType !== undefined) cuisine.shopType = cuisineInput.shopType;
      if (cuisineInput.isActive !== undefined) cuisine.isActive = cuisineInput.isActive;

      await cuisine.save();
      return cuisine.toObject();
    },

    async deleteCuisine(_, { id }, context) {
      const cuisine = await Cuisine.findByIdAndDelete(id);
      if (!cuisine) {
        throw new Error('Cuisine not found');
      }
      return true;
    },

    async uploadImageToS3(_, { image }, context) {
      // For now, if image is already a URL, return it
      // In production, implement actual S3/Cloudinary upload
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return { imageUrl: image };
      }

      // If it's a base64 data URL, we could decode and upload to S3/Cloudinary
      // For now, we'll return the base64 string as-is (not recommended for production)
      // TODO: Implement actual S3/Cloudinary upload
      if (image.startsWith('data:image/')) {
        // This is a placeholder - in production, upload to S3/Cloudinary and return URL
        throw new Error('Base64 image upload not yet implemented. Please provide a URL.');
      }

      // If it's just a path, return as-is
      return { imageUrl: image };
    },

    async sendChatMessage(_, { message, orderId }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // In production, implement chat message storage
      // For now, return a placeholder response
      return {
        success: true,
        message: 'Message sent',
        data: {
          id: require('crypto').randomUUID(),
          message: message.message,
          user: {
            id: context.user._id.toString(),
            name: context.user.name
          },
          createdAt: new Date()
        }
      };
    },

    async createActivity(_, { groupId, module, screenPath, type, details }) {
      // Placeholder for activity tracking
      // In production, implement actual activity logging
      return 'success';
    },

    // Rider mutations
    async createRiderWithdrawRequest(_, { requestAmount }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (context.user.role !== 'rider') {
        throw new Error('Only riders can create withdraw requests');
      }

      const rider = await User.findById(context.user._id);
      if (!rider || !rider.riderProfile) {
        throw new Error('Rider profile not found');
      }

      const currentWallet = rider.riderProfile.currentWalletAmount || 0;
      
      if (requestAmount > currentWallet) {
        throw new Error('Insufficient wallet balance');
      }

      if (requestAmount < 10) {
        throw new Error('Minimum withdraw amount is ₹10');
      }

      // Check for existing pending request
      // Note: This is a placeholder - implement WithdrawRequest model if needed
      // For now, we'll just update the rider's wallet
      
      // Update wallet amounts
      rider.riderProfile.currentWalletAmount = currentWallet - requestAmount;
      rider.riderProfile.withdrawnWalletAmount = (rider.riderProfile.withdrawnWalletAmount || 0) + requestAmount;
      
      await rider.save();

      // Return mock withdraw request (implement actual model if needed)
      return {
        _id: require('crypto').randomUUID(),
        requestAmount,
        status: 'pending',
        createdAt: new Date(),
        userId: rider._id.toString()
      };
    },

    // Seller/Restaurant mutations
    async createRestaurant(_, { restaurant, owner }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Verify user is admin or the owner themselves
      if (context.user.role !== 'admin' && context.user._id.toString() !== owner.toString()) {
        throw new Error('Unauthorized to create restaurant for this owner');
      }

      // Verify owner exists and is a seller
      const ownerUser = await User.findById(owner);
      if (!ownerUser) {
        throw new Error('Owner not found');
      }
      if (ownerUser.role !== 'seller') {
        throw new Error('Restaurant owner must be a seller');
      }

      // Check if owner already has a restaurant
      const existingRestaurant = await Restaurant.findOne({ owner });
      if (existingRestaurant) {
        throw new Error('Owner already has a restaurant');
      }

      // Prepare restaurant data
      const restaurantData = {
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        description: restaurant.description,
        image: restaurant.image,
        logo: restaurant.logo,
        deliveryTime: restaurant.deliveryTime || 30,
        minimumOrder: restaurant.minimumOrder || 0,
        deliveryCharges: restaurant.deliveryCharges || 0,
        username: restaurant.username,
        password: restaurant.password,
        shopType: restaurant.shopType,
        tax: restaurant.tax || restaurant.salesTax || 0,
        cuisines: restaurant.cuisines || [],
        owner: owner
      };

      // Handle location coordinates
      if (restaurant.location && Array.isArray(restaurant.location) && restaurant.location.length === 2) {
        const [longitude, latitude] = restaurant.location;
        if (
          typeof longitude === 'number' && longitude >= -180 && longitude <= 180 &&
          typeof latitude === 'number' && latitude >= -90 && latitude <= 90
        ) {
          restaurantData.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
          };
        }
      }

      // Create restaurant
      const newRestaurant = await Restaurant.create(restaurantData);

      // Update owner's seller profile
      ownerUser.sellerProfile = {
        ...ownerUser.sellerProfile,
        restaurant: newRestaurant._id,
        businessName: newRestaurant.name
      };
      await ownerUser.save();

      return newRestaurant;
    },

    async createWithdrawRequest(_, { requestAmount, userId }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Verify user owns the restaurant
      const restaurant = await Restaurant.findOne({ owner: context.user._id }).lean();
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Placeholder implementation - create actual WithdrawRequest model if needed
      // For now, return a mock response
      return {
        _id: require('crypto').randomUUID(),
        requestAmount,
        status: 'pending',
        createdAt: new Date(),
        userId: context.user._id.toString(),
        storeId: restaurant._id.toString()
      };
    },

    async updateTimings(_, { id, openingTimes }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Verify user owns the restaurant
      const restaurant = await Restaurant.findOne({ 
        _id: id,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or access denied');
      }

      // Update opening times
      restaurant.openingTimes = openingTimes.map(timing => ({
        day: timing.day,
        times: timing.times.map(time => ({
          startTime: time.startTime,
          endTime: time.endTime
        }))
      }));

      await restaurant.save();

      return restaurant;
    },

    async toggleStoreAvailability(_, { restaurantId }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: restaurantId,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or access denied');
      }

      restaurant.isAvailable = !restaurant.isAvailable;
      await restaurant.save();

      return restaurant;
    },

    async updateRiderLocation(_, { latitude, longitude }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (context.user.userType !== 'rider') {
        throw new Error('Only riders can update location');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      // Update rider location
      if (!user.riderProfile) {
        user.riderProfile = {};
      }
      user.riderProfile.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };

      await user.save();

      return user;
    },

    async updateRiderLicenseDetails(_, { id, licenseDetails }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(id || context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      if (user._id.toString() !== context.user._id.toString()) {
        throw new Error('You can only update your own details');
      }

      if (!user.riderProfile) {
        user.riderProfile = {};
      }
      user.riderProfile.licenseDetails = licenseDetails;
      await user.save();

      return user;
    },

    async updateRiderVehicleDetails(_, { id, vehicleDetails }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const user = await User.findById(id || context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      if (user._id.toString() !== context.user._id.toString()) {
        throw new Error('You can only update your own details');
      }

      if (!user.riderProfile) {
        user.riderProfile = {};
      }
      user.riderProfile.vehicleDetails = vehicleDetails;
      await user.save();

      return user;
    },

    async updateRestaurantBussinessDetails(_, { id, bussinessDetails }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: id,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or access denied');
      }

      restaurant.bussinessDetails = bussinessDetails;
      await restaurant.save();

      return {
        success: true,
        message: 'Business details updated successfully',
        data: restaurant
      };
    },

    async updateRestaurantInfo(_, { id, restaurantInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: id,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or access denied');
      }

      // Update allowed fields
      if (restaurantInput.name !== undefined) restaurant.name = restaurantInput.name;
      if (restaurantInput.address !== undefined) restaurant.address = restaurantInput.address;
      if (restaurantInput.phone !== undefined) restaurant.phone = restaurantInput.phone;
      if (restaurantInput.email !== undefined) restaurant.email = restaurantInput.email;
      if (restaurantInput.description !== undefined) restaurant.description = restaurantInput.description;
      if (restaurantInput.image !== undefined) restaurant.image = restaurantInput.image;
      if (restaurantInput.logo !== undefined) restaurant.logo = restaurantInput.logo;
      if (restaurantInput.deliveryTime !== undefined) restaurant.deliveryTime = restaurantInput.deliveryTime;
      if (restaurantInput.minimumOrder !== undefined) restaurant.minimumOrder = restaurantInput.minimumOrder;
      if (restaurantInput.deliveryCharges !== undefined) restaurant.deliveryCharges = restaurantInput.deliveryCharges;
      
      // Update location coordinates if provided
      if (restaurantInput.location !== undefined && Array.isArray(restaurantInput.location)) {
        if (restaurantInput.location.length === 2) {
          const [longitude, latitude] = restaurantInput.location;
          // Validate coordinates
          if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
            restaurant.location = {
              type: 'Point',
              coordinates: [longitude, latitude]
            };
          } else {
            throw new Error('Invalid coordinates. Longitude must be between -180 and 180, latitude must be between -90 and 90');
          }
        } else {
          throw new Error('Location must be an array of [longitude, latitude]');
        }
      }

      await restaurant.save();

      return {
        success: true,
        message: 'Restaurant information updated successfully',
        data: restaurant
      };
    },

    async updateCommission(_, { id, commissionType, commissionRate }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Validate commissionType
      if (commissionType !== 'fixed' && commissionType !== 'percentage') {
        throw new Error('Commission type must be either "fixed" or "percentage"');
      }

      // Validate commissionRate
      if (commissionRate < 0) {
        throw new Error('Commission rate cannot be negative');
      }

      if (commissionType === 'percentage' && commissionRate > 100) {
        throw new Error('Percentage commission rate cannot exceed 100');
      }

      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Check if user is admin or restaurant owner
      const isAdmin = context.user.role === 'admin';
      const isOwner = restaurant.owner.toString() === context.user._id.toString();
      
      if (!isAdmin && !isOwner) {
        throw new Error('You do not have permission to update this restaurant\'s commission');
      }

      restaurant.commissionType = commissionType;
      restaurant.commissionRate = commissionRate;
      await restaurant.save();

      return restaurant;
    },

    async createCategory(_, { restaurantId, title, description, image, order }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: restaurantId,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or access denied');
      }

      const category = await Category.create({
        restaurant: restaurantId,
        title,
        description,
        image,
        order: order || 0,
        isActive: true
      });

      return category;
    },

    async updateCategory(_, { id, title, description, image, order, isActive }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const category = await Category.findById(id).populate('restaurant');
      if (!category) {
        throw new Error('Category not found');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: category.restaurant._id || category.restaurant,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Access denied');
      }

      if (title !== undefined) category.title = title;
      if (description !== undefined) category.description = description;
      if (image !== undefined) category.image = image;
      if (order !== undefined) category.order = order;
      if (isActive !== undefined) category.isActive = isActive;

      await category.save();
      return category;
    },

    async deleteCategory(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const category = await Category.findById(id).populate('restaurant');
      if (!category) {
        throw new Error('Category not found');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: category.restaurant._id || category.restaurant,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Access denied');
      }

      // Delete all products in this category
      await Product.deleteMany({ _id: { $in: category.foods } });
      
      // Remove category from restaurant
      restaurant.categories = restaurant.categories.filter(
        catId => catId.toString() !== id
      );
      await restaurant.save();

      await Category.findByIdAndDelete(id);
      return true;
    },

    async createProduct(_, { restaurantId, categoryId, productInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: restaurantId,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or access denied');
      }

      const product = await Product.create({
        restaurant: restaurantId,
        title: productInput.title,
        description: productInput.description,
        image: productInput.image,
        price: productInput.price,
        discountedPrice: productInput.discountedPrice,
        subCategory: productInput.subCategory,
        isActive: productInput.isActive !== undefined ? productInput.isActive : true,
        available: productInput.available !== undefined ? productInput.available : true,
        isOutOfStock: productInput.isOutOfStock || false,
        preparationTime: productInput.preparationTime || 15,
        variations: productInput.variations || [],
        addons: productInput.addons || []
      });

      // Add product to category if provided
      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (category && category.restaurant.toString() === restaurantId) {
          category.foods.push(product._id);
          await category.save();
        }
      }

      return product;
    },

    async updateProduct(_, { id, productInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const product = await Product.findById(id).populate('restaurant');
      if (!product) {
        throw new Error('Product not found');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: product.restaurant._id || product.restaurant,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Access denied');
      }

      if (productInput.title !== undefined) product.title = productInput.title;
      if (productInput.description !== undefined) product.description = productInput.description;
      if (productInput.image !== undefined) product.image = productInput.image;
      if (productInput.price !== undefined) product.price = productInput.price;
      if (productInput.discountedPrice !== undefined) product.discountedPrice = productInput.discountedPrice;
      if (productInput.subCategory !== undefined) product.subCategory = productInput.subCategory;
      if (productInput.isActive !== undefined) product.isActive = productInput.isActive;
      if (productInput.available !== undefined) product.available = productInput.available;
      if (productInput.isOutOfStock !== undefined) product.isOutOfStock = productInput.isOutOfStock;
      if (productInput.preparationTime !== undefined) product.preparationTime = productInput.preparationTime;
      if (productInput.variations !== undefined) product.variations = productInput.variations;
      if (productInput.addons !== undefined) product.addons = productInput.addons;

      await product.save();
      return product;
    },

    async deleteProduct(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const product = await Product.findById(id).populate('restaurant');
      if (!product) {
        throw new Error('Product not found');
      }

      const restaurant = await Restaurant.findOne({ 
        _id: product.restaurant._id || product.restaurant,
        owner: context.user._id 
      });

      if (!restaurant) {
        throw new Error('Access denied');
      }

      // Remove product from all categories
      await Category.updateMany(
        { foods: id },
        { $pull: { foods: id } }
      );

      await Product.findByIdAndDelete(id);
      return true;
    },

    // Rider management mutations (Admin app)
    async createRider(_, { riderInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Check if username or phone already exists
      const existingUser = await User.findOne({
        $or: [
          { 'metadata.username': riderInput.username },
          { phone: riderInput.phone }
        ]
      });

      if (existingUser) {
        throw new Error('Username or phone number already exists');
      }

      // Create new rider user
      const rider = new User({
        name: riderInput.name,
        password: riderInput.password,
        phone: riderInput.phone,
        role: 'rider',
        zone: riderInput.zone || null,
        isActive: true,
        metadata: {
          username: riderInput.username
        },
        riderProfile: {
          vehicleType: riderInput.vehicleType || null,
          available: riderInput.available !== undefined ? riderInput.available : true,
          location: { type: 'Point', coordinates: [0, 0] }
        }
      });

      await rider.save();
      return await User.findById(rider._id).populate('zone').lean();
    },

    async editRider(_, { riderInput }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (!riderInput._id) {
        throw new Error('Rider ID is required for editing');
      }

      const rider = await User.findById(riderInput._id);
      if (!rider) {
        throw new Error('Rider not found');
      }

      if (rider.role !== 'rider') {
        throw new Error('User is not a rider');
      }

      // Check if username or phone is being changed and already exists
      const currentUsername = rider.metadata?.username;
      if (riderInput.username && riderInput.username !== currentUsername) {
        const existingUser = await User.findOne({ 'metadata.username': riderInput.username });
        if (existingUser) {
          throw new Error('Username already exists');
        }
      }

      if (riderInput.phone && riderInput.phone !== rider.phone) {
        const existingUser = await User.findOne({ phone: riderInput.phone });
        if (existingUser) {
          throw new Error('Phone number already exists');
        }
      }

      // Update rider fields
      if (riderInput.name) rider.name = riderInput.name;
      if (riderInput.password) rider.password = riderInput.password;
      if (riderInput.phone) rider.phone = riderInput.phone;
      if (riderInput.zone !== undefined) rider.zone = riderInput.zone;
      
      // Update metadata.username
      if (riderInput.username) {
        if (!rider.metadata) {
          rider.metadata = {};
        }
        rider.metadata.username = riderInput.username;
      }
      
      // Update rider profile
      if (!rider.riderProfile) {
        rider.riderProfile = {};
      }
      if (riderInput.vehicleType !== undefined) {
        rider.riderProfile.vehicleType = riderInput.vehicleType;
      }
      if (riderInput.available !== undefined) {
        rider.riderProfile.available = riderInput.available;
      }

      await rider.save();
      return await User.findById(rider._id).populate('zone').lean();
    },

    async deleteRider(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const rider = await User.findById(id).populate('zone').lean();
      if (!rider) {
        throw new Error('Rider not found');
      }

      if (rider.role !== 'rider') {
        throw new Error('User is not a rider');
      }

      // Check if rider has any assigned orders
      const assignedOrders = await Order.countDocuments({
        rider: id,
        orderStatus: { $in: ['accepted', 'preparing', 'ready', 'picked', 'on_the_way'] }
      });

      if (assignedOrders > 0) {
        throw new Error('Cannot delete rider with active orders');
      }

      await User.findByIdAndDelete(id);
      return rider;
    },

    async toggleAvailablity(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const rider = await User.findById(id);
      if (!rider) {
        throw new Error('Rider not found');
      }

      if (rider.role !== 'rider') {
        throw new Error('User is not a rider');
      }

      // Toggle availability
      if (!rider.riderProfile) {
        rider.riderProfile = { available: true };
      }
      rider.riderProfile.available = !rider.riderProfile.available;

      await rider.save();
      return await User.findById(rider._id).populate('zone').lean();
    },

    // Admin app mutations
    async markWebNotificationsAsRead(_, __, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user._id.toString();
      
      // Placeholder - implement with actual Notification model
      // TODO: When Notification model is implemented:
      // await Notification.updateMany(
      //   { userId, isRead: false },
      //   { $set: { isRead: true } }
      // );
      // const notifications = await Notification.find({ userId })
      //   .sort({ createdAt: -1 })
      //   .lean();
      // return notifications.map(n => ({
      //   ...n,
      //   body: n.message,
      //   read: n.isRead,
      //   navigateTo: n.type === 'order' ? `/orders/${n.orderId}` : null
      // }));

      // Return empty array for now
      return [];
    }
  },

  Subscription: {
    subscriptionOrder: {
      subscribe: async function* (_, { id }) {
        // Get initial order state
        const initialOrder = await Order.findById(id)
          .populate('restaurant')
          .populate('customer')
          .populate('rider')
          .lean();

        if (initialOrder) {
          yield initialOrder;
        }

        // Register subscription and get channel
        const { channel, cleanup } = registerSubscription('orders', id);

        try {
          // Yield updates from channel
          while (true) {
            const result = await channel.next();
            if (result.done) break;
            yield result.value;
          }
        } finally {
          cleanup();
        }
      }
    },
    subscriptionRiderLocation: {
      subscribe: async function* (_, { riderId }) {
        // Get initial rider state
        const rider = await User.findById(riderId).lean();
        const initialLocation = rider?.riderProfile?.location || { type: 'Point', coordinates: [0, 0] };
        
        yield { _id: riderId, location: initialLocation };

        // Register subscription and get channel
        const { channel, cleanup } = registerSubscription('riderLocations', riderId);

        try {
          while (true) {
            const result = await channel.next();
            if (result.done) break;
            yield result.value;
          }
        } finally {
          cleanup();
        }
      }
    },
    orderStatusChanged: {
      subscribe: async function* (_, { userId }) {
        // Register subscription and get channel
        const { channel, cleanup } = registerSubscription('orderStatus', userId);

        try {
          while (true) {
            const result = await channel.next();
            if (result.done) break;
            yield result.value;
          }
        } finally {
          cleanup();
        }
      }
    },
    subscriptionNewMessage: {
      subscribe: async function* (_, { order }) {
        // Register subscription and get channel
        const { channel, cleanup } = registerSubscription('chatMessages', order);

        try {
          while (true) {
            const result = await channel.next();
            if (result.done) break;
            yield result.value;
          }
        } finally {
          cleanup();
        }
      }
    }
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

module.exports = resolvers;

