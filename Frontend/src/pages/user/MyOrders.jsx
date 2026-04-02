import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import '../../OrderStyles/MyOrders.css';
import { accountService } from '../../services/account.service';
import { formatCurrency, formatDate, sentenceCase } from '../../utils/formatters';

const MyOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPage: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    search: '',
    page: 1,
    limit: 10,
  });
  const deferredSearch = useDeferredValue(filters.search);
  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: deferredSearch,
    }),
    [deferredSearch, filters]
  );

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await accountService.getMyOrders(queryFilters);
        setOrders(data?.data || []);
        setMeta(data?.meta || { page: 1, totalPage: 1, total: 0 });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [queryFilters]);

  return (
    <>
      <PageTitle title="My Orders" />
      <div className="my-orders-container page-shell">
        <div className="orders-page-header">
          <div>
            <p className="orders-kicker">Orders</p>
            <h1>Track your purchase history</h1>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            marginBottom: '1.5rem',
          }}
        >
          <input
            placeholder="Search item or promo"
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
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-8)}</td>
                    <td>{sentenceCase(order.orderStatus)}</td>
                    <td>{sentenceCase(order.paymentInfo?.status || 'Pending')}</td>
                    <td>{formatCurrency(order.totalPrice)}</td>
                    <td>{formatDate(order.createdAt)}</td>
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
              Page {meta.page || filters.page} of {meta.totalPage} {meta.total ? `(${meta.total} orders)` : ''}
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

export default MyOrders;
