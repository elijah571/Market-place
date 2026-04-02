import { asyncHandler } from '../middleware/asyncHandler.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import {
  deleteFromCloudinary,
  uploadsToCloudinary,
} from '../utils/cloudinary.js';
import { sendSuccess } from '../utils/response.js';
import { clearCommerceCache } from '../utils/cache.js';
import { productCatalogService } from '../services/catalog/product-catalog.service.js';

const parseMaybeJson = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const pickFiles = (files, key) => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return files[key] || [];
};

const normalizeVariants = (
  variants = [],
  uploadedVariantImages = [],
  existingVariants = []
) => {
  if (!Array.isArray(variants)) return [];

  const normalized = [];
  const duplicateKey = new Set();

  variants.forEach((variant, idx) => {
    const color = String(variant.color || '').trim().toLowerCase();
    const size = String(variant.size || '').trim().toUpperCase();
    const stock = Number.isFinite(Number(variant.stock))
      ? Number(variant.stock)
      : 0;
    const priceDelta = Number.isFinite(Number(variant.priceDelta))
      ? Number(variant.priceDelta)
      : 0;
    const sku = (variant.sku || '').trim();
    const attributes =
      variant.attributes && typeof variant.attributes === 'object'
        ? variant.attributes
        : undefined;

    const uploadedImage = uploadedVariantImages[idx];
    const payloadImage =
      variant.image && (variant.image.public_id || variant.image.url)
        ? {
            public_id: variant.image.public_id || '',
            url: variant.image.url || '',
          }
        : null;
    const fallbackImage =
      existingVariants[idx] && existingVariants[idx].image
        ? existingVariants[idx].image
        : null;

    const chosenImage = uploadedImage || payloadImage || fallbackImage || null;

    const hasContent =
      color ||
      size ||
      stock > 0 ||
      priceDelta !== 0 ||
      sku ||
      (attributes && Object.keys(attributes).length > 0) ||
      Boolean(chosenImage);

    if (!hasContent) {
      return;
    }

    if (color && size) {
      const key = `${color}_${size}`;
      if (duplicateKey.has(key)) {
        throw new AppError(
          `Duplicate variant combination found: ${color}/${size}`,
          400
        );
      }
      duplicateKey.add(key);
    }

    normalized.push({
      color,
      size,
      attributes,
      stock,
      priceDelta,
      sku,
      image: chosenImage || { public_id: '', url: '' },
    });
  });

  return normalized;
};

const uploadImages = async (files = [], folder) => {
  const uploaded = [];

  for (const file of files) {
    const image = await uploadsToCloudinary(file.buffer, folder);
    uploaded.push({
      public_id: image.public_id,
      url: image.secure_url,
    });
  }

  return uploaded;
};

const uploadProductImages = (files = []) =>
  uploadImages(files, 'product_images');

const uploadVariantImages = (files = []) =>
  uploadImages(files, 'variant_images');

const cleanupUploadedImages = async (images = []) => {
  if (!images.length) return;
  await Promise.all(
    images
      .filter((img) => img.public_id)
      .map((img) => deleteFromCloudinary(img.public_id).catch(() => null))
  );
};

/* ===============================
   CREATE PRODUCT
================================= */
export const createProduct = asyncHandler(async (req, res) => {
  const parsedVariants = parseMaybeJson(req.body.variants, req.body.variants);
  const parsedImages = parseMaybeJson(req.body.image, req.body.image);

  req.body.user = req.user._id;
  const productFiles = pickFiles(req.files, 'images');
  const variantFiles = pickFiles(req.files, 'variantImages');

  let uploadedImages = [];
  let uploadedVariantImages = [];
  if (productFiles.length > 0) {
    try {
      uploadedImages = await uploadProductImages(productFiles);
    } catch {
      throw new AppError(
        'Image upload timed out. Please retry with smaller images.',
        504
      );
    }
  }

  if (variantFiles.length > 0) {
    try {
      uploadedVariantImages = await uploadVariantImages(variantFiles);
    } catch {
      throw new AppError(
        'Variant image upload timed out. Please retry with smaller images.',
        504
      );
    }
  }

  req.body.variants = normalizeVariants(
    parsedVariants,
    uploadedVariantImages,
    []
  );

  const imagePayload = Array.isArray(parsedImages) ? parsedImages : [];
  req.body.image = uploadedImages.length
    ? uploadedImages
    : imagePayload;

  if (!req.body.image?.length) {
    throw new AppError('At least one product image is required', 400);
  }

  let product;
  try {
    product = await Product.create(req.body);
  } catch (error) {
    await cleanupUploadedImages([...uploadedImages, ...uploadedVariantImages]);
    throw error;
  }

  clearCommerceCache();

  return sendSuccess(res, {
    status: 201,
    message: 'Product created successfully',
    data: product,
  });
});

/* ===============================
   GET ALL PRODUCTS (PUBLIC)
================================= */
export const getAllProducts = asyncHandler(async (req, res) => {
  const catalog = await productCatalogService.getPublicCatalog(req.query);
  return sendSuccess(res, catalog);
});

export const getProductMeta = asyncHandler(async (_req, res) => {
  const meta = await productCatalogService.getProductMeta();
  return sendSuccess(res, {
    data: meta,
  });
});

/* ===============================
   GET SINGLE PRODUCT
================================= */
export const getSingleProduct = asyncHandler(async (req, res) => {
  const product = await productCatalogService.getSingleProduct(req.params.id);

  return sendSuccess(res, { data: product });
});

export const getProductRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await productCatalogService.getRecommendations(
    req.params.id
  );
  return sendSuccess(res, recommendations);
});

/* ===============================
   UPDATE PRODUCT
================================= */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const parsedVariants = parseMaybeJson(req.body.variants, req.body.variants);
  const parsedImages = parseMaybeJson(req.body.image, req.body.image);
  const productFiles = pickFiles(req.files, 'images');
  const variantFiles = pickFiles(req.files, 'variantImages');
  const existingVariants = Array.isArray(product.variants)
    ? product.variants
    : [];

  let uploadedVariantImages = [];
  if (variantFiles.length > 0) {
    try {
      uploadedVariantImages = await uploadVariantImages(variantFiles);
    } catch {
      throw new AppError(
        'Variant image upload timed out. Please retry with smaller images.',
        504
      );
    }
  }

  if (parsedVariants) {
    req.body.variants = normalizeVariants(
      parsedVariants,
      uploadedVariantImages,
      existingVariants
    );
  }

  const oldVariantImagesToCleanup = [];
  if (uploadedVariantImages.length > 0 && existingVariants.length > 0) {
    uploadedVariantImages.forEach((_, idx) => {
      const oldImg = existingVariants[idx]?.image;
      if (oldImg?.public_id) {
        oldVariantImagesToCleanup.push(oldImg);
      }
    });
  }

  if (productFiles.length > 0) {
    let uploadedImages = [];
    try {
      uploadedImages = await uploadProductImages(productFiles);
    } catch {
      throw new AppError(
        'Image upload timed out. Please retry with smaller images.',
        504
      );
    }

    req.body.image = uploadedImages;

    const oldImages = Array.isArray(product.image) ? [...product.image] : [];

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (oldVariantImagesToCleanup.length > 0) {
      await cleanupUploadedImages(oldVariantImagesToCleanup);
    }
    await cleanupUploadedImages(oldImages);
    clearCommerceCache();

    return sendSuccess(res, {
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  }

  if (parsedImages) {
    req.body.image = parsedImages;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (oldVariantImagesToCleanup.length > 0) {
    await cleanupUploadedImages(oldVariantImagesToCleanup);
  }

  clearCommerceCache();

  return sendSuccess(res, {
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
  clearCommerceCache();

  return sendSuccess(res, { message: 'Product deleted successfully' });
});

/* ===============================
   GET ADMIN PRODUCTS
   (Same as public but without restriction)
================================= */
export const getAdminProducts = asyncHandler(async (req, res) => {
  const catalog = await productCatalogService.getAdminCatalog(req.query);
  return sendSuccess(res, catalog);
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
  clearCommerceCache();

  return sendSuccess(res, {
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

  return sendSuccess(res, {
    data: product.reviews,
    meta: { results: product.reviews.length },
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
  clearCommerceCache();

  return sendSuccess(res, { message: 'Review deleted successfully' });
});
