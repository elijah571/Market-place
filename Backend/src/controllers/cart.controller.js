import { asyncHandler } from '../middleware/asyncHandler.js';
import { Cart } from '../models/cart.model.js';
import { sendSuccess } from '../utils/response.js';
import {
  getAbandonedCartCutoff,
  getActiveCartForUser,
  hydrateCartResponse,
  syncUserCart,
} from '../services/commerce/cart.service.js';

export const getMyCart = asyncHandler(async (req, res) => {
  let cart = await getActiveCartForUser(req.user._id, { createIfMissing: true });

  if ((cart.items || []).length > 0) {
    const synced = await syncUserCart({
      userId: req.user._id,
      items: cart.items,
      shippingInfo: cart.shippingInfo,
      promoCode: cart.promoCode,
    });
    cart = synced.cart;
  }

  return sendSuccess(res, {
    data: hydrateCartResponse(cart),
  });
});

export const syncMyCart = asyncHandler(async (req, res) => {
  const { items, shippingInfo, promoCode } = req.body;
  const { cart } = await syncUserCart({
    userId: req.user._id,
    items,
    shippingInfo,
    promoCode,
  });

  return sendSuccess(res, {
    message: 'Cart synchronized successfully',
    data: hydrateCartResponse(cart),
  });
});

export const mergeMyCart = asyncHandler(async (req, res) => {
  const { items, shippingInfo, promoCode } = req.body;
  const { cart } = await syncUserCart({
    userId: req.user._id,
    items,
    shippingInfo,
    promoCode,
    merge: true,
  });

  return sendSuccess(res, {
    message: 'Guest cart merged successfully',
    data: hydrateCartResponse(cart),
  });
});

export const getAbandonedCarts = asyncHandler(async (_req, res) => {
  const cutoff = getAbandonedCartCutoff();
  const carts = await Cart.find({
    status: 'active',
    lastActivityAt: { $lte: cutoff },
    'items.0': { $exists: true },
  })
    .sort({ lastActivityAt: 1 })
    .populate('user', 'name email')
    .lean();

  return sendSuccess(res, {
    data: carts.map((cart) => ({
      ...cart,
      isAbandoned: true,
      hoursSinceLastActivity: Number(
        ((Date.now() - new Date(cart.lastActivityAt).getTime()) / (60 * 60 * 1000)).toFixed(1)
      ),
    })),
    meta: {
      results: carts.length,
    },
  });
});
