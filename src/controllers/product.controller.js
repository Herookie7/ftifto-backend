const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');

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

  // Add product to categories if provided
  if (productData.categories && Array.isArray(productData.categories) && productData.categories.length > 0) {
    for (const categoryId of productData.categories) {
      if (!categoryId) continue; // Skip empty category IDs
      const category = await Category.findById(categoryId);
      if (category && category.restaurant.toString() === restaurantId.toString()) {
        // Only add if not already in the array
        if (!category.foods.includes(product._id)) {
          category.foods.push(product._id);
          await category.save();
        }
      }
    }
  }

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

  const oldCategories = product.categories || [];
  Object.assign(product, req.body);
  await product.save();

  // Update category relationships if categories changed
  if (req.body.categories !== undefined) {
    const newCategories = Array.isArray(req.body.categories) ? req.body.categories : [];
    
    // Remove product from old categories
    const categoriesToRemove = oldCategories.filter(catId => !newCategories.includes(catId.toString()));
    for (const categoryId of categoriesToRemove) {
      await Category.updateOne(
        { _id: categoryId },
        { $pull: { foods: product._id } }
      );
    }

    // Add product to new categories
    for (const categoryId of newCategories) {
      if (!categoryId) continue; // Skip empty category IDs
      const category = await Category.findById(categoryId);
      if (category && category.restaurant.toString() === product.restaurant.toString()) {
        // Only add if not already in the array
        if (!category.foods.includes(product._id)) {
          category.foods.push(product._id);
          await category.save();
        }
      }
    }
  }

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

