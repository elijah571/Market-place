import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import '../CartStyles/Cart.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  applyPromo,
  cartSelectors,
  clearPromo,
  fetchCart,
  removeFromCart,
  setCartError,
  syncCartWithServer,
  updateCartQuantity,
} from '../features/cart/cartSlice';
import { promotionService } from '../services/promotion.service';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);
  const promo = useSelector((state) => state.cart.promo);
  const cartIssues = useSelector((state) => state.cart.issues);
  const syncing = useSelector((state) => state.cart.syncing);
  const lastSyncedAt = useSelector((state) => state.cart.lastSyncedAt);
  const { isAuthenticated } = useSelector((state) => state.user);
  const [promoCode, setPromoCode] = useState(promo?.code || '');
  const [availablePromos, setAvailablePromos] = useState([]);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const syncTimeoutRef = useRef(null);

  const subtotal = useSelector(cartSelectors.getSubtotal);
  const shippingPrice = useSelector(cartSelectors.getShippingFee);
  const taxPrice = useSelector(cartSelectors.getTaxFee);
  const discountPrice = useSelector(cartSelectors.getDiscountFee);
  const totalPrice = useSelector(cartSelectors.getTotal);
  const hasBlockingIssues = useSelector(cartSelectors.hasBlockingIssues);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    promotionService
      .getPromotions()
      .then((data) => setAvailablePromos(data.slice(0, 3)))
      .catch(() => setAvailablePromos([]));
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const queueServerSync = (payload = {}) => {
    if (!isAuthenticated) {
      return;
    }

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      dispatch(syncCartWithServer(payload));
    }, 250);
  };

  const handleQuantity = (cartKey, quantity, maxStock) => {
    if (quantity < 1 || quantity > maxStock) return;
    dispatch(updateCartQuantity({ cartKey, quantity }));
    queueServerSync();
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Enter a promo code to apply');
      return;
    }

    setApplyingPromo(true);
    try {
      const promoData = await promotionService.validatePromoCode({
        promoCode: promoCode.trim(),
        subtotal,
        shippingPrice,
      });
      dispatch(applyPromo(promoData));
      if (isAuthenticated) {
        await dispatch(syncCartWithServer({ promoCode: promoData.code })).unwrap();
      }
      toast.success('Promo code applied');
    } catch (error) {
      dispatch(clearPromo());
      toast.error(
        error.response?.data?.message || error || 'Promo code could not be applied'
      );
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      dispatch(setCartError('Please login to proceed to checkout'));
      navigate('/login');
      return;
    }

    try {
      await dispatch(syncCartWithServer()).unwrap();
      navigate('/checkout');
    } catch (error) {
      toast.error(error || 'Unable to prepare checkout');
    }
  };

  if (!items.length) {
    return (
      <>
        <PageTitle title="Cart" />
        <div className="empty-cart-container page-shell page-shell--narrow">
          <p className="empty-cart-message">Your cart is empty.</p>
          <Link to="/products" className="viewProducts">
            View Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Cart" />
      <div className="cart-page page-shell">
        <div className="cart-items">
          <div className="cart-title-row">
            <div>
              <p className="cart-kicker">Cart</p>
              <h2 className="cart-items-heading">Review your basket before checkout</h2>
            </div>
            <span className="cart-items-count">
              {syncing ? 'Syncing...' : `${items.length} items`}
            </span>
          </div>
          {cartIssues.length > 0 && (
            <div className="promo-active-row" style={{ marginBottom: '1rem' }}>
              <span>
                {cartIssues.map((issue) => issue.message).join(' ')}
              </span>
            </div>
          )}
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
                    <p className="item-price">{formatCurrency(item.price)}</p>
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
                <p className="item-total">{formatCurrency(item.price * item.quantity)}</p>
                <div className="item-actions">
                  <button
                    className="remove-item-btn"
                    onClick={() => {
                      dispatch(removeFromCart(cartKey));
                      queueServerSync();
                    }}
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
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-item">
            <span>Shipping</span>
            <span>{formatCurrency(shippingPrice)}</span>
          </div>
          <div className="summary-item">
            <span>Tax</span>
            <span>{formatCurrency(taxPrice)}</span>
          </div>
          <div className="promo-box">
            <label htmlFor="promo-code">Promo code</label>
            <div className="promo-input-row">
              <input
                id="promo-code"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                placeholder="Enter code"
              />
              <button type="button" onClick={handleApplyPromo} disabled={applyingPromo}>
                {applyingPromo ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {promo ? (
              <div className="promo-active-row">
                <span>
                  {promo.code} applied: -{formatCurrency(promo.discountAmount)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(clearPromo());
                    queueServerSync({ promoCode: '' });
                  }}
                >
                  Remove
                </button>
              </div>
            ) : null}
            {availablePromos.length > 0 ? (
              <div className="promo-suggestions">
                {availablePromos.map((item) => (
                  <button
                    type="button"
                    key={item.code}
                    onClick={() => setPromoCode(item.code)}
                    className="promo-suggestion-pill"
                  >
                    {item.code}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {discountPrice > 0 && (
            <div className="summary-item discount">
              <span>Discount</span>
              <span>-{formatCurrency(discountPrice)}</span>
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <button
            className="checkout-btn"
            disabled={syncing || hasBlockingIssues}
            onClick={handleCheckout}
          >
            {syncing ? 'Syncing cart...' : hasBlockingIssues ? 'Resolve cart issues' : 'Checkout'}
          </button>
          {lastSyncedAt ? (
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>
              Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Cart;
