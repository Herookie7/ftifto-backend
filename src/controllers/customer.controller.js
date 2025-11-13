const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Order = require('../models/Order');

const getCustomerProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const getCustomerOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filters = {
    customer: req.user._id
  };

  if (status) {
    filters.orderStatus = status;
  }

  const orders = await Order.find(filters)
    .populate('restaurant', 'name image address deliveryTime')
    .sort({ createdAt: -1 });

  res.json(orders);
});

const getRestaurantMenu = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant not found');
  }

  const products = await Product.find({
    restaurant: restaurant._id,
    isActive: true,
    available: true
  }).sort({ title: 1 });

  res.json({
    restaurant,
    products
  });
});

const browseRestaurants = asyncHandler(async (req, res) => {
  const { search, cuisine, available } = req.query;

  const filters = {
    isActive: true
  };

  if (available) {
    filters.isAvailable = available === 'true';
  }

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  if (cuisine) {
    filters.cuisines = { $in: cuisine.split(',') };
  }

  const restaurants = await Restaurant.find(filters)
    .limit(50)
    .sort({ rating: -1, createdAt: -1 });

  res.json(restaurants);
});

const saveAddress = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  req.user.addressBook = req.user.addressBook || [];
  req.user.addressBook.push(req.body);

  await req.user.save();

  res.status(201).json(req.user.addressBook);
});

module.exports = {
  getCustomerProfile,
  getCustomerOrders,
  getRestaurantMenu,
  browseRestaurants,
  saveAddress
};

