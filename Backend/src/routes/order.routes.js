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

const router = express.Router();

router.route('/new/order').post(isAuthenticated, validate(createOrderSchema), createOrder);
router.route('/orders').get(isAuthenticated, getAllMyOrders);
router.route('/order/:id').get(isAuthenticated, getMySingleOrder);
router.route('/admin/order').get(isAuthenticated, isAdmin, getAllrdeOrsByAdmin);

router
  .route('/admin/order/:id')
  .get(isAuthenticated, isAdmin, getSingleOrder)
  .put(isAuthenticated, isAdmin, validate(updateOrderStatusSchema), updateOrderStatus)
  .delete(isAuthenticated, isAdmin, deleteOrder);
export default router;
