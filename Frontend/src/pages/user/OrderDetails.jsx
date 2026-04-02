import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
import '../../OrderStyles/OrderDetails.css';
import Footer from '../../components/Footer';
import { accountService } from '../../services/account.service';
import { formatCurrency, formatDate, sentenceCase } from '../../utils/formatters';

const orderStatuses = ['PendingPayment', 'Processing', 'Shipped', 'Delivered'];

const OrderDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await accountService.getOrderDetails(id);
        setOrder(data?.data || null);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <p style={{ marginTop: '90px', textAlign: 'center' }}>Loading order...</p>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <p style={{ marginTop: '90px', textAlign: 'center' }}>Order not found</p>
      </>
    );
  }

  const currentStatusIndex = orderStatuses.indexOf(order.orderStatus);

  return (
    <>
      <PageTitle title={`Order ${order._id.slice(-6)}`} />
      <Navbar />
      <div className="order-box">
        <div className="order-tracker">
          {orderStatuses.map((status, index) => (
            <div
              key={status}
              className={`order-tracker-step ${currentStatusIndex >= index ? 'active' : ''}`}
            >
              <span>{status}</span>
            </div>
          ))}
        </div>
        <div className="table-block">
          <h2 className="table-title">Order Summary</h2>
          <table className="table-main">
            <thead className="table-head">
              <tr>
                <th className="head-cell">Order ID</th>
                <th className="head-cell">Status</th>
                <th className="head-cell">Payment</th>
                <th className="head-cell">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row">
                <td className="table-cell">#{order._id.slice(-8)}</td>
                <td className="table-cell">
                  <span className={`status-tag ${order.orderStatus.toLowerCase()}`}>
                    {sentenceCase(order.orderStatus)}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className={`pay-tag ${
                      String(order.paymentInfo?.status).toLowerCase() === 'paid'
                        ? 'paid'
                        : 'not-paid'
                    }`}
                  >
                    {sentenceCase(order.paymentInfo?.status || 'Pending')}
                  </span>
                </td>
                <td className="table-cell">{formatCurrency(order.totalPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="table-block">
          <h2 className="table-title">Items</h2>
          <table className="table-main">
            <thead className="table-head">
              <tr>
                <th className="head-cell">Image</th>
                <th className="head-cell">Name</th>
                <th className="head-cell">Qty</th>
                <th className="head-cell">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr className="table-row" key={`${item.product}-${item.variantId || ''}`}>
                  <td className="table-cell">
                    <img src={item.image} alt={item.name} className="item-img" />
                  </td>
                  <td className="table-cell">{item.name}</td>
                  <td className="table-cell">{item.quantity}</td>
                  <td className="table-cell">{formatCurrency(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-block">
          <h2 className="table-title">Shipping Details</h2>
          <p>
            {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.state},{' '}
            {order.shippingInfo.country}
          </p>
          <p>
            Order created on {formatDate(order.createdAt)}
            {order.deliveredAt ? ` and delivered on ${formatDate(order.deliveredAt)}` : ''}
          </p>
          {order.promoCode ? <p>Promo applied: {order.promoCode}</p> : null}
        </div>
        {(order.statusTimeline || []).length > 0 ? (
          <div className="table-block">
            <h2 className="table-title">Timeline</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {order.statusTimeline.map((entry, index) => (
                <div
                  key={`${entry.type}-${entry.status}-${entry.createdAt || index}`}
                  style={{
                    display: 'grid',
                    gap: '0.15rem',
                    padding: '0.85rem 1rem',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '14px',
                  }}
                >
                  <strong>
                    {sentenceCase(entry.type)}: {sentenceCase(entry.status)}
                  </strong>
                  <span>{entry.note || 'Status updated'}</span>
                  <small>{formatDate(entry.createdAt)}</small>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </>
  );
};

export default OrderDetails;
