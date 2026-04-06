import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../components/PageTitle';
import '../CartStyles/Cart.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  applyPromo,
  cartSelectors,
  clearCart,
  clearPromo,
  fetchCart,
  removeFromCart,
  setCartError,
  updateCartQuantity,
} from '../features/cart/cartSlice';
import { promotionService } from '../services/promotion.service';
import { toast } from 'react-toastify';
import CartEmptyState from '../components/cart/CartEmptyState';
import CartLineItem from '../components/cart/CartLineItem';
import CartSummaryPanel from '../components/cart/CartSummaryPanel';
import { useCartServerSync } from '../features/cart/useCartServerSync';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);
  const promo = useSelector((state) => state.cart.promo);
  const cartIssues = useSelector((state) => state.cart.issues);
  const syncing = useSelector((state) => state.cart.syncing);
  const lastSyncedAt = useSelector((state) => state.cart.lastSyncedAt);
  const lastError = useSelector((state) => state.cart.lastError);
  const { isAuthenticated } = useSelector((state) => state.user);
  const [promoCode, setPromoCode] = useState(promo?.code || '');
  const [availablePromos, setAvailablePromos] = useState([]);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const { queueSync } = useCartServerSync();

  const subtotal = useSelector(cartSelectors.getSubtotal);
  const shippingPrice = useSelector(cartSelectors.getShippingFee);
  const taxPrice = useSelector(cartSelectors.getTaxFee);
  const discountPrice = useSelector(cartSelectors.getDiscountFee);
  const totalPrice = useSelector(cartSelectors.getTotal);
  const hasBlockingIssues = useSelector(cartSelectors.hasBlockingIssues);
  const itemCount = useSelector(cartSelectors.getItemCount);

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
    setPromoCode(promo?.code || '');
  }, [promo?.code]);

  const handleQuantity = (cartKey, quantity, maxStock) => {
    const hasStockLimit = Number.isFinite(maxStock) && maxStock > 0;
    if (quantity < 1 || (hasStockLimit && quantity > maxStock)) return;
    dispatch(updateCartQuantity({ cartKey, quantity }));
    queueSync();
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
        queueSync({ promoCode: promoData.code });
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

    navigate('/checkout');
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    queueSync({ items: [], promoCode: '' });
    toast.info('Cart cleared');
  };

  if (!items.length) {
    return (
      <>
        <PageTitle title="Cart" />
        <CartEmptyState isAuthenticated={isAuthenticated} />
      </>
    );
  }

  return (
    <>
      <PageTitle title="Cart" />
      <div className="cart-page page-shell">
        <section className="cart-items">
          <div className="cart-title-row">
            <div>
              <p className="cart-kicker">Cart</p>
              <h2 className="cart-items-heading">Review your basket before checkout</h2>
              <p className="cart-subtitle">
                Your cart updates instantly and stays available across refreshes and routes.
              </p>
            </div>
            <span className="cart-items-count">
              {syncing ? 'Syncing...' : `${itemCount} items`}
            </span>
          </div>
          {cartIssues.length > 0 ? (
            <div className="cart-feedback-stack">
              {cartIssues.map((issue) => (
                <div key={`${issue.code}-${issue.product || 'global'}`} className="cart-alert-row">
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          ) : null}
          {lastError ? (
            <div className="cart-feedback-stack">
              <div className="cart-alert-row cart-alert-row--error">
                <span>{lastError}</span>
              </div>
            </div>
          ) : null}
          <div className="cart-card-list">
            {items.map((item) => {
              const cartKey = cartSelectors.getItemKey(item);
              return (
                <CartLineItem
                  key={cartKey}
                  item={item}
                  cartKey={cartKey}
                  syncing={syncing}
                  onDecrease={() => handleQuantity(cartKey, item.quantity - 1, item.stock)}
                  onIncrease={() => handleQuantity(cartKey, item.quantity + 1, item.stock)}
                  onRemove={() => {
                    dispatch(removeFromCart(cartKey));
                    queueSync();
                  }}
                />
              );
            })}
          </div>
        </section>
        <CartSummaryPanel
          itemCount={itemCount}
          subtotal={subtotal}
          shippingPrice={shippingPrice}
          taxPrice={taxPrice}
          discountPrice={discountPrice}
          totalPrice={totalPrice}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          applyingPromo={applyingPromo}
          onApplyPromo={handleApplyPromo}
          promo={promo}
          onRemovePromo={() => {
            dispatch(clearPromo());
            queueSync({ promoCode: '' });
          }}
          availablePromos={availablePromos}
          onSelectPromo={setPromoCode}
          syncing={syncing}
          hasBlockingIssues={hasBlockingIssues}
          onCheckout={handleCheckout}
          onClearCart={handleClearCart}
          lastSyncedAt={lastSyncedAt}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </>
  );
};

export default Cart;
