import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../OrderStyles/OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await apiClient.get(`/order/${id}`);
        setOrder(data?.order || null);
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

  return (
    <>
      <PageTitle title={`Order ${order._id.slice(-6)}`} />
      <Navbar />
      <div className="order-box">
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
                    {order.orderStatus}
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
                    {order.paymentInfo?.status || 'Pending'}
                  </span>
                </td>
                <td className="table-cell">${order.totalPrice}</td>
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
                  <td className="table-cell">${item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default OrderDetails;
