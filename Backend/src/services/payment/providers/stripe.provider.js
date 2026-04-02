import Stripe from 'stripe';
import { AppError } from '../../../utils/AppError.js';

const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    })
  : null;
const webhookTolerance = Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || 300);

const toSmallestUnit = (amount, currency = 'USD') => {
  const zeroDecimalCurrencies = new Set(['JPY', 'KRW']);
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

const mapStripeStatus = (status) => {
  if (status === 'succeeded') return 'successful';
  if (['processing', 'requires_capture'].includes(status)) return 'pending';
  if (['canceled', 'requires_payment_method'].includes(status)) return 'failed';
  return 'pending';
};

const fromSmallestUnit = (amount, currency = 'USD') => {
  const zeroDecimalCurrencies = new Set(['JPY', 'KRW']);
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) {
    return Number(amount || 0);
  }

  return Number(amount || 0) / 100;
};

export const stripeProvider = {
  gateway: 'stripe',

  async initialize({ amount, currency, email, metadata = {} }, { idempotencyKey } = {}) {
    if (!stripeClient) {
      throw new AppError('Stripe is not configured', 500);
    }

    const intent = await stripeClient.paymentIntents.create(
      {
        amount: toSmallestUnit(amount, currency),
        currency: currency.toLowerCase(),
        metadata,
        receipt_email: email,
        description: metadata?.cartId
          ? `Marketplace checkout for cart ${metadata.cartId}`
          : 'Marketplace checkout',
        automatic_payment_methods: { enabled: true },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

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

    return {
      reference: intent.id,
      status: mapStripeStatus(intent.status),
      amount: fromSmallestUnit(intent.amount, intent.currency),
      currency: intent.currency?.toUpperCase() || 'USD',
      raw: intent,
      cartId: intent.metadata?.cartId || '',
      userId: intent.metadata?.userId || '',
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
      process.env.STRIPE_WEBHOOK_SECRET,
      webhookTolerance
    );

    if (
      ![
        'payment_intent.succeeded',
        'payment_intent.processing',
        'payment_intent.payment_failed',
        'payment_intent.canceled',
        'charge.refunded',
      ].includes(event.type)
    ) {
      return null;
    }

    const resource = event.data.object;
    const intent =
      event.type === 'charge.refunded'
        ? resource.payment_intent
          ? await stripeClient.paymentIntents.retrieve(resource.payment_intent)
          : null
        : resource;

    if (!intent?.id) {
      return null;
    }

    return {
      reference: intent.id,
      status:
        event.type === 'payment_intent.succeeded'
          ? 'successful'
          : event.type === 'payment_intent.processing'
            ? 'pending'
          : event.type === 'charge.refunded'
            ? 'refunded'
            : 'failed',
      amount: fromSmallestUnit(intent.amount, intent.currency),
      currency: intent.currency?.toUpperCase() || 'USD',
      raw: event,
      cartId: intent.metadata?.cartId || '',
      userId: intent.metadata?.userId || '',
    };
  },
};
