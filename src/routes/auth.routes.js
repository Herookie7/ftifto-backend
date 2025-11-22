const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['customer', 'seller', 'rider', 'admin'])
      .withMessage('Role must be one of customer, seller, rider, admin')
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  loginUser
);

router.get('/me', protect, getCurrentUser);

module.exports = router;

