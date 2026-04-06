import {
  DEFAULT_SHIPPING_INFO,
  normalizePromoState,
  normalizeShippingInfo,
  sanitizeCartItems,
} from './cartUtils';

export const CART_STORAGE_KEY = 'marketplace:cart-state:v1';
export const CART_STORAGE_KEYS = [CART_STORAGE_KEY];

const readStorage = () => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const readPersistedCartState = () => {
  const storedState = readStorage();

  if (!storedState) {
    return {
      items: [],
      shippingInfo: { ...DEFAULT_SHIPPING_INFO },
      promo: null,
      ownerId: null,
    };
  }

  return {
    items: sanitizeCartItems(storedState.items),
    shippingInfo: normalizeShippingInfo(storedState.shippingInfo || DEFAULT_SHIPPING_INFO),
    promo: normalizePromoState(storedState.promo),
    ownerId: storedState.ownerId ? String(storedState.ownerId) : null,
  };
};

export const persistCartState = ({ items, shippingInfo, promo, ownerId }) => {
  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: sanitizeCartItems(items),
        shippingInfo: normalizeShippingInfo(shippingInfo || DEFAULT_SHIPPING_INFO),
        promo: normalizePromoState(promo),
        ownerId: ownerId ? String(ownerId) : null,
      })
    );
  } catch {
    // Ignore storage write failures and keep in-memory cart usable.
  }
};
