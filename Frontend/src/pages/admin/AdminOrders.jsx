import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/OrdersList.css';
import {
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
  sentenceCase,
} from '../../utils/formatters';

const getOrderTone = (status = '') => {
  const normalized = String(status).toLowerCase();

  if (['delivered', 'paid'].includes(normalized)) return 'success';
  if (['processing', 'shipped', 'pendingpayment', 'pending'].includes(normalized)) return 'warning';
  if (['cancelled', 'failed', 'refunded'].includes(normalized)) return 'danger';

  return 'info';
};

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
  const currentPage = meta.page || filters.page;
  const summary = useMemo(
    () => ({
      paid: orders.filter(
        (order) => String(order.paymentInfo?.status || '').toLowerCase() === 'paid'
      ).length,
      delivered: orders.filter((order) => order.orderStatus === 'Delivered').length,
      processing: orders.filter((order) => order.orderStatus === 'Processing').length,
      revenue: orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    }),
    [orders]
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
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Fulfilment desk"
          title="Orders"
          description="Filter by payment or delivery state, spot delayed fulfilment, and move orders forward from a clearer operations queue."
          meta={
            <>
              <AdminStatusBadge tone="info">
                {meta.totalOrders
                  ? formatCompactNumber(meta.totalOrders)
                  : formatCompactNumber(orders.length)} total
              </AdminStatusBadge>
              <AdminStatusBadge tone="success">{summary.paid} paid</AdminStatusBadge>
              <AdminStatusBadge tone="warning">{summary.processing} processing</AdminStatusBadge>
            </>
          }
        />

        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Visible orders</p>
            <p className="admin-stat-card__value">{formatCompactNumber(orders.length)}</p>
            <p className="admin-stat-card__meta">Current result set for the chosen filters.</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Delivered</p>
            <p className="admin-stat-card__value">{summary.delivered}</p>
            <p className="admin-stat-card__meta">Orders completed inside the loaded page scope.</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Revenue on page</p>
            <p className="admin-stat-card__value">{formatCurrency(summary.revenue)}</p>
            <p className="admin-stat-card__meta">Combined total across loaded results.</p>
          </article>
        </section>

        <section className="admin-table-shell">
          <div className="admin-table-shell__header">
            <div>
              <p className="admin-panel__eyebrow">Order filters</p>
              <h2 className="admin-table-shell__title">Operations queue</h2>
            </div>
          </div>

          <div className="admin-filter-bar ordersList-filters">
            <input
              className="admin-input"
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
              className="admin-select"
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
              className="admin-select"
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
            <div className="admin-loading-state">
              <p>Loading orders...</p>
            </div>
          ) : (
            <div className="admin-table-shell__inner">
              <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Created</th>
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
                      <td>
                        <p className="admin-table__primary">#{order._id.slice(-8)}</p>
                        <p className="admin-table__secondary">{order.promoCode || 'No promo code'}</p>
                      </td>
                      <td>
                        <AdminStatusBadge tone={getOrderTone(order.orderStatus)}>
                          {sentenceCase(order.orderStatus)}
                        </AdminStatusBadge>
                      </td>
                      <td>
                        <AdminStatusBadge tone={getOrderTone(paymentStatus)}>
                          {sentenceCase(paymentStatus)}
                        </AdminStatusBadge>
                      </td>
                      <td>{formatCurrency(order.totalPrice)}</td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <div className="admin-table__actions">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="admin-btn admin-btn--primary"
                          >
                            Update
                          </Link>
                          <button
                            className="admin-btn admin-btn--ghost"
                            disabled={!isPaid || delivered}
                            onClick={() => markDelivered(order._id)}
                            title={!isPaid ? 'Payment must be completed first' : 'Mark delivered'}
                            type="button"
                          >
                            {delivered ? 'Delivered' : 'Mark Delivered'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}

          {!loading && meta.totalPage > 1 ? (
            <div className="admin-pagination">
              <span className="admin-muted">
                Page {currentPage} of {meta.totalPage}
                {meta.totalOrders ? ` (${meta.totalOrders} orders)` : ''}
              </span>
              <div className="admin-table__actions">
              <button
                  className="admin-btn admin-btn--ghost"
                type="button"
                  disabled={currentPage <= 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Previous
              </button>
              <button
                  className="admin-btn admin-btn--primary"
                type="button"
                  disabled={currentPage >= (meta.totalPage || 1)}
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
        </section>
      </div>
    </>
  );
};

export default AdminOrders;
