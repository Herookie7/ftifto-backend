const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const maintenanceService = require('../services/maintenance.service');
const auditLogger = require('../services/auditLogger');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [orderStats, userStats, activeRestaurants] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$orderAmount' },
          paidAmount: { $sum: '$paidAmount' }
        }
      }
    ]),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]),
    Restaurant.countDocuments({ isActive: true })
  ]);

  res.json({
    orders: orderStats,
    users: userStats,
    activeRestaurants
  });
});

const getRestaurants = asyncHandler(async (req, res) => {
  const { search, isActive, isAvailable } = req.query;

  const filters = {};

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  if (typeof isActive !== 'undefined') {
    filters.isActive = isActive === 'true';
  }

  if (typeof isAvailable !== 'undefined') {
    filters.isAvailable = isAvailable === 'true';
  }

  const restaurants = await Restaurant.find(filters)
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });

  res.json(restaurants);
});

const createRestaurant = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { owner: ownerId } = req.body;

  const owner = await User.findById(ownerId);
  if (!owner || owner.role !== 'seller') {
    res.status(400);
    throw new Error('Restaurant owner must be a seller');
  }

  const restaurant = await Restaurant.create(req.body);

  owner.sellerProfile = {
    ...owner.sellerProfile,
    restaurant: restaurant._id,
    businessName: restaurant.name
  };

  await owner.save();

  res.status(201).json(restaurant);
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant not found');
  }

  Object.assign(restaurant, req.body);

  await restaurant.save();

  res.json(restaurant);
});

const toggleRestaurantAvailability = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant not found');
  }

  restaurant.isAvailable = !restaurant.isAvailable;
  await restaurant.save();

  res.json(restaurant);
});

const getMaintenanceStatus = asyncHandler(async (req, res) => {
  const state = await maintenanceService.getState();
  res.json(state);
});

const updateMaintenanceMode = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { enabled, message, readOnly } = req.body;

  const state = await maintenanceService.toggleMaintenance({
    enabled,
    message,
    readOnly,
    updatedBy: req.user ? { id: req.user._id.toString(), email: req.user.email } : null
  });

  auditLogger.logEvent({
    category: 'admin',
    action: enabled ? 'maintenance_enabled' : 'maintenance_disabled',
    userId: req.user?._id ? req.user._id.toString() : undefined,
    entityType: 'maintenance',
    entityId: 'maintenance-flag',
    metadata: {
      readOnly: state.readOnly,
      message: state.message
    }
  });

  res.json(state);
});

module.exports = {
  getDashboardSummary,
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantAvailability,
  getMaintenanceStatus,
  updateMaintenanceMode
};

