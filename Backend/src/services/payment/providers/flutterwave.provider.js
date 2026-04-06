import axios from 'axios';
import { AppError } from '../../../utils/AppError.js';
import { buildPaymentReturnUrl } from '../paymentUrls.js';
import {
  createPaymentReference,
  getPaymentRequestTimeoutMs,
  withRetry,
} from '../payment.helpers.js';
import { TRANSACTION_STATUS } from '../payment.constants.js';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const mapFlutterwaveStatus = (status) => {
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (['successful', 'completed'].includes(normalizedStatus)) {
    return TRANSACTION_STATUS.SUCCESSFUL;
  }

  if (normalizedStatus === 'refunded') {
    return TRANSACTION_STATUS.REFUNDED;
  }

  if (['failed', 'cancelled', 'canceled'].includes(normalizedStatus)) {
    return TRANSACTION_STATUS.FAILED;
  }

  return TRANSACTION_STATUS.PENDING;
};

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
    const txRef = createPaymentReference('fw');
    const redirectUrl = buildPaymentReturnUrl({
      gateway: 'flutterwave',
      reference: txRef,
      cartId: metadata?.cartId || '',
      targetUrl: process.env.FLUTTERWAVE_REDIRECT_URL || '',
    });

    const { data } = await withRetry({
      gateway: 'flutterwave',
      operation: 'initialize',
      reference: txRef,
      fn: () =>
        axios.post(
          `${FLUTTERWAVE_BASE_URL}/payments`,
          {
            tx_ref: txRef,
            amount,
            currency,
            redirect_url:
              redirectUrl ||
              buildPaymentReturnUrl({
                gateway: 'flutterwave',
                reference: txRef,
                cartId: metadata?.cartId || '',
              }),
            customer: {
              email,
            },
            customizations: {
              title: 'Order Payment',
              description: 'Payment for order checkout',
            },
            meta: metadata,
          },
          {
            headers: getFlutterwaveHeaders(),
            timeout: getPaymentRequestTimeoutMs(),
          }
        ),
    });

    if (data?.status !== 'success' || !data?.data?.link) {
      throw new AppError('Unable to initialize Flutterwave payment', 400);
    }

    return {
      reference: txRef,
      status: TRANSACTION_STATUS.PENDING,
      amount,
      currency,
      raw: data,
      nextAction: {
        type: 'redirect',
        authorizationUrl: data.data.link,
      },
    };
  },

  async verify({ reference }) {
    const { data } = await withRetry({
      gateway: 'flutterwave',
      operation: 'verify',
      reference,
      fn: () =>
        axios.get(
          `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${reference}`,
          {
            headers: getFlutterwaveHeaders(),
            timeout: getPaymentRequestTimeoutMs(),
          }
        ),
    });

    const tx = data?.data;

    if (!tx) {
      throw new AppError('Unable to verify Flutterwave payment', 400);
    }

    return {
      reference,
      status: mapFlutterwaveStatus(tx.status),
      providerStatus: tx.processor_response || tx.status || '',
      amount: Number(tx.amount || 0),
      currency: tx.currency?.toUpperCase() || 'USD',
      raw: data,
      cartId: tx.meta?.cartId || '',
      userId: tx.meta?.userId || '',
    };
  },

  rehydrateInitialization({ raw }) {
    return {
      type: 'redirect',
      authorizationUrl: raw?.data?.link || '',
    };
  },
};
