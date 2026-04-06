export const DEFAULT_SHIPPING_INFO = Object.freeze({
  country: '',
  state: '',
  city: '',
  address: '',
  pinCode: '',
  phoneNo: '',
});

const normalizeText = (value = '') => String(value || '').trim();

const toPositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

export const normalizeShippingInfo = (shippingInfo = {}) => ({
  country: normalizeText(shippingInfo.country),
  state: normalizeText(shippingInfo.state),
  city: normalizeText(shippingInfo.city),
  address: normalizeText(shippingInfo.address),
  pinCode: normalizeText(shippingInfo.pinCode),
  phoneNo: normalizeText(shippingInfo.phoneNo),
});

export const normalizePromoState = (promo) => {
  if (!promo?.code) {
    return null;
  }

  return {
    code: normalizeText(promo.code).toUpperCase(),
    discountAmount: Number(promo.discountAmount || 0),
  };
};

export const getCartItemKey = (item = {}) =>
  [
    normalizeText(item.productId || item.product),
    normalizeText(item.variantId),
    normalizeText(item.selectedColor).toLowerCase(),
    normalizeText(item.selectedSize).toUpperCase(),
  ].join('__');

export const normalizeCartItem = (item = {}) => {
  const productId = normalizeText(item.productId || item.product);

  if (!productId) {
    return null;
  }

  const normalizedStock = Number(item.stock ?? item.availableStock ?? 0);
  const hasStockLimit = Number.isFinite(normalizedStock) && normalizedStock > 0;
  const requestedQuantity = toPositiveInteger(item.quantity, 1);
  const quantity = hasStockLimit
    ? Math.min(requestedQuantity, Math.floor(normalizedStock))
    : requestedQuantity;

  if (quantity <= 0) {
    return null;
  }

  return {
    ...item,
    productId,
    product: productId,
    name: normalizeText(item.name),
    image: normalizeText(item.image),
    price: Number(item.price || 0),
    quantity,
    stock: hasStockLimit ? Math.floor(normalizedStock) : 0,
    selectedColor: normalizeText(item.selectedColor).toLowerCase(),
    selectedSize: normalizeText(item.selectedSize).toUpperCase(),
    variantId: normalizeText(item.variantId) || null,
  };
};

export const sanitizeCartItems = (items = []) => {
  const mergedItems = new Map();

  (Array.isArray(items) ? items : []).forEach((entry) => {
    const normalizedItem = normalizeCartItem(entry);

    if (!normalizedItem) {
      return;
    }

    const itemKey = getCartItemKey(normalizedItem);
    const existingItem = mergedItems.get(itemKey);

    if (!existingItem) {
      mergedItems.set(itemKey, normalizedItem);
      return;
    }

    const combinedQuantity = existingItem.quantity + normalizedItem.quantity;
    const stockLimit =
      existingItem.stock > 0 ? existingItem.stock : normalizedItem.stock;

    mergedItems.set(itemKey, {
      ...existingItem,
      quantity: stockLimit > 0 ? Math.min(combinedQuantity, stockLimit) : combinedQuantity,
      stock: stockLimit,
    });
  });

  return [...mergedItems.values()];
};

export const mergeCartItemLists = (existingItems = [], incomingItems = []) =>
  sanitizeCartItems([...(existingItems || []), ...(incomingItems || [])]);

export const mapServerCartItem = (item) =>
  normalizeCartItem({
    ...item,
    productId: item.product,
    stock: item.availableStock,
  });

export const toServerPayload = (state) => ({
  items: sanitizeCartItems(state.items).map((item) => ({
    product: item.productId || item.product,
    quantity: item.quantity,
    selectedColor: item.selectedColor || '',
    selectedSize: item.selectedSize || '',
    variantId: item.variantId || null,
  })),
  shippingInfo: normalizeShippingInfo(state.shippingInfo),
  promoCode: normalizePromoState(state.promo)?.code || '',
});
