import React, { useEffect, useMemo, useState } from 'react';
import '../pageStyles/ProductDetails.css';
import PageTitle from '../components/PageTitle';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Rating from '../components/Rating';
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
import { addToCart } from '../features/cart/cartSlice';

const ProductDetails = () => {
  const [userRating, setUserRating] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading, error, product } = useSelector((state) => state.product);
  const { isAuthenticated } = useSelector((state) => state.user);

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
      return (
        availableVariants.find((variant) => variant.color === activeColor) ||
        availableVariants[0] ||
        null
      );
    }

    if (activeSize) {
      return (
        availableVariants.find((variant) => variant.size === activeSize) ||
        availableVariants[0] ||
        null
      );
    }

    return availableVariants[0] || null;
  }, [activeColor, activeSize, availableVariants]);

  const availableStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const displayedImage =
    selectedVariant?.image?.url || product?.image?.[0]?.url || '/placeholder.png';
  const displayedPrice =
    (product?.price || 0) + (selectedVariant?.priceDelta || 0);

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

    toast.success('Added to cart');
    navigate('/cart');
  };

  return (
    <>
      <PageTitle title={`${product?.name || 'Product'} - Details`} />
      <Navbar />

      <div className="product-details-container">
        {loading ? (
          <Loader />
        ) : product ? (
          <>
            <div className="product-detail-container">
              <div className="product-image-container">
                <img
                  src={displayedImage}
                  alt={product?.name}
                  className="product-detail-image"
                />
              </div>

              <div className="product-info">
                <h2>{product?.name}</h2>
                <p className="product-description">{product?.description}</p>
                <p className="product-price">Price: ${displayedPrice}</p>

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
                          className={`quantity-button ${
                            activeColor === color ? 'active-variant' : ''
                          }`}
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
                          className={`quantity-button ${
                            activeSize === size ? 'active-variant' : ''
                          }`}
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
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="quantity-value"
                    />
                    <button className="quantity-button" onClick={increaseQty}>
                      +
                    </button>
                  </div>
                )}

                <button
                  className="add-to-cart-btn"
                  disabled={availableStock === 0}
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>

                <form className="review-form">
                  <h3>Write a Review</h3>

                  <Rating
                    value={userRating}
                    disabled={false}
                    onRatingChange={(newRating) => setUserRating(newRating)}
                  />

                  <textarea
                    placeholder="Write your review here..."
                    className="review-input"
                  ></textarea>

                  <button type="submit" className="submit-review-btn">
                    Submit Review
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
          </>
        ) : (
          <p>Product not found</p>
        )}
      </div>

      <Footer />
    </>
  );
};

export default ProductDetails;
