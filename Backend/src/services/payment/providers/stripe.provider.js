import Stripe from 'stripe';
import { AppError } from '../../../utils/AppError.js';

const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const toSmallestUnit = (amount, currency = 'USD') => {
  const zeroDecimalCurrencies = new Set(['JPY', 'KRW']);
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

export const stripeProvider = {
  gateway: 'stripe',

  async initialize({ amount, currency, metadata = {} }) {
    if (!stripeClient) {
      throw new AppError('Stripe is not configured', 500);
    }

    const intent = await stripeClient.paymentIntents.create({
      amount: toSmallestUnit(amount, currency),
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return {
      reference: intent.id,
      status: intent.status,
      raw: intent,
      nextAction: {
        clientSecret: intent.client_secret,
      },
    };
  },

  async verify({ reference }) {
    if (!stripeClient) {
      throw new AppError('Stripe is not configured', 500);
    }

    const intent = await stripeClient.paymentIntents.retrieve(reference);

    const successful = intent.status === 'succeeded';

    return {
      reference: intent.id,
      status: successful ? 'successful' : 'failed',
      amount: intent.amount_received ? intent.amount_received / 100 : 0,
      currency: intent.currency?.toUpperCase() || 'USD',
      raw: intent,
    };
  },

  async verifyWebhook({ payload, signature }) {
    if (!stripeClient) {
      throw new AppError('Stripe is not configured', 500);
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError('Stripe webhook secret is not configured', 500);
    }

    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type !== 'payment_intent.succeeded') {
      return null;
    }

    const intent = event.data.object;

    return {
      reference: intent.id,
      status: 'successful',
      amount: intent.amount_received ? intent.amount_received / 100 : 0,
      currency: intent.currency?.toUpperCase() || 'USD',
      raw: event,
      orderId: intent.metadata?.orderId,
    };
  },
};
