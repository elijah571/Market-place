import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/OrdersList.css';

const AdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPage: 1, totalOrders: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    page: 1,
    limit: 20,
  });
  const deferredSearch = useDeferredValue(filters.search);
  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: deferredSearch,
    }),
    [deferredSearch, filters]
  );

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      Object.entries(queryFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });

      const { data } = await apiClient.get(`/admin/order?${params.toString()}`);
      setOrders(data?.data || []);
      setMeta(data?.meta || { page: 1, totalPage: 1, totalOrders: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [queryFilters]);

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
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            marginBottom: '1.5rem',
          }}
        >
          <input
            placeholder="Search item, promo, or payment ref"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
                page: 1,
              }))
            }
          />
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All order statuses</option>
            <option value="PendingPayment">Pending payment</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                paymentStatus: event.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All payment statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

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
        {!loading && meta.totalPage > 1 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              gap: '1rem',
            }}
          >
            <span>
              Page {meta.page || filters.page} of {meta.totalPage}
              {meta.totalOrders ? ` (${meta.totalOrders} orders)` : ''}
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={(meta.page || filters.page) <= 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Previous
              </button>
              <button
                type="button"
                disabled={(meta.page || filters.page) >= (meta.totalPage || 1)}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(meta.totalPage || prev.page, prev.page + 1),
                  }))
                }
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default AdminOrders;
