import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const CartSummaryPanel = ({
  itemCount,
  subtotal,
  shippingPrice,
  taxPrice,
  discountPrice,
  totalPrice,
  promoCode,
  onPromoCodeChange,
  applyingPromo,
  onApplyPromo,
  promo,
  onRemovePromo,
  availablePromos,
  onSelectPromo,
  syncing,
  hasBlockingIssues,
  onCheckout,
  onClearCart,
  lastSyncedAt,
  isAuthenticated,
}) => (
  <aside className="price-summary" aria-label="Cart summary">
    <div className="cart-summary-hero">
      <div>
        <p className="cart-kicker">Summary</p>
        <h3 className="price-summary-heading">Ready when you are</h3>
      </div>
      <span className="cart-items-count">
        {syncing ? 'Syncing...' : `${itemCount} items`}
      </span>
    </div>

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
          onChange={(event) => onPromoCodeChange(event.target.value.toUpperCase())}
          placeholder="Enter code"
        />
        <button type="button" onClick={onApplyPromo} disabled={applyingPromo || syncing}>
          {applyingPromo ? 'Applying...' : 'Apply'}
        </button>
      </div>
      {promo ? (
        <div className="promo-active-row">
          <span>
            {promo.code} applied: -{formatCurrency(promo.discountAmount)}
          </span>
          <button type="button" onClick={onRemovePromo} disabled={syncing}>
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
              onClick={() => onSelectPromo(item.code)}
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

    <div className="cart-summary-actions">
      <button
        className="checkout-btn"
        disabled={syncing || hasBlockingIssues}
        onClick={onCheckout}
      >
        {syncing
          ? 'Syncing cart...'
          : hasBlockingIssues
            ? 'Resolve cart issues'
            : isAuthenticated
              ? 'Proceed to checkout'
              : 'Sign in to checkout'}
      </button>
      <button
        type="button"
        className="cart-secondary-btn"
        onClick={onClearCart}
        disabled={syncing}
      >
        Clear cart
      </button>
    </div>

    {lastSyncedAt ? (
      <p className="cart-sync-note">
        Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
      </p>
    ) : null}
  </aside>
);

export default CartSummaryPanel;
