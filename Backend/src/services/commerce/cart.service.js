import { Cart } from '../../models/cart.model.js';
import { Product } from '../../models/product.model.js';
import { AppError } from '../../utils/AppError.js';
import { resolvePromotion } from '../../utils/promotions.js';

export const TAX_RATE = 0.075;
export const FLAT_SHIPPING_PRICE = 8;
export const ABANDONED_CART_WINDOW_MS = 24 * 60 * 60 * 1000;

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const normalizeShippingInfo = (shippingInfo = {}) => ({
  country: String(shippingInfo.country || '').trim(),
  state: String(shippingInfo.state || '').trim(),
  city: String(shippingInfo.city || '').trim(),
  address: String(shippingInfo.address || '').trim(),
  pinCode: String(shippingInfo.pinCode || '').trim(),
  phoneNo: String(shippingInfo.phoneNo || '').trim(),
});

export const isShippingInfoComplete = (shippingInfo = {}) => {
  const normalized = normalizeShippingInfo(shippingInfo);
  return Object.values(normalized).every((value) => Boolean(String(value).trim()));
};

export const getCartItemKey = (item = {}) =>
  [
    String(item.product || item.productId || ''),
    String(item.variantId || ''),
    String(item.selectedColor || '').trim().toLowerCase(),
    String(item.selectedSize || '').trim().toUpperCase(),
  ].join('__');

export const mergeCartItems = (existingItems = [], incomingItems = []) => {
  const merged = new Map();

  [...existingItems, ...incomingItems].forEach((item) => {
    const key = getCartItemKey(item);
    if (!key) return;

    const previous = merged.get(key);
    const quantity = Number(item.quantity || 0);
    if (quantity <= 0) return;

    if (previous) {
      merged.set(key, {
        ...previous,
        quantity: previous.quantity + quantity,
      });
      return;
    }

    merged.set(key, {
      product: item.product || item.productId,
      quantity,
      selectedColor: String(item.selectedColor || '').trim().toLowerCase(),
      selectedSize: String(item.selectedSize || '').trim().toUpperCase(),
      variantId: item.variantId || null,
    });
  });

  return [...merged.values()];
};

export const isCartAbandoned = (cart) =>
  Boolean(
    cart?.status === 'active' &&
      Array.isArray(cart?.items) &&
      cart.items.length > 0 &&
      cart?.lastActivityAt &&
      new Date(cart.lastActivityAt).getTime() <= Date.now() - ABANDONED_CART_WINDOW_MS
  );

export const getAbandonedCartCutoff = () =>
  new Date(Date.now() - ABANDONED_CART_WINDOW_MS);

export const getBlockingCartIssues = (issues = []) =>
  (issues || []).filter((issue) =>
    ['product_removed', 'variant_required', 'out_of_stock'].includes(issue?.code)
  );

export const hasBlockingCartIssues = (issues = []) =>
  getBlockingCartIssues(issues).length > 0;

export const findVariant = (product, item = {}) => {
  if (!Array.isArray(product?.variants) || product.variants.length === 0) {
    return null;
  }

  return (
    product.variants.find((variant) => {
      if (item.variantId && String(variant._id) === String(item.variantId)) {
        return true;
      }

      return (
        variant.color === String(item.selectedColor || '').trim().toLowerCase() &&
        variant.size === String(item.selectedSize || '').trim().toUpperCase()
      );
    }) || null
  );
};

export const buildCartSnapshot = async (
  { items = [], shippingInfo = {}, promoCode = '', currency = 'USD' },
  { session } = {}
) => {
  if (!Array.isArray(items)) {
    throw new AppError('Cart items must be an array', 400);
  }

  const normalizedShippingInfo = normalizeShippingInfo(shippingInfo);
  const productIds = [
    ...new Set(
      items
        .map((item) => String(item.product || item.productId || ''))
        .filter(Boolean)
    ),
  ];

  if (productIds.length === 0) {
    return {
      items: [],
      shippingInfo: normalizedShippingInfo,
      currency: String(currency || 'USD').toUpperCase(),
      issues: [],
      summary: {
        itemPrice: 0,
        taxPrice: 0,
        shippingPrice: 0,
        discountPrice: 0,
        totalPrice: 0,
        totalQuantity: 0,
        promoCode: '',
      },
      promotion: null,
    };
  }

  const query = Product.find({ _id: { $in: productIds } }).select(
    'name price image stock variants'
  );
  if (session) {
    query.session(session);
  }

  const products = await query.lean();
  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const issues = [];
  const normalizedItems = [];

  items.forEach((rawItem) => {
    const productId = String(rawItem.product || rawItem.productId || '');
    const product = productMap.get(productId);

    if (!product) {
      issues.push({
        code: 'product_removed',
        message: 'A product in your cart is no longer available.',
        product: productId || null,
      });
      return;
    }

    const variant = findVariant(product, rawItem);
    const requestedQuantity = Math.max(1, Number(rawItem.quantity || 1));

    if (Array.isArray(product.variants) && product.variants.length > 0 && !variant) {
      issues.push({
        code: 'variant_required',
        message: `Select a valid variant for ${product.name}.`,
        product: product._id,
      });
      return;
    }

    const availableStock = Math.max(
      0,
      Number(variant ? variant.stock : product.stock || 0)
    );

    if (availableStock === 0) {
      issues.push({
        code: 'out_of_stock',
        message: `${product.name} is currently out of stock.`,
        product: product._id,
      });
      return;
    }

    const quantity = Math.min(requestedQuantity, availableStock);

    if (quantity !== requestedQuantity) {
      issues.push({
        code: 'quantity_adjusted',
        message: `${product.name} quantity was adjusted to ${quantity}.`,
        product: product._id,
      });
    }

    const unitPrice = roundMoney(
      Number(product.price || 0) + Number(variant?.priceDelta || 0)
    );

    normalizedItems.push({
      name: product.name,
      price: unitPrice,
      quantity,
      image: variant?.image?.url || product.image?.[0]?.url || '',
      product: product._id,
      selectedColor: variant?.color || String(rawItem.selectedColor || '').trim().toLowerCase(),
      selectedSize: variant?.size || String(rawItem.selectedSize || '').trim().toUpperCase(),
      variantId: variant?._id || rawItem.variantId || null,
      availableStock,
    });
  });

  const itemPrice = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const totalQuantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const shippingPrice = totalQuantity > 0 ? FLAT_SHIPPING_PRICE : 0;
  const taxPrice = roundMoney(itemPrice * TAX_RATE);
  const promotion = resolvePromotion({
    promoCode,
    subtotal: itemPrice,
    shippingPrice,
  });

  if (promoCode && promotion && !promotion.valid) {
    issues.push({
      code: 'promo_invalid',
      message: promotion.message,
      product: null,
    });
  }

  const discountPrice = roundMoney(
    promotion?.valid ? promotion.discountAmount : 0
  );
  const totalPrice = roundMoney(
    itemPrice + shippingPrice + taxPrice - discountPrice
  );

  return {
    items: normalizedItems,
    shippingInfo: normalizedShippingInfo,
    currency: String(currency || 'USD').toUpperCase(),
    issues,
    summary: {
      itemPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
      totalQuantity,
      promoCode: promotion?.valid ? promotion.code : '',
    },
    promotion: promotion?.valid ? promotion : null,
  };
};

export const getActiveCartForUser = async (userId, { session, createIfMissing = false } = {}) => {
  const query = Cart.findOne({ user: userId, status: 'active' });
  if (session) {
    query.session(session);
  }

  let cart = await query;

  if (!cart && createIfMissing) {
    cart = await Cart.create(
      [
        {
          user: userId,
          status: 'active',
        },
      ],
      session ? { session } : undefined
    ).then((records) => records[0]);
  }

  return cart;
};

export const syncUserCart = async (
  { userId, items = [], shippingInfo, promoCode, merge = false },
  { session } = {}
) => {
  const cart = await getActiveCartForUser(userId, { session, createIfMissing: true });

  const sourceItems = merge
    ? mergeCartItems(cart.items || [], items || [])
    : Array.isArray(items)
      ? items
      : cart.items || [];

  const nextShippingInfo =
    shippingInfo !== undefined ? shippingInfo : cart.shippingInfo || {};
  const nextPromoCode = promoCode !== undefined ? promoCode : cart.promoCode || '';

  const snapshot = await buildCartSnapshot(
    {
      items: sourceItems,
      shippingInfo: nextShippingInfo,
      promoCode: nextPromoCode,
      currency: cart.currency || 'USD',
    },
    { session }
  );

  cart.items = snapshot.items;
  cart.shippingInfo = snapshot.shippingInfo;
  cart.promoCode = snapshot.summary.promoCode;
  cart.currency = snapshot.currency;
  cart.summary = snapshot.summary;
  cart.issues = snapshot.issues;
  cart.lastActivityAt = new Date();

  await cart.save({ validateBeforeSave: false, session });

  return { cart, snapshot };
};

export const hydrateCartResponse = (cart) => ({
  ...cart.toObject({ virtuals: false }),
  isAbandoned: isCartAbandoned(cart),
});

export const reserveInventoryForItems = async (items = [], { session } = {}) => {
  for (const item of items) {
    const productId = item.product?._id || item.product;
    const quantity = Number(item.quantity || 0);

    if (!productId || quantity <= 0) {
      throw new AppError('Invalid inventory reservation payload', 400);
    }

    let result;

    if (item.variantId) {
      result = await Product.updateOne(
        {
          _id: productId,
          stock: { $gte: quantity },
          variants: {
            $elemMatch: {
              _id: item.variantId,
              stock: { $gte: quantity },
            },
          },
        },
        {
          $inc: {
            'variants.$.stock': -quantity,
            stock: -quantity,
          },
        },
        session ? { session } : undefined
      );
    } else {
      result = await Product.updateOne(
        {
          _id: productId,
          stock: { $gte: quantity },
        },
        {
          $inc: {
            stock: -quantity,
          },
        },
        session ? { session } : undefined
      );
    }

    if (!result.modifiedCount) {
      throw new AppError(`Insufficient stock for ${item.name}`, 409);
    }
  }
};
