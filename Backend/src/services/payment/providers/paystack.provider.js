import axios from 'axios';
import { AppError } from '../../../utils/AppError.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const getPaystackHeaders = () => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new AppError('Paystack is not configured', 500);
  }

  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
};

export const paystackProvider = {
  gateway: 'paystack',

  async initialize({ amount, currency, email, metadata = {} }) {
    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount * 100),
        currency,
        metadata,
      },
      { headers: getPaystackHeaders() }
    );

    if (!data?.status || !data?.data?.reference) {
      throw new AppError('Unable to initialize Paystack payment', 400);
    }

    return {
      reference: data.data.reference,
      status: 'pending',
      raw: data,
      nextAction: {
        authorizationUrl: data.data.authorization_url,
      },
    };
  },

  async verify({ reference }) {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers: getPaystackHeaders() }
    );

    const tx = data?.data;

    if (!tx) {
      throw new AppError('Unable to verify Paystack payment', 400);
    }

    return {
      reference: tx.reference,
      status: tx.status === 'success' ? 'successful' : 'failed',
      amount: Number(tx.amount || 0) / 100,
      currency: tx.currency?.toUpperCase() || 'USD',
      raw: data,
      orderId: tx.metadata?.orderId,
    };
  },

  async verifyWebhook({ payload, signature }) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new AppError('Paystack is not configured', 500);
    }

    const crypto = await import('node:crypto');
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');

    if (hash !== signature) {
      throw new AppError('Invalid Paystack webhook signature', 401);
    }

    const event = JSON.parse(payload.toString('utf8'));

    if (event?.event !== 'charge.success') {
      return null;
    }

    return {
      reference: event.data.reference,
      status: 'successful',
      amount: Number(event.data.amount || 0) / 100,
      currency: event.data.currency?.toUpperCase() || 'USD',
      raw: event,
      orderId: event.data.metadata?.orderId,
    };
  },
};
