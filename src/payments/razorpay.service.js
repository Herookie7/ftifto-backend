const Razorpay = require('razorpay');
const crypto = require('crypto');
const Configuration = require('../models/Configuration');
const logger = require('../logger');
const auditLogger = require('../services/auditLogger');

let razorpayClient;

const getRazorpayConfig = async () => {
  const configDoc = await Configuration.getConfiguration();
  return {
    keyId: configDoc.razorpayKeyId,
    keySecret: configDoc.razorpayKeySecret,
    sandbox: configDoc.razorpaySandbox || false
  };
};

const isConfigured = async () => {
  const config = await getRazorpayConfig();
  return Boolean(config.keyId && config.keySecret);
};

const getRazorpayClient = async () => {
  if (!(await isConfigured())) {
    throw new Error('Razorpay keys are not configured. Please configure Razorpay Key ID and Key Secret.');
  }

  if (!razorpayClient) {
    const config = await getRazorpayConfig();
    razorpayClient = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret
    });
  }

  return razorpayClient;
};

const toMinorUnits = (amount) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new Error('Amount must be a number');
  }
  // Razorpay uses paise (smallest currency unit), so multiply by 100 for INR
  return Math.round(amount * 100);
};

/**
 * Create a Razorpay order
 * @param {String} orderId - Internal order ID for reference
 * @param {Number} amount - Amount in major currency units (e.g., INR)
 * @param {String} currency - Currency code (default: 'INR')
 * @param {Object} options - Additional options (receipt, notes, etc.)
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (orderId, amount, currency = 'INR', options = {}) => {
  const razorpay = await getRazorpayClient();
  const amountInPaise = toMinorUnits(amount);

  const orderOptions = {
    amount: amountInPaise,
    currency: currency.toUpperCase(),
    receipt: options.receipt || `receipt_${orderId}_${Date.now()}`,
    notes: {
      orderId: orderId.toString(),
      ...options.notes
    },
    ...options
  };

  try {
    const order = await razorpay.orders.create(orderOptions);

    logger.info('Razorpay order created', {
      orderId,
      razorpayOrderId: order.id,
      amount,
      currency
    });

    auditLogger.logEvent({
      category: 'payments',
      action: 'razorpay_order_created',
      userId: orderId,
      entityId: order.id,
      entityType: 'razorpay_order',
      metadata: {
        amount,
        currency,
        receipt: orderOptions.receipt
      }
    });

    return order;
  } catch (error) {
    logger.error('Razorpay order creation failed', {
      orderId,
      error: error.message,
      errorCode: error.error?.code,
      errorDescription: error.error?.description
    });
    throw error;
  }
};

/**
 * Verify Razorpay payment signature
 * @param {String} razorpayOrderId - Razorpay order ID
 * @param {String} razorpayPaymentId - Razorpay payment ID
 * @param {String} razorpaySignature - Razorpay signature
 * @returns {Boolean} True if signature is valid
 */
const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const config = await getRazorpayConfig();
  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', config.keySecret)
    .update(text)
    .digest('hex');

  const isValid = expectedSignature === razorpaySignature;

  if (isValid) {
    logger.info('Razorpay payment signature verified', {
      razorpayOrderId,
      razorpayPaymentId
    });

    auditLogger.logEvent({
      category: 'payments',
      action: 'razorpay_payment_verified',
      entityId: razorpayPaymentId,
      entityType: 'razorpay_payment',
      metadata: {
        razorpayOrderId
      }
    });
  } else {
    logger.warn('Razorpay payment signature verification failed', {
      razorpayOrderId,
      razorpayPaymentId
    });

    auditLogger.logEvent({
      category: 'payments',
      action: 'razorpay_payment_verification_failed',
      severity: 'warn',
      entityId: razorpayPaymentId,
      entityType: 'razorpay_payment',
      metadata: {
        razorpayOrderId
      }
    });
  }

  return isValid;
};

/**
 * Handle Razorpay webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleWebhook = async (req, res) => {
  if (!(await isConfigured())) {
    logger.warn('Received Razorpay webhook but Razorpay is not configured');
    return res.status(503).json({ status: 'maintenance', message: 'Razorpay webhook not configured' });
  }

  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookBody = JSON.stringify(req.body);

  if (!webhookSignature) {
    return res.status(400).send('Missing X-Razorpay-Signature header');
  }

  const config = await getRazorpayConfig();
  const expectedSignature = crypto
    .createHmac('sha256', config.keySecret)
    .update(webhookBody)
    .digest('hex');

  if (expectedSignature !== webhookSignature) {
    logger.error('Razorpay webhook signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    switch (event) {
      case 'payment.captured':
        auditLogger.logEvent({
          category: 'payments',
          action: 'razorpay_payment_captured',
          entityId: payload.payment?.entity?.id,
          entityType: 'razorpay_payment',
          metadata: {
            orderId: payload.payment?.entity?.notes?.orderId,
            amount: payload.payment?.entity?.amount,
            currency: payload.payment?.entity?.currency
          }
        });
        logger.info('Payment captured', {
          paymentId: payload.payment?.entity?.id,
          orderId: payload.payment?.entity?.notes?.orderId
        });
        break;

      case 'payment.failed':
        auditLogger.logEvent({
          category: 'payments',
          action: 'razorpay_payment_failed',
          severity: 'warn',
          entityId: payload.payment?.entity?.id,
          entityType: 'razorpay_payment',
          metadata: {
            orderId: payload.payment?.entity?.notes?.orderId,
            errorCode: payload.payment?.entity?.error_code,
            errorDescription: payload.payment?.entity?.error_description
          }
        });
        logger.warn('Payment failed', {
          paymentId: payload.payment?.entity?.id,
          orderId: payload.payment?.entity?.notes?.orderId,
          errorCode: payload.payment?.entity?.error_code
        });
        break;

      case 'order.paid':
        auditLogger.logEvent({
          category: 'payments',
          action: 'razorpay_order_paid',
          entityId: payload.order?.entity?.id,
          entityType: 'razorpay_order',
          metadata: {
            orderId: payload.order?.entity?.notes?.orderId,
            amount: payload.order?.entity?.amount
          }
        });
        logger.info('Order paid', {
          razorpayOrderId: payload.order?.entity?.id,
          orderId: payload.order?.entity?.notes?.orderId
        });
        break;

      default:
        logger.debug('Unhandled Razorpay webhook event', { event });
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error('Error processing Razorpay webhook', { error: error.message, event });
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const fetchPayment = async (paymentId) => {
  const razorpay = await getRazorpayClient();
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error('Error fetching Razorpay payment', {
      paymentId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Fetch order details from Razorpay
 * @param {String} orderId - Razorpay order ID
 * @returns {Promise<Object>} Order details
 */
const fetchOrder = async (orderId) => {
  const razorpay = await getRazorpayClient();
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    logger.error('Error fetching Razorpay order', {
      orderId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  fetchPayment,
  fetchOrder,
  isConfigured,
  getRazorpayConfig
};
