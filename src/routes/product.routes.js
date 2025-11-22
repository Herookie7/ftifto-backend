const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductAvailability
} = require('../controllers/product.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorizeRoles('admin', 'seller'), getProducts);

router.post(
  '/',
  authorizeRoles('admin', 'seller'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('price').isNumeric().withMessage('Price must be numeric'),
    body('restaurant').notEmpty().withMessage('Restaurant reference is required')
  ],
  createProduct
);

router.put(
  '/:id',
  authorizeRoles('admin', 'seller'),
  [
    body('title').optional().isString(),
    body('price').optional().isNumeric(),
    body('discountedPrice').optional().isNumeric()
  ],
  updateProduct
);

router.delete('/:id', authorizeRoles('admin', 'seller'), deleteProduct);

router.patch(
  '/:id/availability',
  authorizeRoles('admin', 'seller'),
  [body('available').isBoolean().withMessage('available must be boolean')],
  updateProductAvailability
);

module.exports = router;

