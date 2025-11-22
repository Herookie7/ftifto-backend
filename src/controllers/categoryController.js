const Category = require('../models/Category');
const Product = require('../models/Product');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.json({ status: 'success', data: categories });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getCategoryProducts = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('foods');
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    return res.json({ status: 'success', data: category.foods || [] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

