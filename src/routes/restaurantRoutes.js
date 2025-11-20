const express = require('express');
const router = express.Router();
const controller = require('../controllers/restaurantController');

router.get('/restaurants', controller.getRestaurants);
router.get('/restaurants/:id', controller.getRestaurant);
router.get('/restaurants/:id/products', controller.getProductsByRestaurant);

module.exports = router;

