import React, { memo, useMemo } from 'react';
import '../componentStyles/Product.css';
import { Link, useNavigate } from 'react-router-dom';
import Rating from './Rating';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../features/users/userSlice';
import { addToCart, syncCartWithServer } from '../features/cart/cartSlice';
import { toast } from 'react-toastify';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { formatCurrency } from '../utils/formatters';

const Product = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (product.stock <= 0) {
      toast.error('This item is out of stock');
      return;
    }

    if (product.variants?.length) {
      navigate(`/product/${product._id}`);
      return;
    }

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        image: productImage,
        price: product.price,
        quantity: 1,
        stock: product.stock,
        variantId: null,
      })
    );

    if (isAuthenticated) {
      dispatch(syncCartWithServer());
    }
    toast.success('Added to cart');
  };

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
          <div className="product-top-row">
            <h3 className="product-title">{product.name}</h3>
            <p className="product-price">{formatCurrency(product.price)}</p>
          </div>

          <p className="product-desc">
            {product.description || product.subcategory || product.category || 'Quality you can trust'}
          </p>

          <div className="rating_continers">
            <Rating value={product.rating || 0} disabled={true} />
            <span className="product-review-count">({product.numOfReviews || 0})</span>
          </div>

          <button
            type="button"
            className="add-to-cart"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default memo(Product);
