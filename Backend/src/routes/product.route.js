import express from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from '../controllers/product.controller.js';

const router = express.Router();

router.route('/products').post(createProduct).get(getAllProducts);
router
  .route('/product/:id')
  .get(getSingleProduct)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
