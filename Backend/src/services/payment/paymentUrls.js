import { getPrimaryFrontendOrigin } from '../../utils/frontendOrigins.js';

export { getPrimaryFrontendOrigin } from '../../utils/frontendOrigins.js';

export const buildPaymentReturnUrl = ({
  gateway = '',
  reference = '',
  cartId = '',
  targetUrl = '',
  pathname = '/payment-success',
} = {}) => {
  const normalizedTarget = String(targetUrl || '').trim();
  const fallbackOrigin = getPrimaryFrontendOrigin();

  if (!normalizedTarget && !fallbackOrigin) {
    return '';
  }

  const url = normalizedTarget
    ? new URL(normalizedTarget)
    : new URL(pathname, `${fallbackOrigin.replace(/\/$/, '')}/`);

  if (gateway) {
    url.searchParams.set('gateway', gateway);
  }

  if (reference) {
    url.searchParams.set('reference', reference);
  }

  if (cartId) {
    url.searchParams.set('cartId', cartId);
  }

  return url.toString();
};
