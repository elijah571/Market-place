import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mergeCartItems,
  getCartItemKey,
  isCartAbandoned,
} from '../src/services/commerce/cart.service.js';
import {
  PAYMENT_STATUS,
  syncOrderPaymentState,
} from '../src/services/commerce/order.service.js';
import { resolvePromotion } from '../src/utils/promotions.js';

test('mergeCartItems merges identical product variants into one line', () => {
  const merged = mergeCartItems(
    [
      {
        product: 'product-1',
        quantity: 1,
        selectedColor: 'black',
        selectedSize: 'M',
        variantId: 'variant-1',
      },
    ],
    [
      {
        product: 'product-1',
        quantity: 2,
        selectedColor: 'black',
        selectedSize: 'M',
        variantId: 'variant-1',
      },
    ]
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 3);
  assert.equal(
    getCartItemKey(merged[0]),
    'product-1__variant-1__black__M'
  );
});

test('resolvePromotion applies percentage discounts correctly', () => {
  const promotion = resolvePromotion({
    promoCode: 'WELCOME10',
    subtotal: 100,
    shippingPrice: 8,
  });

  assert.equal(promotion.valid, true);
  assert.equal(promotion.discountAmount, 10);
});

test('isCartAbandoned returns true for stale active carts with items', () => {
  const cart = {
    status: 'active',
    items: [{ product: 'product-1', quantity: 1 }],
    lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
  };

  assert.equal(isCartAbandoned(cart), true);
});

test('syncOrderPaymentState marks pending orders as processing when payment succeeds', () => {
  const order = {
    orderStatus: 'PendingPayment',
    totalPrice: 118,
    paymentInfo: {
      status: 'Pending',
      amountPaid: 0,
      currency: 'USD',
    },
    statusTimeline: [],
  };

  syncOrderPaymentState(order, {
    reference: 'pi_123',
    gateway: 'stripe',
    paymentStatus: PAYMENT_STATUS.PAID,
    providerStatus: 'succeeded',
    amount: 118,
    currency: 'USD',
  });

  assert.equal(order.orderStatus, 'Processing');
  assert.equal(order.paymentInfo.status, 'Paid');
  assert.equal(order.paymentInfo.amountPaid, 118);
  assert.ok(order.paidAt);
  assert.equal(order.statusTimeline.length, 2);
});

test('syncOrderPaymentState cancels order when payment is refunded', () => {
  const order = {
    orderStatus: 'Delivered',
    totalPrice: 118,
    paymentInfo: {
      status: 'Paid',
      amountPaid: 118,
      currency: 'USD',
    },
    statusTimeline: [],
  };

  syncOrderPaymentState(order, {
    reference: 'pi_456',
    gateway: 'stripe',
    paymentStatus: PAYMENT_STATUS.REFUNDED,
    providerStatus: 'charge.refunded',
    amount: 118,
    currency: 'USD',
  });

  assert.equal(order.orderStatus, 'Cancelled');
  assert.equal(order.paymentInfo.status, 'Refunded');
  assert.equal(order.paymentInfo.amountPaid, 0);
  assert.equal(order.statusTimeline.length, 2);
});
