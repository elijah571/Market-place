import express from 'express';

import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import {
  createOrder,
  deleteOrder,
  getAllMyOrders,
  getAllrdeOrsByAdmin,
  getSingleOrder,
  updateOrderStatus,
} from '../controllers/order.controller.js';

const router = express.Router();

router.route('/new/order').post(isAuthenticated, createOrder);
router.route('/orders').get(isAuthenticated, getAllMyOrders);
router.route('/admin/order').get(isAuthenticated, isAdmin, getAllrdeOrsByAdmin);

router
  .route('/admin/order/:id')
  .get(isAuthenticated, isAdmin, getSingleOrder)
  .put(isAuthenticated, isAdmin, updateOrderStatus)
  .delete(isAuthenticated, isAdmin, deleteOrder);
export default router;
