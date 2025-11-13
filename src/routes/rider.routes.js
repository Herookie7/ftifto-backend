const express = require('express');
const { body } = require('express-validator');
const {
  getAssignedOrders,
  updateRiderStatus,
  updateRiderLocation,
  confirmPickup,
  confirmDelivery
} = require('../controllers/rider.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('rider'));

router.get('/orders', getAssignedOrders);

router.patch(
  '/status',
  [body('available').isBoolean().withMessage('available must be boolean')],
  updateRiderStatus
);

router.patch(
  '/location',
  [body('coordinates').isArray({ min: 2, max: 2 }).withMessage('coordinates must be [lng, lat]')],
  updateRiderLocation
);

router.post('/orders/:id/pickup', confirmPickup);
router.post('/orders/:id/deliver', confirmDelivery);

module.exports = router;

