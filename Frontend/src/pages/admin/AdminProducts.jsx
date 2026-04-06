import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import '../../AdminStyles/ProductsList.css';
import apiClient from '../../utils/apiClient';
import { formatCompactNumber, formatCurrency } from '../../utils/formatters';

const AdminProducts = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/products?limit=100&page=1');
      setProducts(data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await apiClient.delete(`/product/${productId}`);
      toast.success('Product deleted');
      setProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete product');
    }
  };

  const summary = useMemo(() => {
    const lowStock = products.filter((product) => Number(product.stock || 0) <= 5).length;
    const categories = new Set(products.map((product) => product.category).filter(Boolean)).size;
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0),
      0
    );

    return {
      lowStock,
      categories,
      totalInventoryValue,
    };
  }, [products]);

  return (
    <>
      <PageTitle title="Admin Products" />
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Catalog control"
          title="Products"
          description="Manage the assortment, catch low-stock items early, and move between quick edits and advanced variant updates from one clean inventory view."
          meta={
            <>
              <AdminStatusBadge tone="info">
                {formatCompactNumber(products.length)} products
              </AdminStatusBadge>
              <AdminStatusBadge tone="warning">
                {summary.lowStock} low stock
              </AdminStatusBadge>
              <AdminStatusBadge tone="success">{summary.categories} categories</AdminStatusBadge>
            </>
          }
          actions={
            <div className="admin-header-actions">
              <Link className="admin-btn admin-btn--secondary" to="/admin/products/new">
                Create product
              </Link>
            </div>
          }
        />

        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Catalog size</p>
            <p className="admin-stat-card__value">{formatCompactNumber(products.length)}</p>
            <p className="admin-stat-card__meta">Products currently listed in the catalog.</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Low stock alerts</p>
            <p className="admin-stat-card__value">{summary.lowStock}</p>
            <p className="admin-stat-card__meta">Items at five units or below need attention.</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Inventory value</p>
            <p className="admin-stat-card__value">
              {formatCurrency(summary.totalInventoryValue)}
            </p>
            <p className="admin-stat-card__meta">Approximate stock value at listed prices.</p>
          </article>
        </section>

        <section className="admin-table-shell">
          <div className="admin-table-shell__header">
            <div>
              <p className="admin-panel__eyebrow">Inventory table</p>
              <h2 className="admin-table-shell__title">Product roster</h2>
              <p className="admin-panel__subtitle">
                Clearer stock signals, category tags, and direct edit actions.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading-state">
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="admin-empty-state">
              <p>No products found.</p>
            </div>
          ) : (
            <div className="admin-table-shell__inner">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="admin-product-cell">
                          <img
                            src={product?.image?.[0]?.url}
                            alt={product.name}
                            className="admin-product-thumb"
                          />
                          <div>
                            <p className="admin-table__primary">{product.name}</p>
                            <p className="admin-table__secondary">
                              {product.numOfReviews || 0} reviews • {product.rating || 0} rating
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <AdminStatusBadge tone="neutral">
                          {product.category || 'Uncategorized'}
                        </AdminStatusBadge>
                      </td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        <AdminStatusBadge
                          tone={Number(product.stock || 0) <= 5 ? 'warning' : 'success'}
                        >
                          {product.stock || 0} units
                        </AdminStatusBadge>
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <Link
                            className="admin-btn admin-btn--ghost"
                            to={`/admin/products/${product._id}/edit`}
                          >
                            Edit
                          </Link>
                          <Link
                            className="admin-btn admin-btn--primary"
                            to={`/admin/products/${product._id}/update-advanced`}
                          >
                            Advanced
                          </Link>
                          <button
                            className="admin-btn admin-btn--danger"
                            type="button"
                            onClick={() => handleDelete(product._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default AdminProducts;
