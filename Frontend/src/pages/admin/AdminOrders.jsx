import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/OrdersList.css';

const AdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/order?limit=100&page=1');
      setOrders(data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const markDelivered = async (orderId) => {
    try {
      await apiClient.put(`/admin/order/${orderId}`, { status: 'Delivered' });
      toast.success('Order marked as delivered');
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: 'Delivered', deliveredAt: new Date().toISOString() }
            : order
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update order status');
    }
  };

  return (
    <>
      <PageTitle title="Admin Orders" />
      <div className="ordersList-container page-shell">
        <h2 className="ordersList-title">Orders</h2>

        {loading ? (
          <p className="loading-message">Loading orders...</p>
        ) : (
          <div className="ordersList-table-container">
            <table className="ordersList-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const paymentStatus = order.paymentInfo?.status || 'Pending';
                  const isPaid = String(paymentStatus).toLowerCase() === 'paid';
                  const delivered = order.orderStatus === 'Delivered';

                  return (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-8)}</td>
                      <td>{order.orderStatus}</td>
                      <td>{paymentStatus}</td>
                      <td>${order.totalPrice}</td>
                      <td>
                        <Link to={`/admin/orders/${order._id}`} className="edit-icon">
                          Update
                        </Link>
                        <button
                          className="edit-icon"
                          disabled={!isPaid || delivered}
                          onClick={() => markDelivered(order._id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                          title={!isPaid ? 'Payment must be completed first' : 'Mark delivered'}
                        >
                          {delivered ? 'Delivered' : 'Mark Delivered'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOrders;
