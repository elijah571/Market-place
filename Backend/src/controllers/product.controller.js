import handleAsync from '../middleware/handleAsyncErrror.js';
import { Product } from '../models/product.model.js';
import APIFunctionality from '../utils/apiFunctionality.js';
import HandleError from '../utils/handleError.js';
// CREATE product
export const createProduct = handleAsync(async (req, res, next) => {
  req.body.user = req.user.id;
  const product = await Product.create(req.body);
  return res.status(201).json({
    message: 'Product created successfully',
    data: product,
  });
});

// GET all products
export const getAllProducts = handleAsync(async (req, res, next) => {
  const resultPerPage = Number(req.query.limit) || 8;

  const apiFeatures = new APIFunctionality(Product.find(), req.query)
    .search()
    .filter();

  const filterQuery = apiFeatures.query.clone();
  const productCount = await filterQuery.countDocuments();

  const totalPage = Math.ceil(productCount / resultPerPage);
  const page = Number(req.query.page) || 1;

  if (page > totalPage && productCount > 0) {
    return next(new HandleError("This page doesn't exist", 404));
  }
  apiFeatures.pagination(resultPerPage);
  const products = await apiFeatures.query;

  if (!products || products.length === 0) {
    return next(new HandleError('No Product Found', 404));
  }

  return res.status(200).json({
    message: 'All products',
    data: products,
    productCount,
    resultPerPage,
    totalPage,
    currentPage: page,
  });
});

// GET single product by ID
export const getSingleProduct = handleAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.status(200).json({
    message: 'Single product',
    data: product,
  });
});

//Update Prouct by id

export const updateProduct = handleAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    message: ' product updated successfully',
    data: product,
  });
});

export const deleteProduct = handleAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  product = await Product.findByIdAndDelete(req.params.id);
  return res.status(200).json({
    message: ' product deleted successfully',
  });
});
