const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryController');

router.get('/categories', controller.getCategories);
router.get('/categories/:id/products', controller.getCategoryProducts);

module.exports = router;

