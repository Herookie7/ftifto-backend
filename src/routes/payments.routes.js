const express = require('express');
const asyncHandler = require('express-async-handler');
const stripeService = require('../payments/stripe.service');

const router = express.Router();

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    await stripeService.handleWebhook(req, res);
  })
);

module.exports = router;


