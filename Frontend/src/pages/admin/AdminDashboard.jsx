import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../utils/apiClient';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
import '../../AdminStyles/Dashboard.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    recentUsers: [],
    recentOrders: [],
    recentProducts: [],
  });

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      setLoading(true);

      try {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/admin/products?limit=5&page=1'),
          apiClient.get('/admin/order?limit=5&page=1'),
        ]);

        const users = usersRes.data?.users || [];
        const products = productsRes.data?.data || [];
        const orders = ordersRes.data?.orders || [];

        setDashboardData({
          users: usersRes.data?.results || users.length,
          products: productsRes.data?.productCount || products.length,
          orders: ordersRes.data?.totalOrders || orders.length,
          revenue: ordersRes.data?.totalAmount || 0,
          recentUsers: users.slice(0, 5),
          recentOrders: orders.slice(0, 5),
          recentProducts: products.slice(0, 5),
        });
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
      { label: 'Total Users', value: dashboardData.users },
      { label: 'Total Products', value: dashboardData.products },
      { label: 'Total Orders', value: dashboardData.orders },
      { label: 'Revenue', value: `$${Number(dashboardData.revenue).toFixed(2)}` },
    ],
    [dashboardData]
  );

  return (
    <>
      <PageTitle title="Admin Dashboard" />
      <Navbar />
      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="logo">
            <span className="logo-icon">MP</span>
            <span>Admin Panel</span>
          </div>
          <div className="nav-menu">
            <div className="nav-section">
              <h3>Overview</h3>
              <Link to="/admin/dashboard" className="admin-link">
                Dashboard
              </Link>
            </div>
            <div className="nav-section">
              <h3>Management</h3>
              <Link to="/admin/users" className="admin-link">
                Users
              </Link>
              <Link to="/admin/products" className="admin-link">
                Products
              </Link>
              <Link to="/admin/orders" className="admin-link">
                Orders
              </Link>
              <Link to="/admin/reviews" className="admin-link">
                Reviews
              </Link>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <h1 className="page-title">Dashboard</h1>

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

              <section id="users" className="social-box" style={{ marginBottom: '20px' }}>
                <h3>Recent Users</h3>
                {dashboardData.recentUsers.length === 0 ? (
                  <p>No users found</p>
                ) : (
                  dashboardData.recentUsers.map((user) => (
                    <p key={user._id}>
                      {user.name} ({user.email}) - {user.role}
                    </p>
                  ))
                )}
              </section>

              <section id="products" className="social-box" style={{ marginBottom: '20px' }}>
                <h3>Recent Products</h3>
                {dashboardData.recentProducts.length === 0 ? (
                  <p>No products found</p>
                ) : (
                  dashboardData.recentProducts.map((product) => (
                    <p key={product._id}>
                      {product.name} - ${product.price}
                    </p>
                  ))
                )}
                <Link to="/admin/products" className="admin-link" style={{ marginTop: '12px' }}>
                  Manage Products
                </Link>
              </section>

              <section id="orders" className="social-box">
                <h3>Recent Orders</h3>
                {dashboardData.recentOrders.length === 0 ? (
                  <p>No orders found</p>
                ) : (
                  dashboardData.recentOrders.map((order) => (
                    <p key={order._id}>
                      #{order._id.slice(-6)} - {order.orderStatus} - ${order.totalPrice}
                    </p>
                  ))
                )}
                <Link to="/admin/orders" className="admin-link" style={{ marginTop: '12px' }}>
                  Manage Orders
                </Link>
              </section>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
