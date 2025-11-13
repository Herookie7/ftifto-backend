const mockCreateIntent = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockCreateIntent
    },
    webhooks: {
      constructEvent: mockConstructEvent
    }
  }))
);

describe('Stripe payments service', () => {
  let stripeService;

  beforeEach(() => {
    mockCreateIntent.mockReset();
    mockConstructEvent.mockReset();
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_example';
    stripeService = require('../src/payments/stripe.service'); // eslint-disable-line global-require
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('creates a payment intent and returns Stripe response', async () => {
    mockCreateIntent.mockResolvedValue({
      id: 'pi_test',
      client_secret: 'secret',
      metadata: { orderId: 'order123' }
    });

    const intent = await stripeService.createPaymentIntent('order123', 12.34, 'usd');

    expect(mockCreateIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1234,
        currency: 'usd',
        metadata: { orderId: 'order123' }
      })
    );
    expect(intent.id).toBe('pi_test');
  });

  it('handles webhook events and returns acknowledgement', async () => {
    const eventPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test',
          metadata: { orderId: 'order123' }
        }
      }
    };

    mockConstructEvent.mockReturnValue(eventPayload);

    const req = {
      headers: { 'stripe-signature': 'signature' },
      rawBody: Buffer.from(JSON.stringify({ id: 'evt_test' }))
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    await stripeService.handleWebhook(req, res);

    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(res.status).not.toHaveBeenCalledWith(expect.any(Number));
  });
});


