import express from 'express';
import {
  addReview,
  createProduct,
  deleteProduct,
  deleteReview,
  getAdminProducts,
  getAllProducts,
  getProductReviews,
  getSingleProduct,
  updateProduct,
} from '../controllers/product.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../validation/product.validation.js';

const router = express.Router();

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
  .get(getAllProducts);
router.route('/admin/products').get(isAuthenticated, isAdmin, getAdminProducts);

router
  .route('/product/reviews')
  .put(isAuthenticated, addReview)
  .get(getProductReviews)
  .delete(isAuthenticated, deleteReview);
router
  .route('/product/:id')
  .get(getSingleProduct)
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
