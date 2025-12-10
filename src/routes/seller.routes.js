const express = require('express');
const { body } = require('express-validator');
const {
  getSellerProfile,
  getSellerOrders,
  updateSellerAvailability,
  updateOrderPreparationTime,
  getSellerMenu,
  bulkUpdateProductAvailability,
  updateRestaurant
} = require('../controllers/seller.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('seller'));

router.get('/profile', getSellerProfile);
router.get('/orders', getSellerOrders);
router.get('/menu', getSellerMenu);

router.put(
  '/restaurant',
  [
    body('name').optional().isString().trim(),
    body('address').optional().isString().trim(),
    body('phone').optional().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('description').optional().isString().trim(),
    body('image').optional().isString().trim(),
    body('logo').optional().isString().trim(),
    body('deliveryTime').optional().isInt({ min: 0 }),
    body('minimumOrder').optional().isFloat({ min: 0 }),
    body('deliveryCharges').optional().isFloat({ min: 0 }),
    body('location').optional().isArray({ min: 2, max: 2 }).withMessage('Location must be [longitude, latitude]')
  ],
  updateRestaurant
);

router.patch(
  '/availability',
  [body('isAvailable').isBoolean().withMessage('isAvailable must be boolean')],
  updateSellerAvailability
);

router.patch(
  '/orders/:id/preparation',
  [
    body('preparationTime').optional().isNumeric(),
    body('expectedTime').optional().isISO8601()
  ],
  updateOrderPreparationTime
);

router.patch(
  '/menu/availability',
  [
    body('productIds').isArray({ min: 1 }).withMessage('productIds must be an array'),
    body('available').isBoolean().withMessage('available must be boolean')
  ],
  bulkUpdateProductAvailability
);

module.exports = router;

