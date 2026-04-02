import express from 'express';
import {
  addReview,
  createProduct,
  deleteProduct,
  deleteReview,
  getAdminProducts,
  getAllProducts,
  getProductMeta,
  getProductRecommendations,
  getProductReviews,
  getSingleProduct,
  updateProduct,
} from '../controllers/product.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.js';
import { withCache } from '../utils/cache.js';
import {
  createProductSchema,
  createReviewSchema,
  productCatalogQuerySchema,
  updateProductSchema,
} from '../validation/product.validation.js';

const router = express.Router();

router
  .route('/products/meta')
  .get(validate(productCatalogQuerySchema, 'query'), withCache(5 * 60 * 1000), getProductMeta);
router
  .route('/products')
  .post(
    isAuthenticated,
    isAdmin,
    upload.fields([
      { name: 'images', maxCount: 6 },
      { name: 'variantImages', maxCount: 10 },
    ]),
    validate(createProductSchema),
    createProduct
  )
  .get(validate(productCatalogQuerySchema, 'query'), withCache(60 * 1000), getAllProducts);
router
  .route('/admin/products')
  .get(
    isAuthenticated,
    isAdmin,
    validate(productCatalogQuerySchema, 'query'),
    withCache(60 * 1000),
    getAdminProducts
  );

router
  .route('/product/reviews')
  .put(isAuthenticated, validate(createReviewSchema), addReview)
  .get(withCache(60 * 1000), getProductReviews)
  .delete(isAuthenticated, deleteReview);
router
  .route('/product/:id/recommendations')
  .get(withCache(60 * 1000), getProductRecommendations);
router
  .route('/product/:id')
  .get(withCache(60 * 1000), getSingleProduct)
  .put(
    isAuthenticated,
    isAdmin,
    upload.fields([
      { name: 'images', maxCount: 6 },
      { name: 'variantImages', maxCount: 10 },
    ]),
    validate(updateProductSchema),
    updateProduct
  )
  .delete(isAuthenticated, isAdmin, deleteProduct);

export default router;
