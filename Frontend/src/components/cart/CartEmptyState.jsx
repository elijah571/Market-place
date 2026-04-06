import React from 'react';
import { Link } from 'react-router-dom';

const CartEmptyState = ({ isAuthenticated }) => (
  <div className="empty-cart-container page-shell page-shell--narrow">
    <div className="empty-cart-illustration" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <p className="cart-kicker">Cart</p>
    <h2 className="empty-cart-title">Your cart is waiting for something good.</h2>
    <p className="empty-cart-message">
      {isAuthenticated
        ? 'Add products and we’ll keep them synced as you move through the store.'
        : 'Add products as a guest and they’ll stay with you on refresh. Sign in later to merge them into your account.'}
    </p>
    <div className="empty-cart-actions">
      <Link to="/products" className="viewProducts">
        Browse products
      </Link>
      {!isAuthenticated ? (
        <Link to="/login" className="cart-secondary-link">
          Sign in to save your cart
        </Link>
      ) : null}
    </div>
  </div>
);

export default CartEmptyState;
