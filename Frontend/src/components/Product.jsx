import React, { useMemo } from 'react';
import '../componentStyles/Product.css';
import { Link } from 'react-router-dom';
import Rating from './Rating';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../features/users/userSlice';
import { toast } from 'react-toastify';
import { Bookmark, BookmarkBorder, Favorite, FavoriteBorder } from '@mui/icons-material';

const Product = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, wishlist } = useSelector((state) => state.user);
  const inWishlist = useMemo(
    () =>
      wishlist?.some(
        (entry) => (typeof entry === 'string' ? entry : entry?._id) === product._id
      ),
    [wishlist, product._id]
  );

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Login to save products');
      return;
    }
    dispatch(toggleWishlist(product._id));
  };

  return (
    <Link to={`/product/${product._id}`} className="product_id">
      <div className="product-card">
        <div className="product-media">
          <img
            src={product.image[0]?.url}
            alt={product.name}
            className="product-image-card"
          />
          <button
            type="button"
            className={`product-save-icon ${inWishlist ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove product from saved items' : 'Save product'}
            title={inWishlist ? 'Saved product' : 'Save product'}
          >
            {inWishlist ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </button>
        </div>
        <div className="product-details">
          <div className="product-top-row">
            <h3 className="product-title">{product.name}</h3>
            <button
              type="button"
              className={`product-bookmark-btn ${inWishlist ? 'active' : ''}`}
              onClick={handleWishlist}
              aria-label={inWishlist ? 'Remove bookmark' : 'Bookmark product'}
              title={inWishlist ? 'Saved product' : 'Bookmark product'}
            >
              {inWishlist ? (
                <Bookmark fontSize="small" />
              ) : (
                <BookmarkBorder fontSize="small" />
              )}
            </button>
          </div>
          <p className="home-price">
            <strong>Price</strong>${product.price}
          </p>
          <div className="rating_continers">
            <Rating value={product.rating || 0} disabled={true} />
          </div>
          <span className="productCardSpan">
            ({product.numOfReviews}{' '}
            {product.numOfReviews === 1 ? 'Review' : 'Reviews'})
          </span>
          <div className="product-actions">
            <button className="add-to-cart">View Details</button>
            <span className={`product-save-state ${inWishlist ? 'active' : ''}`}>
              {inWishlist ? 'Saved' : 'Tap icon to save'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Product;
