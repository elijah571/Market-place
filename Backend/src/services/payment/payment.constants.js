export const PAYMENT_GATEWAYS = Object.freeze(['stripe', 'paystack', 'flutterwave']);

export const TRANSACTION_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const FINAL_TRANSACTION_STATUSES = new Set([
  TRANSACTION_STATUS.SUCCESSFUL,
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.REFUNDED,
]);

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

export const normalizeTransactionStatus = (status) => {
  const normalizedStatus = String(status || '').trim().toLowerCase();

  switch (normalizedStatus) {
    case 'successful':
    case 'succeeded':
    case 'success':
    case 'completed':
      return TRANSACTION_STATUS.SUCCESSFUL;
    case 'refunded':
    case 'reversed':
      return TRANSACTION_STATUS.REFUNDED;
    case 'failed':
    case 'failure':
    case 'abandoned':
    case 'cancelled':
    case 'canceled':
    case 'requires_payment_method':
      return TRANSACTION_STATUS.FAILED;
    default:
      return TRANSACTION_STATUS.PENDING;
  }
};

export const isFinalTransactionStatus = (status) =>
  FINAL_TRANSACTION_STATUSES.has(normalizeTransactionStatus(status));

export const toOrderPaymentStatus = (status) => {
  const normalizedStatus = normalizeTransactionStatus(status);

  if (normalizedStatus === TRANSACTION_STATUS.SUCCESSFUL) {
    return 'Paid';
  }

  if (normalizedStatus === TRANSACTION_STATUS.FAILED) {
    return 'Failed';
  }

  if (normalizedStatus === TRANSACTION_STATUS.REFUNDED) {
    return 'Refunded';
  }

  return 'Pending';
};

export const getPaymentPollingConfig = () => ({
  intervalMs: toPositiveNumber(process.env.PAYMENT_POLL_INTERVAL_MS, 3000),
  maxAttempts: toPositiveNumber(process.env.PAYMENT_VERIFY_MAX_ATTEMPTS, 5),
});

export const buildPollingState = ({ status, verificationAttempts = 0 } = {}) => {
  const normalizedStatus = normalizeTransactionStatus(status);
  const { intervalMs, maxAttempts } = getPaymentPollingConfig();
  const attemptsUsed = Math.max(Number(verificationAttempts) || 0, 0);
  const shouldPoll =
    normalizedStatus === TRANSACTION_STATUS.PENDING && attemptsUsed < maxAttempts;

  return {
    shouldPoll,
    intervalMs,
    maxAttempts,
    attemptsUsed,
    attemptsRemaining: Math.max(maxAttempts - attemptsUsed, 0),
    nextRetryAt: shouldPoll ? new Date(Date.now() + intervalMs).toISOString() : null,
  };
};
