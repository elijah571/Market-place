import express from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from '../controllers/product.controller.js';
import { isAdmin, isAuthenticateUser } from '../middleware/authentification.js';

const router = express.Router();

router
  .route('/products')
  .post(isAuthenticateUser, isAdmin, createProduct)
  .get(isAuthenticateUser, getAllProducts);
router
  .route('/product/:id')
  .get(isAuthenticateUser, getSingleProduct)
  .put(isAuthenticateUser, isAdmin, updateProduct)
  .delete(isAuthenticateUser, isAdmin, deleteProduct);

export default router;
