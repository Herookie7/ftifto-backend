const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const { emitOrderUpdate } = require('../realtime/emitter');

const getSellerProfile = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant profile not found');
  }

  const activeOrders = await Order.countDocuments({
    restaurant: restaurant._id,
    orderStatus: { $in: ['pending', 'accepted', 'preparing', 'ready'] }
  });

  res.json({
    restaurant,
    metrics: {
      activeOrders
    }
  });
});

const getSellerOrders = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant profile not found');
  }

  const { status } = req.query;

  const filters = {
    restaurant: restaurant._id
  };

  if (status) {
    filters.orderStatus = status;
  }

  const orders = await Order.find(filters)
    .populate('customer', 'name phone')
    .populate('rider', 'name username riderProfile.available')
    .sort({ createdAt: -1 });

  res.json(orders);
});

const updateSellerAvailability = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant profile not found');
  }

  restaurant.isAvailable = req.body.isAvailable;
  await restaurant.save();

  res.json(restaurant);
});

const updateOrderPreparationTime = asyncHandler(async (req, res) => {
  const { preparationTime, expectedTime } = req.body;

  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant profile not found');
  }

  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: restaurant._id
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.preparationTime = preparationTime;
  order.expectedTime = expectedTime;
  order.timeline.push({
    status: 'preparing',
    note: 'Preparation time updated by seller',
    updatedBy: req.user._id
  });

  await order.save();

  emitOrderUpdate(order._id.toString(), {
    action: 'preparation-updated',
    preparationTime,
    expectedTime,
    order
  });

  res.json(order);
});

const getSellerMenu = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant profile not found');
  }

  const products = await Product.find({ restaurant: restaurant._id }).sort({ title: 1 });

  res.json(products);
});

const bulkUpdateProductAvailability = asyncHandler(async (req, res) => {
  const { productIds = [], available } = req.body;

  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant profile not found');
  }

  await Product.updateMany(
    {
      _id: { $in: productIds },
      restaurant: restaurant._id
    },
    {
      $set: { available }
    }
  );

  res.json({ message: 'Menu availability updated' });
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant profile not found');
  }

  // Update allowed fields
  const allowedFields = [
    'name', 'address', 'phone', 'email', 'description', 'image', 'logo',
    'deliveryTime', 'minimumOrder', 'deliveryCharges'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      restaurant[field] = req.body[field];
    }
  });

  // Handle location coordinates
  if (req.body.location !== undefined) {
    if (Array.isArray(req.body.location) && req.body.location.length === 2) {
      const [longitude, latitude] = req.body.location;
      // Validate coordinates
      if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
        restaurant.location = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };
      } else {
        res.status(400);
        throw new Error('Invalid coordinates. Longitude must be between -180 and 180, latitude must be between -90 and 90');
      }
    } else {
      res.status(400);
      throw new Error('Location must be an array of [longitude, latitude]');
    }
  }

  await restaurant.save();

  res.json({
    success: true,
    message: 'Restaurant updated successfully',
    restaurant
  });
});

module.exports = {
  getSellerProfile,
  getSellerOrders,
  updateSellerAvailability,
  updateOrderPreparationTime,
  getSellerMenu,
  bulkUpdateProductAvailability,
  updateRestaurant
};

