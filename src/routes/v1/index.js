const express = require('express');

const healthRoutes = require('../health.routes');
const authRoutes = require('../auth.routes');
const userRoutes = require('../user.routes');
const orderRoutes = require('../order.routes');
const productRoutes = require('../product.routes');
const adminRoutes = require('../admin.routes');
const sellerRoutes = require('../seller.routes');
const riderRoutes = require('../rider.routes');
const customerRoutes = require('../customer.routes');
const versionRoutes = require('../version.routes');
const paymentsRoutes = require('../payments.routes');
const privacyRoutes = require('../privacy.routes');
const restaurantRoutes = require('../restaurantRoutes');
const categoryRoutes = require('../categoryRoutes');
const multivendorAuthRoutes = require('../authRoutes');
const addressRoutes = require('../addressRoutes');

const router = express.Router();

// Health check route - accessible at /api/v1/health
router.use('/', healthRoutes);

// Authentication routes - accessible at /api/v1/auth/*
router.use('/auth', authRoutes);

// User management routes - accessible at /api/v1/users/*
router.use('/users', userRoutes);

// Order routes - accessible at /api/v1/orders/*
router.use('/orders', orderRoutes);

// Product routes - accessible at /api/v1/products/*
router.use('/products', productRoutes);

// Admin routes - accessible at /api/v1/admin/*
router.use('/admin', adminRoutes);

// Seller routes - accessible at /api/v1/seller/*
router.use('/seller', sellerRoutes);

// Rider routes - accessible at /api/v1/rider/*
router.use('/rider', riderRoutes);

// Customer routes - accessible at /api/v1/customer/*
router.use('/customer', customerRoutes);

// Version route - accessible at /api/v1/version
router.use('/version', versionRoutes);

// Payment routes - accessible at /api/v1/payments/*
router.use('/payments', paymentsRoutes);

// Privacy routes - accessible at /api/v1/privacy/*
router.use('/privacy', privacyRoutes);

// Restaurant routes - accessible at /api/v1/restaurants/*
router.use('/', restaurantRoutes);

// Category routes - accessible at /api/v1/categories/*
router.use('/', categoryRoutes);

// Multivendor auth routes (legacy) - accessible at /api/v1/register, /api/v1/login
router.use('/', multivendorAuthRoutes);

// Address routes - accessible at /api/v1/address/*
router.use('/', addressRoutes);

module.exports = router;

