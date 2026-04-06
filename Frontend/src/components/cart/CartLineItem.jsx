import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const CartLineItem = ({
  item,
  cartKey,
  syncing,
  onDecrease,
  onIncrease,
  onRemove,
}) => {
  const variantLabel = [item.selectedColor, item.selectedSize].filter(Boolean).join(' / ');
  const stockStatus =
    item.stock > 0
      ? item.quantity >= item.stock
        ? `Max available quantity reached (${item.stock})`
        : `${item.stock} in stock`
      : 'Availability will be confirmed at checkout';

  return (
    <article className="cart-item-card" aria-labelledby={`cart-item-${cartKey}`}>
      <Link to={`/product/${item.productId || item.product}`} className="cart-item-media-link">
        <img src={item.image} alt={item.name} className="item-image" />
      </Link>

      <div className="cart-item-main">
        <div className="cart-item-copy">
          <div className="cart-item-header">
            <div>
              <p className="cart-item-label">In your cart</p>
              <Link
                to={`/product/${item.productId || item.product}`}
                className="cart-item-name-link"
                id={`cart-item-${cartKey}`}
              >
                {item.name}
              </Link>
            </div>
            <strong className="item-total">{formatCurrency(item.price * item.quantity)}</strong>
          </div>

          <div className="cart-item-meta">
            <span className="item-price">{formatCurrency(item.price)} each</span>
            {variantLabel ? <span className="cart-item-chip">{variantLabel}</span> : null}
            <span className="cart-item-chip cart-item-chip--muted">{stockStatus}</span>
          </div>
        </div>

        <div className="cart-item-controls">
          <div className="quantity-controls" role="group" aria-label={`Quantity for ${item.name}`}>
            <button
              type="button"
              className="quantity-button"
              disabled={syncing || item.quantity <= 1}
              onClick={onDecrease}
              aria-label={`Decrease quantity for ${item.name}`}
            >
              -
            </button>
            <input
              className="quantity-input"
              readOnly
              value={item.quantity}
              aria-label={`Selected quantity for ${item.name}`}
            />
            <button
              type="button"
              className="quantity-button"
              disabled={syncing || (item.stock > 0 && item.quantity >= item.stock)}
              onClick={onIncrease}
              aria-label={`Increase quantity for ${item.name}`}
            >
              +
            </button>
          </div>

          <div className="item-actions">
            <button
              type="button"
              className="remove-item-btn"
              onClick={onRemove}
              disabled={syncing}
              aria-label={`Remove ${item.name} from cart`}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CartLineItem;
