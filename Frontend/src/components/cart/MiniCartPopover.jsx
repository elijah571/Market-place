import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  cartSelectors,
  clearCart,
  removeFromCart,
  setCartError,
} from '../../features/cart/cartSlice';
import { useCartServerSync } from '../../features/cart/useCartServerSync';
import { formatCurrency } from '../../utils/formatters';

const MiniCartPopover = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(cartSelectors.getMiniCartItems);
  const itemCount = useSelector(cartSelectors.getItemCount);
  const subtotal = useSelector(cartSelectors.getSubtotal);
  const syncing = useSelector((state) => state.cart.syncing);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const { queueSync } = useCartServerSync(120);

  const handleRemove = (cartKey) => {
    dispatch(removeFromCart(cartKey));
    queueSync();
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      dispatch(setCartError('Please login to proceed to checkout'));
      navigate('/login');
      onClose();
      return;
    }

    navigate('/checkout');
    onClose();
  };

  const handleClear = () => {
    dispatch(clearCart());
    queueSync({ items: [], promoCode: '' });
  };

  return (
    <div
      className="navbar-popover navbar-cart-menu is-open"
      role="dialog"
      aria-label="Mini cart"
    >
      <div className="mini-cart-head">
        <div>
          <p className="navbar-drawer-summary-kicker">Mini cart</p>
          <strong>
            {itemCount > 0
              ? `${itemCount} item${itemCount === 1 ? '' : 's'}`
              : 'Your cart is empty'}
          </strong>
        </div>
        {itemCount > 0 ? (
          <button
            type="button"
            className="mini-cart-clear"
            onClick={handleClear}
            disabled={syncing}
          >
            Clear
          </button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="mini-cart-list">
          {items.map((item) => {
            const cartKey = cartSelectors.getItemKey(item);

            return (
              <article key={cartKey} className="mini-cart-item">
                <img src={item.image} alt={item.name} className="mini-cart-image" />
                <div className="mini-cart-copy">
                  <Link to={`/product/${item.productId || item.product}`} onClick={onClose}>
                    {item.name}
                  </Link>
                  <span>
                    {item.quantity} x {formatCurrency(item.price)}
                  </span>
                </div>
                <button
                  type="button"
                  className="mini-cart-remove"
                  onClick={() => handleRemove(cartKey)}
                  disabled={syncing}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mini-cart-empty-copy">
          Add something you love and it will show up here instantly.
        </p>
      )}

      <div className="mini-cart-footer">
        <div className="mini-cart-total">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="mini-cart-actions">
          <Link to="/cart" className="cart-secondary-link" onClick={onClose}>
            View cart
          </Link>
          <button
            type="button"
            className="mini-cart-primary"
            onClick={handleCheckout}
            disabled={itemCount === 0 || syncing}
          >
            {isAuthenticated ? 'Checkout' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniCartPopover;
