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

const router = express.Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/admin', adminRoutes);
router.use('/seller', sellerRoutes);
router.use('/rider', riderRoutes);
router.use('/customer', customerRoutes);
router.use('/version', versionRoutes);
router.use('/payments', paymentsRoutes);
router.use('/privacy', privacyRoutes);

module.exports = router;

