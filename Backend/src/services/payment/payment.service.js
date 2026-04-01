import { AppError } from '../../utils/AppError.js';
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

  async initialize({ gateway, payload }) {
    const provider = getProvider(gateway);
    return provider.initialize(payload);
  },

  async verify({ gateway, reference }) {
    const provider = getProvider(gateway);
    return provider.verify({ reference });
  },

  async verifyWebhook({ gateway, payload, signature }) {
    const provider = getProvider(gateway);
    return provider.verifyWebhook({ payload, signature });
  },
};
