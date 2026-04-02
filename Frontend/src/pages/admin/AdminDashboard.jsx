import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
import '../../AdminStyles/Dashboard.css';
import { adminService } from '../../services/admin.service';
import { formatCurrency } from '../../utils/formatters';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
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
  });

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      setLoading(true);

      try {
        const data = await adminService.getDashboard();
        setDashboardData(data);
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
      { label: 'Total Users', value: dashboardData.overview?.users || 0 },
      { label: 'Total Products', value: dashboardData.overview?.products || 0 },
      { label: 'Total Orders', value: dashboardData.overview?.orders || 0 },
      {
        label: 'Revenue',
        value: formatCurrency(dashboardData.overview?.totalRevenue || 0),
      },
      {
        label: 'Low Stock',
        value: dashboardData.overview?.lowStockProducts || 0,
      },
      {
        label: 'Average Order',
        value: formatCurrency(dashboardData.overview?.averageOrderValue || 0),
      },
    ],
    [dashboardData]
  );

  return (
    <>
      <PageTitle title="Admin Dashboard" />
      <Navbar />
      <div className="dashboard-container">
        <main className="main-content">
          <div className="dashboard-hero">
            <div>
              <p className="dashboard-kicker">Admin analytics</p>
              <h1 className="page-title">Store performance at a glance</h1>
            </div>
            <div className="dashboard-links">
              <Link to="/admin/products" className="admin-link">
                Products
              </Link>
              <Link to="/admin/orders" className="admin-link">
                Orders
              </Link>
              <Link to="/admin/users" className="admin-link">
                Users
              </Link>
            </div>
          </div>

          {loading ? (
            <p className="loading-message">Loading dashboard...</p>
          ) : (
            <>
              <section className="stats-grid">
                {stats.map((item) => (
                  <article key={item.label} className="stat-box">
                    <h3>{item.label}</h3>
                    <p>{item.value}</p>
                  </article>
                ))}
              </section>

              <section className="dashboard-grid">
                <article className="social-box">
                  <h3>Order Status Breakdown</h3>
                  {(dashboardData.breakdowns?.orderStatus || []).map((item) => (
                    <div key={item.label} className="dashboard-inline-stat">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </article>

                <article className="social-box">
                  <h3>Category Performance</h3>
                  {(dashboardData.breakdowns?.categories || []).slice(0, 5).map((item) => (
                    <div key={item.label} className="dashboard-bar-row">
                      <span>{item.label}</span>
                      <div>
                        <i style={{ width: `${Math.min(item.value * 18, 100)}%` }} />
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="social-box">
                  <h3>Recent Users</h3>
                  {(dashboardData.spotlight?.recentUsers || []).map((user) => (
                    <p key={user._id}>
                      {user.name} ({user.email}) - {user.role}
                    </p>
                  ))}
                </article>

                <article className="social-box">
                  <h3>Recent Orders</h3>
                  {(dashboardData.spotlight?.recentOrders || []).map((order) => (
                    <p key={order._id}>
                      #{order._id.slice(-6)} - {order.orderStatus} - {formatCurrency(order.totalPrice)}
                    </p>
                  ))}
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="social-box">
                  <h3>Top Viewed Products</h3>
                  {(dashboardData.spotlight?.topViewedProducts || []).map((product) => (
                    <p key={product._id}>
                      {product.name} - {product.viewCount || 0} views
                    </p>
                  ))}
                </article>

                <article className="social-box">
                  <h3>Top Selling Products</h3>
                  {(dashboardData.spotlight?.topSellingProducts || []).map((product) => (
                    <p key={product._id || product.productName}>
                      {product.productName} - {product.unitsSold} units
                    </p>
                  ))}
                </article>
              </section>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
