import React, { useEffect, useState } from 'react';
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
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import Loader from '../components/Loader';

const ProductDetails = () => {
  const [userRating, setUserRating] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const dispatch = useDispatch();
  const { id } = useParams();

  const { loading, error, product } = useSelector((state) => state.product);

  // Fetch product
  useEffect(() => {
    if (id) {
      dispatch(getProductDetails(id));
    }

    return () => {
      dispatch(removeErrors());
    };
  }, [dispatch, id]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error?.message || 'Something went wrong');
      dispatch(removeErrors());
    }
  }, [dispatch, error]);

  // Rating handler (FIXED)
  const handleRatingChange = (newRating) => {
    setUserRating(newRating);
  };

  // Quantity controls
  const increaseQty = () => {
    if (product?.stock && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <>
      <PageTitle title={`${product?.name} - Details`} />
      <Navbar />

      <div className="product-details-container">
        {loading ? (
          <Loader />
        ) : product ? (
          <>
            <div className="product-detail-container">
              {/* Image Section */}
              <div className="product-image-container">
                <img
                  src={product?.image?.[0]?.url}
                  alt={product?.name}
                  className="product-detail-image"
                />
              </div>

              {/* Info Section */}
              <div className="product-info">
                <h2>{product?.name}</h2>
                <p className="product-description">{product?.description}</p>

                <p className="product-price">Price: ${product?.price}</p>

                <div className="product-rating">
                  <Rating value={product?.rating || 0} disabled={true} />
                  <span className="productCardSpan">
                    ({product?.numOfReviews || 0} Reviews)
                  </span>
                </div>

                <div className="stock-status">
                  {product?.stock > 0 ? (
                    <span className="in-stock">
                      In Stock ({product?.stock} Available)
                    </span>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                </div>

                {/* Quantity */}

                {product?.stock < 0 && (
                  <>
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
                  </>
                )}

                <button
                  className="add-to-cart-btn"
                  disabled={product?.stock === 0}
                >
                  Add to Cart
                </button>

                {/* Review Form */}
                <form className="review-form">
                  <h3>Write a Review</h3>

                  <Rating
                    value={userRating}
                    disabled={false}
                    onRatingChange={handleRatingChange}
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

            {/* Reviews Section */}
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
