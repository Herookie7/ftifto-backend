const express = require('express');
const asyncHandler = require('express-async-handler');
const stripeService = require('../payments/stripe.service');

const razorpayService = require('../payments/razorpay.service');

const router = express.Router();

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    // Check which service the webhook belongs to based on headers or logic
    // For now, if it has Razorpay signature, route to Razorpay service
    if (req.headers['x-razorpay-signature']) {
      await razorpayService.handleWebhook(req, res);
    } else {
      // Default to Stripe or add more logic as needed
      await stripeService.handleWebhook(req, res);
    }
  })
);

module.exports = router;


