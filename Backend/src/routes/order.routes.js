import express from 'express';

import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import {
  createOrder,
  deleteOrder,
  getAllMyOrders,
  getMySingleOrder,
  getAllrdeOrsByAdmin,
  getSingleOrder,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../validation/order.validation.js';
import { CACHE_TTLS, withCache } from '../utils/cache.js';

const router = express.Router();

router.route('/new/order').post(isAuthenticated, validate(createOrderSchema), createOrder);
router.route('/orders').get(
  isAuthenticated,
  withCache({
    namespace: 'orders-me',
    ttlSeconds: CACHE_TTLS.orders,
    varyByUser: true,
    tags: (req) => ['orders', `orders:${req.user._id}`],
  }),
  getAllMyOrders
);
router.route('/order/:id').get(
  isAuthenticated,
  withCache({
    namespace: 'order-detail',
    ttlSeconds: CACHE_TTLS.orders,
    varyByUser: true,
    tags: (req) => ['orders', `orders:${req.user._id}`],
  }),
  getMySingleOrder
);
router.route('/admin/order').get(
  isAuthenticated,
  isAdmin,
  withCache({
    namespace: 'admin-orders',
    ttlSeconds: CACHE_TTLS.orders,
    tags: ['orders', 'admin-dashboard'],
  }),
  getAllrdeOrsByAdmin
);

router
  .route('/admin/order/:id')
  .get(
    isAuthenticated,
    isAdmin,
    withCache({
      namespace: 'admin-order-detail',
      ttlSeconds: CACHE_TTLS.orders,
      tags: ['orders', 'admin-dashboard'],
    }),
    getSingleOrder
  )
  .put(isAuthenticated, isAdmin, validate(updateOrderStatusSchema), updateOrderStatus)
  .delete(isAuthenticated, isAdmin, deleteOrder);
export default router;
