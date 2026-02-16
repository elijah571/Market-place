import { asyncHandler } from '../middleware/asyncHandler.js';
import { Product } from '../models/product.model.js';
import APIFunctionality from '../utils/apiFunctionality.js';
import { AppError } from '../utils/AppError.js';

/* ===============================
   CREATE PRODUCT
================================= */
export const createProduct = asyncHandler(async (req, res) => {
  req.body.user = req.user._id;

  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Product created successfully',
    data: product,
  });
});

/* ===============================
   GET ALL PRODUCTS (PUBLIC)
================================= */
export const getAllProducts = asyncHandler(async (req, res) => {
  const resultPerPage = Number(req.query.limit) || 8;
  const page = Number(req.query.page) || 1;

  const apiFeatures = new APIFunctionality(Product.find(), req.query)
    .search()
    .filter();

  const filteredQuery = apiFeatures.query.clone();
  const productCount = await filteredQuery.countDocuments();

  const totalPage = Math.ceil(productCount / resultPerPage);

  if (page > totalPage && productCount > 0) {
    throw new AppError("This page doesn't exist", 404);
  }

  apiFeatures.pagination(resultPerPage);

  const products = await apiFeatures.query;

  res.status(200).json({
    status: 'success',
    results: products.length,
    productCount,
    resultPerPage,
    totalPage,
    currentPage: page,
    data: products,
  });
});

/* ===============================
   GET SINGLE PRODUCT
================================= */
export const getSingleProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

/* ===============================
   UPDATE PRODUCT
================================= */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Product updated successfully',
    data: updatedProduct,
  });
});

/* ===============================
   DELETE PRODUCT
================================= */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await product.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
});

/* ===============================
   GET ADMIN PRODUCTS
   (Same as public but without restriction)
================================= */
export const getAdminProducts = asyncHandler(async (req, res) => {
  const resultPerPage = Number(req.query.limit) || 8;
  const page = Number(req.query.page) || 1;

  const apiFeatures = new APIFunctionality(Product.find(), req.query)
    .search()
    .filter();

  const filteredQuery = apiFeatures.query.clone();
  const productCount = await filteredQuery.countDocuments();
  const totalPage = Math.ceil(productCount / resultPerPage);

  if (page > totalPage && productCount > 0) {
    throw new AppError("This page doesn't exist", 404);
  }

  apiFeatures.pagination(resultPerPage);
  const products = await apiFeatures.query;

  res.status(200).json({
    status: 'success',
    results: products.length,
    productCount,
    resultPerPage,
    totalPage,
    currentPage: page,
    data: products,
  });
});

/* ===============================
   ADD / UPDATE REVIEW
================================= */
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment, productId } = req.body;

  if (!rating || !comment || !productId) {
    throw new AppError('Rating, comment and productId are required', 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const numericRating = Number(rating);

  if (numericRating < 1 || numericRating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Check if user already reviewed
  const existingReview = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (existingReview) {
    // Update review
    existingReview.rating = numericRating;
    existingReview.comment = comment;
  } else {
    // Add new review
    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating: numericRating,
      comment,
    });
  }

  // Recalculate ratings
  product.numOfReviews = product.reviews.length;

  const totalRating = product.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  product.rating =
    product.numOfReviews === 0
      ? 0
      : Number((totalRating / product.numOfReviews).toFixed(1));

  await product.save();

  res.status(200).json({
    status: 'success',
    message: existingReview
      ? 'Review updated successfully'
      : 'Review added successfully',
    data: product,
  });
});

/* ===============================
   GET PRODUCT REVIEWS
================================= */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.query;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    status: 'success',
    results: product.reviews.length,
    reviews: product.reviews,
  });
});

/* ===============================
   DELETE REVIEW
================================= */
export const deleteReview = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.query;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const review = product.reviews.find(
    (rev) => rev._id.toString() === reviewId.toString()
  );

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Allow only review owner or admin
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('Not authorized to delete this review', 403);
  }

  // Remove review
  product.reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== reviewId.toString()
  );

  // Recalculate ratings
  product.numOfReviews = product.reviews.length;

  const totalRating = product.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  product.rating =
    product.numOfReviews === 0
      ? 0
      : Number((totalRating / product.numOfReviews).toFixed(1));

  await product.save();

  res.status(200).json({
    status: 'success',
    message: 'Review deleted successfully',
  });
});
