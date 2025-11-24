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

      if (!restaurant) return null;

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

    // Recent order restaurants
    async recentOrderRestaurants() {
      // This would typically filter by current user's recent orders
      // For now, return recently active restaurants
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
        .sort({ updatedAt: -1 })
        .limit(10);

      return restaurants;
    },

    // Recent order restaurants preview
    async recentOrderRestaurantsPreview(_, { latitude, longitude }) {
      // This would typically filter by current user's recent orders
      // For now, return recently active restaurants
      const restaurants = await Restaurant.find({ isActive: true, isAvailable: true })
        .lean()
        .sort({ updatedAt: -1 })
        .limit(10);

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
      return await Zone.find({ isActive: true }).lean();
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
    }
  },

  Order: {
    user: (parent) => parent.customer
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
      const config = await Configuration.getConfiguration();
      config.customerAppVersion = customerAppVersion;
      await config.save();
      return 'success';
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

