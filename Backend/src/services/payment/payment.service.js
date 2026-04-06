import { AppError } from '../../utils/AppError.js';
import {
  buildPollingState,
  isFinalTransactionStatus,
  normalizeTransactionStatus,
} from './payment.constants.js';
import { flutterwaveProvider } from './providers/flutterwave.provider.js';
import { paystackProvider } from './providers/paystack.provider.js';
import { stripeProvider } from './providers/stripe.provider.js';

const providers = {
  stripe: stripeProvider,
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider,
};

const getProvider = (gateway) => {
  const normalizedGateway = String(gateway || '').toLowerCase();
  const provider = providers[normalizedGateway];

  if (!provider) {
    throw new AppError('Unsupported payment gateway', 400);
  }

  return provider;
};

export const paymentService = {
  getSupportedGateways: () => Object.keys(providers),

  async initialize({ gateway, payload, idempotencyKey }) {
    const provider = getProvider(gateway);
    const initialized = await provider.initialize(payload, { idempotencyKey });
    const status = normalizeTransactionStatus(initialized.status);

    return {
      gateway,
      reference: initialized.reference,
      status,
      amount: Number(initialized.amount || payload.amount || 0),
      currency: String(initialized.currency || payload.currency || 'USD').toUpperCase(),
      raw: initialized.raw,
      nextAction: initialized.nextAction || { type: 'none' },
      polling: buildPollingState({ status, verificationAttempts: 0 }),
    };
  },

  async verify({ gateway, reference, verificationAttempts = 0 }) {
    const provider = getProvider(gateway);
    const verified = await provider.verify({ reference });
    const status = normalizeTransactionStatus(verified.status);

    return {
      gateway,
      reference: verified.reference || reference,
      status,
      providerStatus: String(verified.providerStatus || verified.status || status),
      amount: Number(verified.amount || 0),
      currency: String(verified.currency || 'USD').toUpperCase(),
      cartId: verified.cartId || '',
      userId: verified.userId || '',
      raw: verified.raw,
      isFinal: isFinalTransactionStatus(status),
      polling: buildPollingState({
        status,
        verificationAttempts: Number(verificationAttempts || 0) + 1,
      }),
    };
  },

  rehydrateInitialization({ gateway, transaction }) {
    const provider = getProvider(gateway);
    const status = normalizeTransactionStatus(
      transaction?.providerStatus || transaction?.status
    );

    return {
      gateway,
      reference: transaction.reference,
      status,
      amount: Number(transaction.amount || 0),
      currency: String(transaction.currency || 'USD').toUpperCase(),
      raw: transaction.providerResponse || {},
      nextAction:
        provider.rehydrateInitialization?.({
          raw: transaction.providerResponse,
          reference: transaction.reference,
        }) || { type: 'none' },
      polling: buildPollingState({
        status,
        verificationAttempts: Number(transaction.verificationAttempts || 0),
      }),
    };
  },
};
