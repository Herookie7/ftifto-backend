const express = require('express');
const { body } = require('express-validator');
const {
  getSellerProfile,
  getSellerOrders,
  updateSellerAvailability,
  updateOrderPreparationTime,
  getSellerMenu,
  bulkUpdateProductAvailability
} = require('../controllers/seller.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('seller'));

router.get('/profile', getSellerProfile);
router.get('/orders', getSellerOrders);
router.get('/menu', getSellerMenu);

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

