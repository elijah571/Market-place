import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../OrderStyles/MyOrders.css';

const MyOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await apiClient.get('/orders?limit=100&page=1');
        setOrders(data?.orders || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      <PageTitle title="My Orders" />
      <Navbar />
      <div className="my-orders-container">
        <h1>My Orders</h1>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <p className="no-order-message">No orders yet</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-8)}</td>
                    <td>{order.orderStatus}</td>
                    <td>{order.paymentInfo?.status || 'Pending'}</td>
                    <td>${order.totalPrice}</td>
                    <td>
                      <Link className="order-link" to={`/orders/${order._id}`}>
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;
