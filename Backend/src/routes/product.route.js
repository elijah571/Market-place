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
  .route('/')
  .post(isAuthenticated, isAdmin, createProduct)
  .get(isAuthenticated, getAllProducts);

// ✅ Put specific route BEFORE dynamic route
router.route('/review').put(isAuthenticated, addReview);
router.route('/reviews').get(getProductReviews);
router
  .route('/reviews')
  .get(getProductReviews)
  .delete(isAuthenticated, deleteReview);
router
  .route('/:id')
  .get(isAuthenticated, getSingleProduct)
  .put(isAuthenticated, isAdmin, updateProduct)
  .delete(isAuthenticated, isAdmin, deleteProduct);

export default router;
