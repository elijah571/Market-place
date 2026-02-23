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

// ✅ Put specific route BEFORE dynamic route
router.route('/review').put(isAuthenticated, addReview);
router.route('/reviews').get(getProductReviews);
router
  .route('/product/reviews')
  .get(getProductReviews)
  .delete(isAuthenticated, deleteReview);
router
  .route('/product/:id')
  .get(isAuthenticated, getSingleProduct)
  .put(isAuthenticated, isAdmin, updateProduct)
  .delete(isAuthenticated, isAdmin, deleteProduct);

export default router;
