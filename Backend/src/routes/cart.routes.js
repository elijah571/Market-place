import express from 'express';
import {
  getAbandonedCarts,
  getMyCart,
  mergeMyCart,
  syncMyCart,
} from '../controllers/cart.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import { validate } from '../middleware/validate.js';
import { mergeCartSchema, syncCartSchema } from '../validation/cart.validation.js';
import { CACHE_TTLS, withCache } from '../utils/cache.js';

const router = express.Router();

router.get(
  '/cart/me',
  isAuthenticated,
  withCache({
    namespace: 'cart-me',
    ttlSeconds: CACHE_TTLS.cart,
    varyByUser: true,
    tags: (req) => ['cart', `cart:${req.user._id}`],
  }),
  getMyCart
);
router.put('/cart/me', isAuthenticated, validate(syncCartSchema), syncMyCart);
router.post('/cart/me/merge', isAuthenticated, validate(mergeCartSchema), mergeMyCart);
router.get('/admin/carts/abandoned', isAuthenticated, isAdmin, getAbandonedCarts);

export default router;
