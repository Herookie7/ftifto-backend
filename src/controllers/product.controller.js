const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');

const getProducts = asyncHandler(async (req, res) => {
  const { restaurant, search, isActive, page = 1, limit = 25 } = req.query;

  const filters = {};

  if (restaurant) {
    filters.restaurant = restaurant;
  }

  if (typeof isActive !== 'undefined') {
    filters.isActive = isActive === 'true';
  }

  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filters)
      .populate('restaurant', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Product.countDocuments(filters)
  ]);

  res.json({
    total,
    page: Number(page),
    limit: Number(limit),
    results: products
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { restaurant: restaurantId, price, title, variations } = req.body;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant not found');
  }

  // Auto-create default variation if none provided
  let productData = { ...req.body };
  if (!variations || variations.length === 0) {
    const slug = title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'item';
    productData.variations = [{
      title: 'Standard',
      price: price || 0,
      discounted: req.body.discountedPrice || undefined,
      default: true,
      sku: `${slug}-std`
    }];
  } else {
    // Ensure at least one variation is marked as default
    const hasDefault = variations.some(v => v.default === true);
    if (!hasDefault && variations.length > 0) {
      productData.variations[0].default = true;
    }
  }

  const product = await Product.create(productData);

  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  Object.assign(product, req.body);

  await product.save();

  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.remove();

  res.json({ message: 'Product deleted successfully' });
});

const updateProductAvailability = asyncHandler(async (req, res) => {
  const { available } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.available = available;
  await product.save();

  res.json(product);
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductAvailability
};

