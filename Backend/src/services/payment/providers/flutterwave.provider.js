import axios from 'axios';
import { AppError } from '../../../utils/AppError.js';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

const getFlutterwaveWebhookSecret = () =>
  process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_WEBHOOK_SECRET;

const getFlutterwaveHeaders = () => {
  if (!process.env.FLUTTERWAVE_SECRET_KEY) {
    throw new AppError('Flutterwave is not configured', 500);
  }

  return {
    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
};

export const flutterwaveProvider = {
  gateway: 'flutterwave',

  async initialize({ amount, currency, email, metadata = {} }) {
    const txRef = `fw_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const { data } = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      {
        tx_ref: txRef,
        amount,
        currency,
        redirect_url: process.env.FLUTTERWAVE_REDIRECT_URL || process.env.FRONTEND_URL,
        customer: {
          email,
        },
        customizations: {
          title: 'Order Payment',
          description: 'Payment for order checkout',
        },
        meta: metadata,
      },
      { headers: getFlutterwaveHeaders() }
    );

    if (data?.status !== 'success' || !data?.data?.link) {
      throw new AppError('Unable to initialize Flutterwave payment', 400);
    }

    return {
      reference: txRef,
      status: 'pending',
      raw: data,
      nextAction: {
        authorizationUrl: data.data.link,
      },
    };
  },

  async verify({ reference }) {
    const { data } = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${reference}`,
      { headers: getFlutterwaveHeaders() }
    );

    const tx = data?.data;

    if (!tx) {
      throw new AppError('Unable to verify Flutterwave payment', 400);
    }

    return {
      reference,
      status: tx.status === 'successful' ? 'successful' : 'failed',
      amount: Number(tx.amount || 0),
      currency: tx.currency?.toUpperCase() || 'USD',
      raw: data,
      orderId: tx.meta?.orderId,
    };
  },

  async verifyWebhook({ payload, signature }) {
    const webhookSecret = getFlutterwaveWebhookSecret();

    if (!webhookSecret) {
      throw new AppError('Flutterwave webhook hash is not configured', 500);
    }

    if (signature !== webhookSecret) {
      throw new AppError('Invalid Flutterwave webhook signature', 401);
    }

    const event = JSON.parse(payload.toString('utf8'));

    if (event?.event !== 'charge.completed') {
      return null;
    }

    return {
      reference: event.data.tx_ref,
      status: event.data.status === 'successful' ? 'successful' : 'failed',
      amount: Number(event.data.amount || 0),
      currency: event.data.currency?.toUpperCase() || 'USD',
      raw: event,
      orderId: event.data.meta?.orderId,
    };
  },
};
