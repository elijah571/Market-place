import express from 'express';
import {
  addReview,
  createProduct,
  deleteProduct,
  deleteReview,
  getAllProducts,
  getProductReviews,
  getSingleProduct,
  updateProduct,
} from '../controllers/product.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';

const router = express.Router();

router
  .route('/products')
  .post(isAuthenticated, isAdmin, createProduct)
  .get(getAllProducts);

router
  .route('/product/reviews')
  .put(isAuthenticated, addReview)
  .get(getProductReviews)
  .delete(isAuthenticated, deleteReview);
router
  .route('/product/:id')
  .get(getSingleProduct)
  .put(isAuthenticated, isAdmin, updateProduct)
  .delete(isAuthenticated, isAdmin, deleteProduct);

export default router;
