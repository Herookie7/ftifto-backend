const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignRider,
  getActiveOrders,
  getRestaurantOrders,
  captureOrderFeedback
} = require('../controllers/order.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const orderStatusList = ['pending', 'accepted', 'preparing', 'ready', 'picked', 'enroute', 'delivered', 'cancelled', 'refunded'];

router.use(protect);

router.get('/', authorizeRoles('admin', 'seller'), getOrders);
router.get('/active', authorizeRoles('admin', 'seller', 'rider'), getActiveOrders);
router.get('/restaurant/:restaurantId', authorizeRoles('admin', 'seller'), getRestaurantOrders);
router.get('/:id', authorizeRoles('admin', 'seller', 'rider', 'customer'), getOrderById);

router.post(
  '/',
  authorizeRoles('customer', 'admin'),
  [
    body('restaurant').notEmpty().withMessage('Restaurant is required'),
    body('items').isArray({ min: 1 }).withMessage('Order must include at least one item'),
    body('orderAmount').isNumeric().withMessage('orderAmount is required'),
    body('deliveryAddress.deliveryAddress').notEmpty().withMessage('Delivery address is required')
  ],
  createOrder
);

router.patch(
  '/:id/status',
  authorizeRoles('admin', 'seller', 'rider'),
  [body('status').isIn(orderStatusList).withMessage('Invalid order status')],
  updateOrderStatus
);

router.post(
  '/:id/assign',
  authorizeRoles('admin'),
  [body('riderId').notEmpty().withMessage('riderId is required')],
  assignRider
);

router.post(
  '/:id/review',
  authorizeRoles('customer'),
  [body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')],
  captureOrderFeedback
);

module.exports = router;

