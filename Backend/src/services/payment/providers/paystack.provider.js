import axios from 'axios';
import { AppError } from '../../../utils/AppError.js';
import { buildPaymentReturnUrl } from '../paymentUrls.js';
import {
  createPaymentReference,
  getPaymentRequestTimeoutMs,
  withRetry,
} from '../payment.helpers.js';
import { TRANSACTION_STATUS } from '../payment.constants.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const mapPaystackStatus = (status) => {
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (normalizedStatus === 'success') {
    return TRANSACTION_STATUS.SUCCESSFUL;
  }

  if (['reversed', 'refunded'].includes(normalizedStatus)) {
    return TRANSACTION_STATUS.REFUNDED;
  }

  if (['failed', 'abandoned'].includes(normalizedStatus)) {
    return TRANSACTION_STATUS.FAILED;
  }

  return TRANSACTION_STATUS.PENDING;
};

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
    const reference =
      metadata?.reference || createPaymentReference('ps');
    const callbackUrl = buildPaymentReturnUrl({
      gateway: 'paystack',
      reference,
      cartId: metadata?.cartId || '',
    });

    const { data } = await withRetry({
      gateway: 'paystack',
      operation: 'initialize',
      reference,
      fn: () =>
        axios.post(
          `${PAYSTACK_BASE_URL}/transaction/initialize`,
          {
            email,
            reference,
            amount: Math.round(amount * 100),
            currency,
            metadata,
            ...(callbackUrl ? { callback_url: callbackUrl } : {}),
          },
          {
            headers: getPaystackHeaders(),
            timeout: getPaymentRequestTimeoutMs(),
          }
        ),
    });

    if (!data?.status || !data?.data?.reference || !data?.data?.authorization_url) {
      throw new AppError('Unable to initialize Paystack payment', 400);
    }

    return {
      reference: data.data.reference || reference,
      status: TRANSACTION_STATUS.PENDING,
      amount,
      currency,
      raw: data,
      nextAction: {
        type: 'redirect',
        authorizationUrl: data.data.authorization_url,
      },
    };
  },

  async verify({ reference }) {
    const { data } = await withRetry({
      gateway: 'paystack',
      operation: 'verify',
      reference,
      fn: () =>
        axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
          headers: getPaystackHeaders(),
          timeout: getPaymentRequestTimeoutMs(),
        }),
    });

    const tx = data?.data;

    if (!tx) {
      throw new AppError('Unable to verify Paystack payment', 400);
    }

    return {
      reference: tx.reference,
      status: mapPaystackStatus(tx.status),
      providerStatus: tx.gateway_response || tx.status || '',
      amount: Number(tx.amount || 0) / 100,
      currency: tx.currency?.toUpperCase() || 'USD',
      raw: data,
      cartId: tx.metadata?.cartId || '',
      userId: tx.metadata?.userId || '',
    };
  },

  rehydrateInitialization({ raw }) {
    return {
      type: 'redirect',
      authorizationUrl: raw?.data?.authorization_url || '',
    };
  },
};
