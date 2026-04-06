import Stripe from 'stripe';
import { AppError } from '../../../utils/AppError.js';
import {
  createPaymentReference,
  withRetry,
} from '../payment.helpers.js';
import { TRANSACTION_STATUS } from '../payment.constants.js';

let cachedSecretKey = '';
let cachedApiVersion = '';
let cachedClient = null;
const DEFAULT_STRIPE_API_VERSION = '2026-02-25.clover';

const getStripeClient = () => {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  const apiVersion = String(
    process.env.STRIPE_API_VERSION || DEFAULT_STRIPE_API_VERSION
  ).trim();

  if (!secretKey) {
    return null;
  }

  if (
    cachedClient &&
    cachedSecretKey === secretKey &&
    cachedApiVersion === apiVersion
  ) {
    return cachedClient;
  }

  cachedSecretKey = secretKey;
  cachedApiVersion = apiVersion;
  cachedClient = new Stripe(secretKey, {
    ...(apiVersion ? { apiVersion } : {}),
  });

  return cachedClient;
};

const toSmallestUnit = (amount, currency = 'USD') => {
  const zeroDecimalCurrencies = new Set(['JPY', 'KRW']);
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

const mapStripeStatus = (status) => {
  if (status === 'succeeded') return TRANSACTION_STATUS.SUCCESSFUL;
  if (status === 'refunded') return TRANSACTION_STATUS.REFUNDED;
  if (
    ['processing', 'requires_action', 'requires_confirmation', 'requires_capture'].includes(
      status
    )
  ) {
    return TRANSACTION_STATUS.PENDING;
  }

  if (['canceled', 'requires_payment_method'].includes(status)) {
    return TRANSACTION_STATUS.FAILED;
  }

  return TRANSACTION_STATUS.PENDING;
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
    const stripeClient = getStripeClient();

    if (!stripeClient) {
      throw new AppError('Stripe is not configured', 500);
    }

    const reference = metadata?.reference || createPaymentReference('pi');
    const intent = await withRetry({
      gateway: 'stripe',
      operation: 'initialize',
      reference,
      fn: () =>
        stripeClient.paymentIntents.create(
          {
            amount: toSmallestUnit(amount, currency),
            currency: currency.toLowerCase(),
            metadata: {
              ...metadata,
              reference,
            },
            receipt_email: email,
            description: metadata?.cartId
              ? `Marketplace checkout for cart ${metadata.cartId}`
              : 'Marketplace checkout',
            automatic_payment_methods: { enabled: true },
          },
          idempotencyKey ? { idempotencyKey } : undefined
        ),
    });

    return {
      reference: intent.id,
      status: mapStripeStatus(intent.status),
      amount,
      currency,
      raw: intent,
      nextAction: {
        type: 'embedded',
        clientSecret: intent.client_secret,
      },
    };
  },

  async verify({ reference }) {
    const stripeClient = getStripeClient();

    if (!stripeClient) {
      throw new AppError('Stripe is not configured', 500);
    }

    const intent = await withRetry({
      gateway: 'stripe',
      operation: 'verify',
      reference,
      fn: () => stripeClient.paymentIntents.retrieve(reference),
    });

    return {
      reference: intent.id,
      status: mapStripeStatus(intent.status),
      providerStatus: intent.status,
      amount: fromSmallestUnit(intent.amount, intent.currency),
      currency: intent.currency?.toUpperCase() || 'USD',
      raw: intent,
      cartId: intent.metadata?.cartId || '',
      userId: intent.metadata?.userId || '',
    };
  },

  rehydrateInitialization({ raw }) {
    return {
      type: 'embedded',
      clientSecret: raw?.client_secret || '',
    };
  },
};
