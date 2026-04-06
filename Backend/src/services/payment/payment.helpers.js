import crypto from 'node:crypto';

import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import {
  buildPollingState,
  normalizeTransactionStatus,
  roundMoney,
} from './payment.constants.js';

const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const normalizeId = (value) => String(value || '').trim();

export const createPaymentReference = (prefix = 'pay') =>
  `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

export const getPaymentRequestTimeoutMs = () =>
  toPositiveNumber(process.env.PAYMENT_REQUEST_TIMEOUT_MS, 10000);

export const getPaymentRequestRetryConfig = () => ({
  maxAttempts: toPositiveNumber(process.env.PAYMENT_REQUEST_MAX_ATTEMPTS, 3),
  baseDelayMs: toPositiveNumber(process.env.PAYMENT_REQUEST_RETRY_DELAY_MS, 350),
});

export const toPaymentErrorMeta = (error) => ({
  message: error?.message || 'Unknown payment provider error',
  code: error?.code || error?.type || error?.response?.data?.code || '',
  statusCode: Number(error?.response?.status || error?.statusCode || error?.status || 0) || 0,
});

export const isRetryablePaymentError = (error) => {
  const statusCode = Number(
    error?.response?.status || error?.statusCode || error?.status || 0
  );

  if (RETRYABLE_STATUS_CODES.has(statusCode)) {
    return true;
  }

  const code = String(error?.code || error?.type || '').toLowerCase();

  return (
    code.includes('timeout') ||
    code.includes('connection') ||
    ['econnaborted', 'econnreset', 'eai_again', 'enotfound'].includes(code)
  );
};

export const withRetry = async ({
  gateway,
  operation,
  reference = '',
  fn,
  maxAttempts,
  baseDelayMs,
}) => {
  const retryConfig = getPaymentRequestRetryConfig();
  const resolvedMaxAttempts = maxAttempts || retryConfig.maxAttempts;
  const resolvedBaseDelayMs = baseDelayMs || retryConfig.baseDelayMs;
  let attempt = 0;

  while (attempt < resolvedMaxAttempts) {
    attempt += 1;

    try {
      return await fn();
    } catch (error) {
      const retryable =
        attempt < resolvedMaxAttempts && isRetryablePaymentError(error);

      logger[retryable ? 'warn' : 'error']('payment_provider_request_failed', {
        gateway,
        operation,
        reference,
        attempt,
        maxAttempts: resolvedMaxAttempts,
        retryable,
        error: toPaymentErrorMeta(error),
      });

      if (!retryable) {
        throw error;
      }

      await sleep(resolvedBaseDelayMs * attempt);
    }
  }

  throw new AppError('Payment provider request failed', 502);
};

export const resolveVerifiedPaymentContext = ({
  transaction,
  verification,
  authenticatedUserId,
  requestedCartId = '',
}) => {
  const authenticatedId = normalizeId(authenticatedUserId);
  const transactionUserId = normalizeId(transaction?.user);
  const providerUserId = normalizeId(verification?.userId);
  const transactionCartId = normalizeId(transaction?.cart);
  const providerCartId = normalizeId(verification?.cartId);
  const requestedCart = normalizeId(requestedCartId);

  if (transactionUserId && transactionUserId !== authenticatedId) {
    throw new AppError('Payment record does not belong to the authenticated user', 403);
  }

  if (providerUserId && providerUserId !== authenticatedId) {
    throw new AppError('Payment verification does not match the authenticated user', 403);
  }

  if (!transactionUserId && !providerUserId) {
    throw new AppError('Unable to resolve the payment owner from provider metadata', 400);
  }

  if (requestedCart && transactionCartId && requestedCart !== transactionCartId) {
    throw new AppError(
      'Payment cart reference does not match the original checkout cart',
      409
    );
  }

  if (requestedCart && providerCartId && requestedCart !== providerCartId) {
    throw new AppError('Provider returned a different checkout cart reference', 409);
  }

  if (transactionCartId && providerCartId && transactionCartId !== providerCartId) {
    throw new AppError(
      'Stored payment metadata does not match the provider verification response',
      409
    );
  }

  return {
    resolvedUserId: authenticatedId || transactionUserId || providerUserId,
    resolvedCartId: requestedCart || transactionCartId || providerCartId,
  };
};

export const assertVerifiedAmountMatchesTransaction = ({ transaction, verification }) => {
  if (!transaction) {
    return;
  }

  const expectedAmount = roundMoney(transaction.amount);
  const verifiedAmount = roundMoney(verification.amount);

  if (Math.abs(expectedAmount - verifiedAmount) > 0.01) {
    throw new AppError('Verified payment amount does not match the checkout amount', 409);
  }

  const expectedCurrency = String(transaction.currency || '').toUpperCase();
  const verifiedCurrency = String(verification.currency || '').toUpperCase();

  if (expectedCurrency && verifiedCurrency && expectedCurrency !== verifiedCurrency) {
    throw new AppError('Verified payment currency does not match the checkout currency', 409);
  }
};

export const buildVerificationTracking = ({
  status,
  verificationAttempts = 0,
  completedAt = null,
}) => {
  const normalizedStatus = normalizeTransactionStatus(status);
  const attemptsUsed = Math.max(Number(verificationAttempts) || 0, 0);
  const polling = buildPollingState({
    status: normalizedStatus,
    verificationAttempts: attemptsUsed,
  });

  return {
    polling,
    verificationAttempts: attemptsUsed,
    lastVerifiedAt: new Date(),
    nextVerificationAt: polling.nextRetryAt ? new Date(polling.nextRetryAt) : null,
    completedAt:
      normalizedStatus === 'pending'
        ? completedAt || null
        : completedAt || new Date(),
  };
};
