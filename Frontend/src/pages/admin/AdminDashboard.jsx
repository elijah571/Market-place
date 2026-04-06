import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import '../../AdminStyles/Dashboard.css';
import { adminService } from '../../services/admin.service';
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
  sentenceCase,
} from '../../utils/formatters';

const emptyDashboard = {
  overview: {},
  breakdowns: {
    orderStatus: [],
    paymentStatus: [],
    categories: [],
  },
  charts: {
    salesTrend: [],
  },
  spotlight: {
    recentUsers: [],
    recentOrders: [],
    recentProducts: [],
    topViewedProducts: [],
    topSellingProducts: [],
  },
};

const getStatusTone = (value = '') => {
  const normalized = String(value).toLowerCase();

  if (['delivered', 'paid', 'verified'].includes(normalized)) return 'success';
  if (['processing', 'shipped', 'pendingpayment', 'pending'].includes(normalized)) return 'warning';
  if (['cancelled', 'failed', 'refunded'].includes(normalized)) return 'danger';

  return 'info';
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(emptyDashboard);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      setLoading(true);

      try {
        const data = await adminService.getDashboard();
        setDashboardData(data || emptyDashboard);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Revenue',
        value: formatCurrency(dashboardData.overview?.totalRevenue || 0),
        meta: `${formatCurrency(dashboardData.overview?.averageOrderValue || 0)} avg order value`,
      },
      {
        label: 'Orders',
        value: formatCompactNumber(dashboardData.overview?.orders || 0),
        meta: `${dashboardData.breakdowns?.orderStatus?.length || 0} tracked statuses`,
      },
      {
        label: 'Customers',
        value: formatCompactNumber(dashboardData.overview?.users || 0),
        meta: `${dashboardData.spotlight?.recentUsers?.length || 0} new accounts surfaced`,
      },
      {
        label: 'Catalog',
        value: formatCompactNumber(dashboardData.overview?.products || 0),
        meta: `${dashboardData.overview?.lowStockProducts || 0} low-stock alerts`,
      },
    ],
    [dashboardData]
  );

  const salesTrend = dashboardData.charts?.salesTrend || [];
  const maxRevenue = Math.max(...salesTrend.map((item) => Number(item.revenue || 0)), 1);
  const latestSalesPoint = salesTrend[salesTrend.length - 1];

  return (
    <>
      <PageTitle title="Admin Dashboard" />
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Admin analytics"
          title="Store performance at a glance"
          description="A calmer, denser overview for revenue, fulfilment, catalog movement, and the activity that needs attention first."
          meta={
            <>
              <AdminStatusBadge tone="info">Last 30 days</AdminStatusBadge>
              <AdminStatusBadge tone="warning">
                {dashboardData.overview?.lowStockProducts || 0} stock alerts
              </AdminStatusBadge>
              <AdminStatusBadge tone="success">
                {formatCurrency(dashboardData.overview?.totalDiscounts || 0)} discounts applied
              </AdminStatusBadge>
            </>
          }
          actions={
            <div className="admin-header-actions">
              <Link to="/admin/products/new" className="admin-btn admin-btn--secondary">
                Add product
              </Link>
              <Link to="/admin/orders" className="admin-btn admin-btn--ghost">
                Review orders
              </Link>
              <Link to="/admin/users" className="admin-btn admin-btn--primary">
                Manage users
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="admin-loading-state surface-card">
            <p>Loading dashboard insights...</p>
          </div>
        ) : (
          <>
            <section className="admin-stat-grid">
              {stats.map((item) => (
                <article key={item.label} className="admin-stat-card">
                  <p className="admin-stat-card__label">{item.label}</p>
                  <p className="admin-stat-card__value">{item.value}</p>
                  <p className="admin-stat-card__meta">{item.meta}</p>
                </article>
              ))}
            </section>

            <section className="admin-grid admin-grid--two">
              <article className="admin-panel dashboard-hero-panel">
                <div className="admin-panel__header">
                  <div>
                    <p className="admin-panel__eyebrow">Revenue pulse</p>
                    <h2 className="admin-panel__title">Daily sales trend</h2>
                    <p className="admin-panel__subtitle">
                      Revenue and order movement across the current analytics window.
                    </p>
                  </div>
                  {latestSalesPoint ? (
                    <AdminStatusBadge tone="success">
                      {formatDate(latestSalesPoint.label)}
                    </AdminStatusBadge>
                  ) : null}
                </div>

                {salesTrend.length === 0 ? (
                  <div className="admin-empty-state">
                    <p>No sales trend data available yet.</p>
                  </div>
                ) : (
                  <div className="admin-mini-chart">
                    {salesTrend.slice(-7).map((item) => (
                      <div key={item.label} className="admin-mini-chart__row">
                        <span className="admin-mini-chart__label">{formatDate(item.label)}</span>
                        <div className="admin-mini-chart__track">
                          <div
                            className="admin-mini-chart__bar"
                            style={{
                              width: `${(Number(item.revenue || 0) / maxRevenue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="admin-mini-chart__value">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {latestSalesPoint ? (
                  <div className="dashboard-trend-summary">
                    <div>
                      <span className="dashboard-trend-summary__label">Latest day</span>
                      <strong>{formatCurrency(latestSalesPoint.revenue)}</strong>
                    </div>
                    <div>
                      <span className="dashboard-trend-summary__label">Orders</span>
                      <strong>{latestSalesPoint.orders || 0}</strong>
                    </div>
                  </div>
                ) : null}
              </article>

              <article className="admin-panel">
                <div className="admin-panel__header">
                  <div>
                    <p className="admin-panel__eyebrow">Operational health</p>
                    <h2 className="admin-panel__title">Status distribution</h2>
                    <p className="admin-panel__subtitle">
                      Current order and payment flow broken down by status.
                    </p>
                  </div>
                </div>

                <div className="admin-inline-list">
                  {(dashboardData.breakdowns?.orderStatus || []).map((item) => (
                    <div key={item.label} className="admin-inline-item">
                      <div>
                        <p className="admin-inline-item__title">{sentenceCase(item.label)}</p>
                        <p className="admin-inline-item__meta">Order pipeline</p>
                      </div>
                      <AdminStatusBadge tone={getStatusTone(item.label)}>
                        {item.value}
                      </AdminStatusBadge>
                    </div>
                  ))}
                  {(dashboardData.breakdowns?.paymentStatus || []).map((item) => (
                    <div key={item.label} className="admin-inline-item">
                      <div>
                        <p className="admin-inline-item__title">{sentenceCase(item.label)}</p>
                        <p className="admin-inline-item__meta">Payment state</p>
                      </div>
                      <AdminStatusBadge tone={getStatusTone(item.label)}>
                        {item.value}
                      </AdminStatusBadge>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="admin-grid admin-grid--two">
              <article className="admin-panel">
                <div className="admin-panel__header">
                  <div>
                    <p className="admin-panel__eyebrow">Category momentum</p>
                    <h2 className="admin-panel__title">Top performing categories</h2>
                  </div>
                </div>

                <div className="admin-progress-list">
                  {(dashboardData.breakdowns?.categories || []).slice(0, 6).map((item) => {
                    const maxValue = Math.max(
                      ...(dashboardData.breakdowns?.categories || []).map((entry) => entry.value),
                      1
                    );

                    return (
                      <div key={item.label} className="admin-progress-row">
                        <div className="admin-progress-row__header">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                        <div className="admin-progress-row__track">
                          <div
                            className="admin-progress-row__bar"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel__header">
                  <div>
                    <p className="admin-panel__eyebrow">Top attention items</p>
                    <h2 className="admin-panel__title">Bestsellers and traffic leaders</h2>
                  </div>
                </div>

                <div className="dashboard-insight-columns">
                  <div className="admin-inline-list">
                    <h3 className="dashboard-section-title">Top viewed</h3>
                    {(dashboardData.spotlight?.topViewedProducts || []).slice(0, 4).map((product) => (
                      <div key={product._id} className="admin-inline-item">
                        <div>
                          <p className="admin-inline-item__title">{product.name}</p>
                          <p className="admin-inline-item__meta">
                            {formatCurrency(product.price)} price point
                          </p>
                        </div>
                        <AdminStatusBadge tone="info">
                          {product.viewCount || 0} views
                        </AdminStatusBadge>
                      </div>
                    ))}
                  </div>

                  <div className="admin-inline-list">
                    <h3 className="dashboard-section-title">Top selling</h3>
                    {(dashboardData.spotlight?.topSellingProducts || []).slice(0, 4).map((product) => (
                      <div
                        key={product._id || product.productName}
                        className="admin-inline-item"
                      >
                        <div>
                          <p className="admin-inline-item__title">{product.productName}</p>
                          <p className="admin-inline-item__meta">Units sold</p>
                        </div>
                        <AdminStatusBadge tone="success">
                          {product.unitsSold || 0}
                        </AdminStatusBadge>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>

            <section className="admin-grid admin-grid--three">
              <article className="admin-panel">
                <div className="admin-panel__header">
                  <div>
                    <p className="admin-panel__eyebrow">Recent customers</p>
                    <h2 className="admin-panel__title">New users</h2>
                  </div>
                </div>

                <div className="admin-activity-list">
                  {(dashboardData.spotlight?.recentUsers || []).map((user) => (
                    <div key={user._id} className="admin-activity-item">
                      <div>
                        <p className="admin-activity-item__title">{user.name}</p>
                        <p className="admin-activity-item__meta">{user.email}</p>
                        <p className="admin-activity-item__meta">{formatDateTime(user.createdAt)}</p>
                      </div>
                      <AdminStatusBadge tone={getStatusTone(user.role)}>
                        {sentenceCase(user.role)}
                      </AdminStatusBadge>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel__header">
                  <div>
                    <p className="admin-panel__eyebrow">Recent fulfilment</p>
                    <h2 className="admin-panel__title">Latest orders</h2>
                  </div>
                </div>

                <div className="admin-activity-list">
                  {(dashboardData.spotlight?.recentOrders || []).map((order) => (
                    <div key={order._id} className="admin-activity-item">
                      <div>
                        <p className="admin-activity-item__title">#{order._id.slice(-8)}</p>
                        <p className="admin-activity-item__meta">
                          {formatCurrency(order.totalPrice)}
                        </p>
                        <p className="admin-activity-item__meta">{formatDateTime(order.createdAt)}</p>
                      </div>
                      <AdminStatusBadge tone={getStatusTone(order.orderStatus)}>
                        {sentenceCase(order.orderStatus)}
                      </AdminStatusBadge>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel__header">
                  <div>
                    <p className="admin-panel__eyebrow">Catalog stream</p>
                    <h2 className="admin-panel__title">Recently added products</h2>
                  </div>
                </div>

                <div className="admin-activity-list">
                  {(dashboardData.spotlight?.recentProducts || []).map((product) => (
                    <div key={product._id} className="admin-activity-item">
                      <div>
                        <p className="admin-activity-item__title">{product.name}</p>
                        <p className="admin-activity-item__meta">
                          {product.category || 'Uncategorized'}
                        </p>
                        <p className="admin-activity-item__meta">
                          {formatDateTime(product.createdAt)}
                        </p>
                      </div>
                      <AdminStatusBadge tone={product.stock > 5 ? 'success' : 'warning'}>
                        {product.stock || 0} in stock
                      </AdminStatusBadge>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
