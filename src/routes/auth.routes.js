const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { strictRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/register',
  strictRateLimiter, // Apply strict rate limiting to registration
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
  strictRateLimiter, // Apply strict rate limiting to login
  [
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  loginUser
);

router.get('/me', protect, getCurrentUser);

module.exports = router;

