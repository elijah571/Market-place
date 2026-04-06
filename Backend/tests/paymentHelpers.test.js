import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPollingState,
  normalizeTransactionStatus,
} from '../src/services/payment/payment.constants.js';
import {
  assertVerifiedAmountMatchesTransaction,
  resolveVerifiedPaymentContext,
} from '../src/services/payment/payment.helpers.js';

test('normalizeTransactionStatus maps provider-specific values into internal states', () => {
  assert.equal(normalizeTransactionStatus('success'), 'successful');
  assert.equal(normalizeTransactionStatus('processing'), 'pending');
  assert.equal(normalizeTransactionStatus('abandoned'), 'failed');
  assert.equal(normalizeTransactionStatus('reversed'), 'refunded');
});

test('buildPollingState stops polling when max attempts is reached', () => {
  const previous = process.env.PAYMENT_VERIFY_MAX_ATTEMPTS;

  process.env.PAYMENT_VERIFY_MAX_ATTEMPTS = '2';

  const pending = buildPollingState({ status: 'pending', verificationAttempts: 1 });
  const exhausted = buildPollingState({ status: 'pending', verificationAttempts: 2 });

  assert.equal(pending.shouldPoll, true);
  assert.equal(exhausted.shouldPoll, false);

  if (previous === undefined) {
    delete process.env.PAYMENT_VERIFY_MAX_ATTEMPTS;
  } else {
    process.env.PAYMENT_VERIFY_MAX_ATTEMPTS = previous;
  }
});

test('resolveVerifiedPaymentContext rejects cart tampering', () => {
  assert.throws(
    () =>
      resolveVerifiedPaymentContext({
        transaction: { user: 'user-1', cart: 'cart-1' },
        verification: { userId: 'user-1', cartId: 'cart-2' },
        authenticatedUserId: 'user-1',
        requestedCartId: 'cart-1',
      }),
    /Provider returned a different checkout cart reference/
  );
});

test('assertVerifiedAmountMatchesTransaction rejects mismatched totals', () => {
  assert.throws(
    () =>
      assertVerifiedAmountMatchesTransaction({
        transaction: { amount: 120, currency: 'USD' },
        verification: { amount: 118, currency: 'USD' },
      }),
    /Verified payment amount does not match the checkout amount/
  );
});
