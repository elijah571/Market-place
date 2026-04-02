import express from 'express';
import {
  addReview,
  createProduct,
  deleteProduct,
  deleteReview,
  getAdminProducts,
  getAllProducts,
  getHomeCollections,
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
import { CACHE_TTLS } from '../utils/cache.js';

const router = express.Router();

router
  .route('/products/meta')
  .get(
    validate(productCatalogQuerySchema, 'query'),
    withCache({
      namespace: 'products-meta',
      ttlSeconds: CACHE_TTLS.productMeta,
      tags: ['catalog-meta', 'homepage', 'catalog'],
    }),
    getProductMeta
  );
router.route('/products/home').get(
  withCache({
    namespace: 'products-home',
    ttlSeconds: CACHE_TTLS.homepage,
    tags: ['homepage', 'catalog-meta', 'catalog'],
  }),
  getHomeCollections
);
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
  .get(
    validate(productCatalogQuerySchema, 'query'),
    withCache({
      namespace: 'products-catalog',
      ttlSeconds: CACHE_TTLS.productCatalog,
      tags: ['catalog'],
    }),
    getAllProducts
  );
router
  .route('/admin/products')
  .get(
    isAuthenticated,
    isAdmin,
    validate(productCatalogQuerySchema, 'query'),
    withCache({
      namespace: 'admin-products',
      ttlSeconds: CACHE_TTLS.productCatalog,
      tags: ['catalog', 'admin-dashboard'],
    }),
    getAdminProducts
  );

router
  .route('/product/reviews')
  .put(isAuthenticated, validate(createReviewSchema), addReview)
  .get(
    withCache({
      namespace: 'product-reviews',
      ttlSeconds: CACHE_TTLS.recommendations,
      tags: (req) => ['product-reviews', `product:${req.query.id || 'unknown'}`],
    }),
    getProductReviews
  )
  .delete(isAuthenticated, deleteReview);
router
  .route('/product/:id/recommendations')
  .get(
    withCache({
      namespace: 'product-recommendations',
      ttlSeconds: CACHE_TTLS.recommendations,
      tags: (req) => ['product-recommendations', `product:${req.params.id}`],
    }),
    getProductRecommendations
  );
router
  .route('/product/:id')
  .get(
    withCache({
      namespace: 'product-detail',
      ttlSeconds: CACHE_TTLS.productDetails,
      tags: (req) => ['catalog', `product:${req.params.id}`],
    }),
    getSingleProduct
  )
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
