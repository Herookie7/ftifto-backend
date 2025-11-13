const express = require('express');
const { body } = require('express-validator');
const {
  getCustomerProfile,
  getCustomerOrders,
  getRestaurantMenu,
  browseRestaurants,
  saveAddress
} = require('../controllers/customer.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('customer'));

router.get('/profile', getCustomerProfile);
router.get('/orders', getCustomerOrders);
router.get('/restaurants', browseRestaurants);
router.get('/restaurants/:restaurantId/menu', getRestaurantMenu);

router.post(
  '/addresses',
  [
    body('label').optional().isString(),
    body('street').notEmpty().withMessage('Street is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('coordinates').optional().isArray({ min: 2, max: 2 })
  ],
  saveAddress
);

module.exports = router;

