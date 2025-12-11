const express = require('express');
const { body } = require('express-validator');
const {
  getDashboardSummary,
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantAvailability,
  deleteRestaurant,
  getMaintenanceStatus,
  updateMaintenanceMode
} = require('../controllers/admin.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboardSummary);
router.get('/restaurants', getRestaurants);
router.get('/restaurants/:id', getRestaurant);

router.post(
  '/restaurants',
  [
    body('name').notEmpty().withMessage('Restaurant name is required'),
    body('owner').notEmpty().withMessage('Owner is required'),
    body('address').notEmpty().withMessage('Address is required')
  ],
  createRestaurant
);

router.put(
  '/restaurants/:id',
  [
    body('name').optional().isString(),
    body('address').optional().isString(),
    body('commissionRate').optional().isNumeric()
  ],
  updateRestaurant
);

router.post('/restaurants/:id/toggle', toggleRestaurantAvailability);
router.delete('/restaurants/:id', deleteRestaurant);

router.get('/maintenance', getMaintenanceStatus);
router.post(
  '/maintenance',
  [
    body('enabled')
      .exists()
      .withMessage('enabled is required')
      .isBoolean()
      .withMessage('enabled must be a boolean value')
      .toBoolean(),
    body('readOnly').optional().isBoolean().withMessage('readOnly must be a boolean value').toBoolean(),
    body('message').optional().isString().withMessage('message must be a string')
  ],
  updateMaintenanceMode
);

module.exports = router;

