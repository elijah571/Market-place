import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageTitle from '../components/PageTitle';
import CheckoutPath from '../components/CheckoutPath';
import '../CartStyles/OrderConfirm.css';

const OrderConfirm = () => {
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);
  const shipping = useSelector((state) => state.cart.shippingInfo);

  return (
    <>
      <PageTitle title="Order Confirm" />
      <CheckoutPath activeStep={1} />
      <div className="confirm-container page-shell">
        <h1 className="confirm-header">Confirm Order</h1>
        <div className="confirm-table-container">
          <table className="confirm-table">
            <caption>Shipping Information</caption>
            <tbody>
              <tr>
                <th>Address</th>
                <td>{shipping.address || '-'}</td>
              </tr>
              <tr>
                <th>City / State</th>
                <td>
                  {shipping.city || '-'} / {shipping.state || '-'}
                </td>
              </tr>
              <tr>
                <th>Country</th>
                <td>{shipping.country || '-'}</td>
              </tr>
            </tbody>
          </table>
          <table className="confirm-table">
            <caption>Order Items</caption>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.productId}-${item.variantId || ''}`}>
                  <td>
                    <img src={item.image} alt={item.name} className="order-product-image" />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="proceed-button" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
      </div>
    </>
  );
};

export default OrderConfirm;
