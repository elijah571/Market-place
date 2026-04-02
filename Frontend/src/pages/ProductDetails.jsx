import React, { useEffect, useMemo, useState } from 'react';
import '../pageStyles/ProductDetails.css';
import PageTitle from '../components/PageTitle';
import Rating from '../components/Rating';
import ProductCard from '../components/Product';
import { useDispatch, useSelector } from 'react-redux';
import {
  getProductDetails,
  removeErrors,
} from '../features/products/productSlice';
import {
  getRecentlyViewed,
  trackRecentlyViewed,
} from '../features/users/userSlice';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../components/Loader';
import { addToCart, syncCartWithServer } from '../features/cart/cartSlice';
import { storefrontService } from '../services/storefront.service';
import { formatCurrency } from '../utils/formatters';
import { useProductRecommendations } from '../features/catalog/catalogQueries';

const ProductDetails = () => {
  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeImage, setActiveImage] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading, error, product } = useSelector((state) => state.product);
  const { isAuthenticated } = useSelector((state) => state.user);
  const cartSyncing = useSelector((state) => state.cart.syncing);
  const { data: recommendations = [] } = useProductRecommendations(id);

  const availableVariants = useMemo(() => product?.variants || [], [product]);
  const availableColors = useMemo(() => {
    if (product?.colors?.length) return product.colors;
    return [...new Set(availableVariants.map((variant) => variant.color))];
  }, [availableVariants, product]);

  const activeColor = useMemo(() => {
    if (!availableColors.length) return '';
    return availableColors.includes(selectedColor) ? selectedColor : availableColors[0];
  }, [availableColors, selectedColor]);

  const availableSizes = useMemo(() => {
    if (!activeColor) {
      if (product?.sizes?.length) return product.sizes;
      return [...new Set(availableVariants.map((variant) => variant.size))].filter(Boolean);
    }

    return [
      ...new Set(
        availableVariants
          .filter((variant) => variant.color === activeColor)
          .map((variant) => variant.size)
      ),
    ].filter(Boolean);
  }, [activeColor, availableVariants, product]);

  const activeSize = useMemo(() => {
    if (!availableSizes.length) return '';
    return availableSizes.includes(selectedSize) ? selectedSize : availableSizes[0];
  }, [availableSizes, selectedSize]);

  const selectedVariant = useMemo(() => {
    if (!availableVariants.length) return null;

    if (activeColor && activeSize) {
      return (
        availableVariants.find(
          (variant) => variant.color === activeColor && variant.size === activeSize
        ) || null
      );
    }

    if (activeColor) {
      return availableVariants.find((variant) => variant.color === activeColor) || null;
    }

    if (activeSize) {
      return availableVariants.find((variant) => variant.size === activeSize) || null;
    }

    return availableVariants[0] || null;
  }, [activeColor, activeSize, availableVariants]);

  const availableStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const displayedImage =
    selectedVariant?.image?.url || product?.image?.[0]?.url || '/placeholder.png';
  const displayedPrice = (product?.price || 0) + (selectedVariant?.priceDelta || 0);
  const galleryImages = useMemo(() => {
    const baseImages = (product?.image || []).map((item) => item.url);
    const variantImage = selectedVariant?.image?.url;
    return [...new Set([variantImage, ...baseImages].filter(Boolean))];
  }, [product?.image, selectedVariant?.image?.url]);

  useEffect(() => {
    if (id) {
      dispatch(getProductDetails(id));
    }

    return () => {
      dispatch(removeErrors());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error?.message || error || 'Something went wrong');
      dispatch(removeErrors());
    }
  }, [dispatch, error]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages]);

  useEffect(() => {
    if (isAuthenticated && product?._id) {
      dispatch(trackRecentlyViewed(product._id)).then(() => {
        dispatch(getRecentlyViewed());
      });
    }
  }, [dispatch, isAuthenticated, product?._id]);

  const increaseQty = () => {
    if (availableStock && quantity < availableStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product) return;

    if (availableVariants.length && !selectedVariant) {
      toast.error('Select a valid variant before adding to cart');
      return;
    }

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        image: displayedImage,
        price: displayedPrice,
        quantity,
        stock: availableStock,
        selectedColor: activeColor,
        selectedSize: activeSize,
        variantId: selectedVariant?._id || null,
      })
    );

    dispatch(syncCartWithServer());

    toast.success('Added to cart');
    navigate('/cart');
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error('Login to write a review');
      navigate('/login');
      return;
    }

    if (!userRating || reviewComment.trim().length < 3) {
      toast.error('Provide a rating and a short review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await storefrontService.submitReview({
        productId: product._id,
        rating: userRating,
        comment: reviewComment.trim(),
      });
      toast.success('Review submitted successfully');
      setReviewComment('');
      setUserRating(0);
      dispatch(getProductDetails(id));
    } catch (reviewError) {
      toast.error(reviewError.response?.data?.message || 'Unable to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
      <PageTitle title={`${product?.name || 'Product'} - Details`} />

      <div className="product-details-container page-shell">
        {loading ? (
          <Loader />
        ) : product ? (
          <>
            <div className="product-detail-container">
              <div className="product-image-container">
                <img
                  src={activeImage || displayedImage}
                  alt={product?.name}
                  className="product-detail-image"
                />
                <div className="product-thumbnail-row">
                  {galleryImages.map((image) => (
                    <button
                      type="button"
                      key={image}
                      className={`product-thumbnail-btn ${activeImage === image ? 'active' : ''}`}
                      onClick={() => setActiveImage(image)}
                    >
                      <img src={image} alt={`${product?.name} preview`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-info">
                <p className="product-detail-kicker">
                  {product?.subcategory || product?.category || 'Featured Product'}
                </p>
                <h2>{product?.name}</h2>
                <p className="product-description">{product?.description}</p>
                <p className="product-price">{formatCurrency(displayedPrice)}</p>

                <div className="product-rating">
                  <Rating value={product?.rating || 0} disabled={true} />
                  <span className="productCardSpan">
                    ({product?.numOfReviews || 0} Reviews)
                  </span>
                </div>

                {availableColors.length > 0 && (
                  <div className="variant-section">
                    <p className="quantity-label">Color:</p>
                    <div className="variant-options">
                      {availableColors.map((color) => (
                        <button
                          type="button"
                          key={color}
                          className={`quantity-button ${activeColor === color ? 'active-variant' : ''}`}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className="variant-section">
                    <p className="quantity-label">Size:</p>
                    <div className="variant-options">
                      {availableSizes.map((size) => (
                        <button
                          type="button"
                          key={size}
                          className={`quantity-button ${activeSize === size ? 'active-variant' : ''}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="stock-status">
                  {availableStock > 0 ? (
                    <span className="in-stock">In Stock ({availableStock} Available)</span>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                </div>

                {availableStock > 0 && (
                  <div className="quantity-controls">
                    <span className="quantity-label">Quantity:</span>
                    <button className="quantity-button" onClick={decreaseQty}>
                      -
                    </button>
                    <input type="text" value={quantity} readOnly className="quantity-value" />
                    <button className="quantity-button" onClick={increaseQty}>
                      +
                    </button>
                  </div>
                )}

                <div className="product-benefits-grid">
                  <article>
                    <strong>Secure checkout</strong>
                    <span>Stripe, Paystack, and Flutterwave support</span>
                  </article>
                  <article>
                    <strong>Flexible delivery</strong>
                    <span>Saved address support and guided checkout steps</span>
                  </article>
                  <article>
                    <strong>Easy re-discovery</strong>
                    <span>Recently viewed and wishlist sync with your account</span>
                  </article>
                </div>

                <button
                  className="add-to-cart-btn"
                  disabled={availableStock === 0 || cartSyncing}
                  onClick={handleAddToCart}
                >
                  {cartSyncing ? 'Updating Cart...' : 'Add to Cart'}
                </button>

                <form className="review-form" onSubmit={handleSubmitReview}>
                  <h3>Write a Review</h3>

                  <Rating
                    value={userRating}
                    disabled={false}
                    onRatingChange={(newRating) => setUserRating(newRating)}
                  />

                  <textarea
                    placeholder="Write your review here..."
                    className="review-input"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                  ></textarea>

                  <button type="submit" className="submit-review-btn" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>

            <div className="reviews-container">
              <h3>Customer Reviews</h3>

              {product?.reviews?.length > 0 ? (
                product.reviews.map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <Rating value={review.rating} disabled={true} />
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    <p className="review-name">By {review.name}</p>
                  </div>
                ))
              ) : (
                <p>No Reviews Yet</p>
              )}
            </div>

            {recommendations.length > 0 && (
              <div className="reviews-container">
                <h3>You May Also Like</h3>
                <div className="product-recommendations-grid">
                  {recommendations.map((recommendedProduct) => (
                    <ProductCard product={recommendedProduct} key={recommendedProduct._id} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p>Product not found</p>
        )}
      </div>

    </>
  );
};

export default ProductDetails;
