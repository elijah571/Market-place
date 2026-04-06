import test from 'node:test';
import assert from 'node:assert/strict';

import {
  doesRequestMatchAllowedFrontendOrigin,
  getConfiguredFrontendOrigins,
  getPrimaryFrontendOrigin,
  isAllowedFrontendOrigin,
} from '../src/utils/frontendOrigins.js';

const restoreEnv = (key, value) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

test('isAllowedFrontendOrigin accepts exact configured origins', () => {
  const previous = process.env.FRONTEND_URL;

  process.env.FRONTEND_URL =
    'https://storefront.vercel.app, https://shop.example.com';

  assert.deepEqual(getConfiguredFrontendOrigins(), [
    'https://storefront.vercel.app',
    'https://shop.example.com',
  ]);
  assert.equal(
    isAllowedFrontendOrigin('https://storefront.vercel.app'),
    true
  );
  assert.equal(
    isAllowedFrontendOrigin('https://admin.example.com'),
    false
  );

  restoreEnv('FRONTEND_URL', previous);
});

test('isAllowedFrontendOrigin supports wildcard Vercel preview entries', () => {
  const previous = process.env.FRONTEND_URL;

  process.env.FRONTEND_URL =
    'https://market-place-*.vercel.app, https://market-place.example.com';

  assert.equal(
    isAllowedFrontendOrigin(
      'https://market-place-iv3uqoyjx-elijahs-projects-e0099976.vercel.app'
    ),
    true
  );
  assert.equal(
    isAllowedFrontendOrigin('https://other-project.vercel.app'),
    false
  );

  restoreEnv('FRONTEND_URL', previous);
});

test('doesRequestMatchAllowedFrontendOrigin validates referer against allowed origins', () => {
  assert.equal(
    doesRequestMatchAllowedFrontendOrigin({
      origin: '',
      referer:
        'https://market-place-abc123-elijahs-projects-e0099976.vercel.app/account',
      allowedOrigins: ['https://market-place-*.vercel.app'],
    }),
    true
  );
});

test('getPrimaryFrontendOrigin skips wildcard entries for redirect URLs', () => {
  const previous = process.env.FRONTEND_URL;

  process.env.FRONTEND_URL =
    'https://market-place-*.vercel.app, https://market-place.example.com';

  assert.equal(getPrimaryFrontendOrigin(), 'https://market-place.example.com');

  restoreEnv('FRONTEND_URL', previous);
});
