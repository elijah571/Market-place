import React, { memo, useMemo } from 'react';
import '../componentStyles/Product.css';
import { Link } from 'react-router-dom';
import Rating from './Rating';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../features/users/userSlice';
import { toast } from 'react-toastify';
import { Favorite, FavoriteBorder, VisibilityOutlined } from '@mui/icons-material';
import { formatCompactNumber, formatCurrency } from '../utils/formatters';

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

  const productImage = product.image?.[0]?.url || '/images/banner1.jpeg';
  const oldPrice = Number(product.price || 0) * 1.08;

  return (
    <Link to={`/product/${product._id}`} className="product_id">
      <div className="product-card">
        <div className="product-media">
          <img
            src={productImage}
            alt={product.name}
            className="product-image-card"
            loading="lazy"
            decoding="async"
          />
          <span className="product-badge">{product.category || 'Featured'}</span>
          <button
            type="button"
            className={`product-save-icon ${inWishlist ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove product from saved items' : 'Save product'}
          >
            {inWishlist ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </button>
        </div>
        <div className="product-details">
          <p className="product-category-label">{product.subcategory || product.category}</p>
          <h3 className="product-title">{product.name}</h3>
          <p className="home-price">{formatCurrency(product.price)}</p>
          <p className="product-old-price">{formatCurrency(oldPrice)}</p>
          <div className="rating_continers">
            <Rating value={product.rating || 0} disabled={true} />
            <span className="product-review-count">
              ({product.numOfReviews || 0} {product.numOfReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <div className="product-meta-row">
            <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
            <span>
              <VisibilityOutlined fontSize="inherit" />
              {formatCompactNumber(product.viewCount || 0)}
            </span>
          </div>
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

export default memo(Product);
