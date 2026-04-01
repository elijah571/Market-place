import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTitle from '../components/PageTitle';
import '../CartStyles/Cart.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  cartSelectors,
  removeFromCart,
  updateCartQuantity,
  setCartError,
} from '../features/cart/cartSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);
  const { isAuthenticated } = useSelector((state) => state.user);

  const subtotal = useSelector(cartSelectors.getSubtotal);
  const shippingPrice = useSelector(cartSelectors.getShippingFee);
  const taxPrice = useSelector(cartSelectors.getTaxFee);
  const totalPrice = Number((subtotal + shippingPrice + taxPrice).toFixed(2));

  const handleQuantity = (cartKey, quantity, maxStock) => {
    if (quantity < 1 || quantity > maxStock) return;
    dispatch(updateCartQuantity({ cartKey, quantity }));
  };

  if (!items.length) {
    return (
      <>
        <PageTitle title="Cart" />
        <Navbar />
        <div className="empty-cart-container">
          <p className="empty-cart-message">Your cart is empty.</p>
          <Link to="/products" className="viewProducts">
            View Products
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <PageTitle title="Cart" />
      <Navbar />
      <div className="cart-page">
        <div className="cart-items">
          <h2 className="cart-items-heading">Shopping Cart</h2>
          <div className="cart-table-header">
            <span>Product</span>
            <span>Qty</span>
            <span>Total</span>
            <span>Action</span>
          </div>
          {items.map((item) => {
            const cartKey = cartSelectors.getItemKey(item);
            return (
              <div className="cart-item" key={cartKey}>
                <div className="item-info">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p className="item-price">${item.price}</p>
                    {(item.selectedColor || item.selectedSize) && (
                      <p className="item-price">
                        {item.selectedColor} {item.selectedSize}
                      </p>
                    )}
                  </div>
                </div>
                <div className="quantity-controls">
                  <button
                    className="quantity-button"
                    onClick={() => handleQuantity(cartKey, item.quantity - 1, item.stock)}
                  >
                    -
                  </button>
                  <input className="quantity-input" readOnly value={item.quantity} />
                  <button
                    className="quantity-button"
                    onClick={() => handleQuantity(cartKey, item.quantity + 1, item.stock)}
                  >
                    +
                  </button>
                </div>
                <p className="item-total">${(item.price * item.quantity).toFixed(2)}</p>
                <div className="item-actions">
                  <button
                    className="remove-item-btn"
                    onClick={() => dispatch(removeFromCart(cartKey))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="price-summary">
          <h3 className="price-summary-heading">Summary</h3>
          <div className="summary-item">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span>Shipping</span>
            <span>${shippingPrice.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span>Tax</span>
            <span>${taxPrice.toFixed(2)}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <button
            className="checkout-btn"
            onClick={() => {
              if (!isAuthenticated) {
                dispatch(setCartError('Please login to proceed to checkout'));
                return navigate('/login');
              }
              navigate('/checkout');
            }}
          >
            Checkout
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
