import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPaymentReturnUrl,
  getPrimaryFrontendOrigin,
} from '../src/services/payment/paymentUrls.js';

const restoreEnv = (key, value) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

test('getPrimaryFrontendOrigin returns the first configured origin', () => {
  const previous = process.env.FRONTEND_URL;

  process.env.FRONTEND_URL =
    'https://storefront.vercel.app, https://shop.example.com';

  assert.equal(getPrimaryFrontendOrigin(), 'https://storefront.vercel.app');

  restoreEnv('FRONTEND_URL', previous);
});

test('buildPaymentReturnUrl appends gateway, reference, and cart details', () => {
  const previous = process.env.FRONTEND_URL;

  process.env.FRONTEND_URL = 'https://storefront.vercel.app';

  const url = buildPaymentReturnUrl({
    gateway: 'paystack',
    reference: 'ref_123',
    cartId: 'cart_456',
  });

  assert.equal(
    url,
    'https://storefront.vercel.app/payment-success?gateway=paystack&reference=ref_123&cartId=cart_456'
  );

  restoreEnv('FRONTEND_URL', previous);
});

test('buildPaymentReturnUrl preserves an explicit target URL while updating payment params', () => {
  const url = buildPaymentReturnUrl({
    gateway: 'flutterwave',
    reference: 'fw_123',
    cartId: 'cart_789',
    targetUrl: 'https://shop.example.com/payment-success?source=flutterwave',
  });

  assert.equal(
    url,
    'https://shop.example.com/payment-success?source=flutterwave&gateway=flutterwave&reference=fw_123&cartId=cart_789'
  );
});
