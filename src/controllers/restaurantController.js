const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().limit(20);
    return res.json({ status: 'success', data: restaurants });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ status: 'error', message: 'Restaurant not found' });
    }
    return res.json({ status: 'success', data: restaurant });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getProductsByRestaurant = async (req, res) => {
  try {
    const products = await Product.find({ restaurant: req.params.id });
    return res.json({ status: 'success', data: products });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

