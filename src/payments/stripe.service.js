const Stripe = require('stripe');
const config = require('../config');
const logger = require('../logger');
const auditLogger = require('../services/auditLogger');

let stripeClient;

const isConfigured = () => Boolean(config.payments?.stripe?.secretKey);

const getStripeClient = () => {
  if (!isConfigured()) {
    throw new Error('Stripe secret key is not configured. Set STRIPE_SECRET_KEY to enable payments.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(config.payments.stripe.secretKey, {
      apiVersion: '2023-10-16'
    });
  }

  return stripeClient;
};

const toMinorUnits = (amount) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new Error('Amount must be a number');
  }
  return Math.round(amount * 100);
};

const createPaymentIntent = async (orderId, amount, currency = config.payments.stripe.defaultCurrency || 'usd') => {
  const stripe = getStripeClient();
  const minorAmount = toMinorUnits(amount);

  const intent = await stripe.paymentIntents.create({
    amount: minorAmount,
    currency,
    metadata: {
      orderId
    },
    automatic_payment_methods: {
      enabled: true
    }
  });

  logger.info('Stripe payment intent created', {
    orderId,
    paymentIntentId: intent.id,
    currency
  });

  auditLogger.logEvent({
    category: 'payments',
    action: 'intent_created',
    userId: orderId,
    entityId: intent.id,
    entityType: 'payment_intent',
    metadata: {
      amount,
      currency
    }
  });

  return intent;
};

const handleWebhook = async (req, res) => {
  if (!isConfigured() || !config.payments.stripe.webhookSecret) {
    logger.warn('Received Stripe webhook but STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(503).json({ status: 'maintenance', message: 'Stripe webhook not configured' });
  }

  const stripe = getStripeClient();
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).send('Missing Stripe-Signature header');
  }

  const rawBody =
    req.rawBody ||
    (typeof req.body === 'string' ? req.body : Buffer.from(JSON.stringify(req.body || {})));

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.payments.stripe.webhookSecret);
  } catch (error) {
    logger.error('Stripe webhook signature verification failed', { error: error.message });
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      auditLogger.logEvent({
        category: 'payments',
        action: 'intent_succeeded',
        entityId: event.data.object.id,
        entityType: 'payment_intent',
        metadata: {
          orderId: event.data.object.metadata?.orderId,
          amountReceived: event.data.object.amount_received,
          currency: event.data.object.currency
        }
      });
      logger.info('Payment intent succeeded', {
        paymentIntentId: event.data.object.id,
        orderId: event.data.object.metadata?.orderId
      });
      break;
    case 'payment_intent.payment_failed':
      auditLogger.logEvent({
        category: 'payments',
        action: 'intent_failed',
        severity: 'warn',
        entityId: event.data.object.id,
        entityType: 'payment_intent',
        metadata: {
          orderId: event.data.object.metadata?.orderId,
          failureReason: event.data.object.last_payment_error?.message
        }
      });
      logger.warn('Payment intent failed', {
        paymentIntentId: event.data.object.id,
        orderId: event.data.object.metadata?.orderId,
        failureReason: event.data.object.last_payment_error?.message
      });
      break;
    default:
      logger.debug?.('Unhandled Stripe webhook event', { type: event.type });
  }

  return res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  isConfigured
};


