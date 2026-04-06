import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UpdateOrder.css';
import { formatCurrency, formatDateTime, sentenceCase } from '../../utils/formatters';

const getStatusTone = (value = '') => {
  const normalized = String(value).toLowerCase();

  if (['delivered', 'paid'].includes(normalized)) return 'success';
  if (['processing', 'shipped', 'pendingpayment', 'pending'].includes(normalized)) return 'warning';
  if (['cancelled', 'failed', 'refunded'].includes(normalized)) return 'danger';

  return 'info';
};

const AdminUpdateOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('Processing');

  const itemCount = useMemo(
    () => order?.orderItems?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0,
    [order]
  );

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await apiClient.get(`/admin/order/${id}`);
        setOrder(data?.data || null);
        setStatus(data?.data?.orderStatus || 'Processing');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const onUpdate = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/admin/order/${id}`, { status });
      toast.success('Order updated successfully');
      navigate('/admin/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-state surface-card">
        <p>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-empty-state surface-card">
        <p>Order not found.</p>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Update Order" />
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Order workflow"
          title={`Order #${order._id.slice(-8)}`}
          description="Review core order facts, scan purchased items, and update fulfilment status from one focused workflow."
          meta={
            <>
              <AdminStatusBadge tone={getStatusTone(order.orderStatus)}>
                {sentenceCase(order.orderStatus)}
              </AdminStatusBadge>
              <AdminStatusBadge tone={getStatusTone(order.paymentInfo?.status || 'Pending')}>
                {sentenceCase(order.paymentInfo?.status || 'Pending')}
              </AdminStatusBadge>
              <AdminStatusBadge tone="info">{itemCount} items</AdminStatusBadge>
            </>
          }
          actions={
            <div className="admin-header-actions">
              <Link className="admin-btn admin-btn--ghost" to="/admin/orders">
                Back to orders
              </Link>
            </div>
          }
        />

        <section className="admin-detail-grid">
          <article className="admin-detail-card">
            <div className="admin-detail-card__group">
              <p className="admin-panel__eyebrow">Order summary</p>
              <h2 className="admin-panel__title">Overview</h2>
            </div>
            <div className="admin-detail-card__meta">
              <div className="admin-detail-card__meta-row">
                <span className="admin-detail-card__label">Order ID</span>
                <span className="admin-detail-card__value">#{order._id.slice(-8)}</span>
              </div>
              <div className="admin-detail-card__meta-row">
                <span className="admin-detail-card__label">Placed</span>
                <span className="admin-detail-card__value">{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="admin-detail-card__meta-row">
                <span className="admin-detail-card__label">Total</span>
                <span className="admin-detail-card__value">{formatCurrency(order.totalPrice)}</span>
              </div>
              <div className="admin-detail-card__meta-row">
                <span className="admin-detail-card__label">Payment status</span>
                <span className="admin-detail-card__value">
                  {sentenceCase(order.paymentInfo?.status || 'Pending')}
                </span>
              </div>
              <div className="admin-detail-card__meta-row">
                <span className="admin-detail-card__label">Gateway</span>
                <span className="admin-detail-card__value">
                  {order.paymentInfo?.gateway || 'Not available'}
                </span>
              </div>
            </div>
          </article>

          <article className="admin-detail-card">
            <div className="admin-detail-card__group">
              <p className="admin-panel__eyebrow">Status update</p>
              <h2 className="admin-panel__title">Fulfilment action</h2>
              <p className="admin-panel__subtitle">
                Move the order forward once payment and shipping checks are complete.
              </p>
            </div>

            <div className="admin-field">
              <label htmlFor="order-status">Status</label>
              <select
                id="order-status"
                className="admin-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="admin-form-actions">
              <button
                className="admin-btn admin-btn--primary"
                disabled={saving}
                onClick={onUpdate}
                type="button"
              >
                {saving ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </article>
        </section>

        <section className="admin-table-shell">
          <div className="admin-table-shell__header">
            <div>
              <p className="admin-panel__eyebrow">Purchased items</p>
              <h2 className="admin-table-shell__title">Order lines</h2>
            </div>
          </div>

          <div className="admin-table-shell__inner">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item) => (
                  <tr key={`${item.product}-${item.variantId || ''}`}>
                    <td>
                      <div className="admin-product-cell">
                        <img src={item.image} alt={item.name} className="order-item-image" />
                        <div>
                          <p className="admin-table__primary">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.selectedColor || item.selectedSize ? (
                        <span className="admin-table__secondary">
                          {item.selectedColor || 'Default'} / {item.selectedSize || 'Default'}
                        </span>
                      ) : (
                        <span className="admin-table__secondary">Default item</span>
                      )}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
};

export default AdminUpdateOrder;
