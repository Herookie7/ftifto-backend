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
const { signToken } = require('../utils/token');
const config = require('../config');
const generateOrderId = require('../utils/generateOrderId');
const { emitOrderUpdate } = require('../realtime/emitter');
const auditLogger = require('../services/auditLogger');
const { registerSubscription } = require('./subscriptionBridge');

const resolvers = {
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

        user = await User.findOne({
          $or: [{ email }, { phone: email }]
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

    async abortOrder(_, { id }, context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const order = await Order.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify ownership
      if (order.customer?.toString() !== context.user._id.toString()) {
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
      // Placeholder for coupon lookup
      // In production, implement actual coupon model and validation
      return {
        _id: coupon,
        title: coupon,
        discount: 0,
        enabled: false
      };
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

