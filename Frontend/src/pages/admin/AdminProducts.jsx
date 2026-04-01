import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../utils/apiClient';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
import '../../AdminStyles/ProductsList.css';

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

  return (
    <>
      <PageTitle title="Admin Products" />
      <Navbar />
      <div className="product-list-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="product-list-title">Products</h2>
          <Link className="admin-dashboard-link" to="/admin/products/new">
            Create Product
          </Link>
        </div>

        {loading ? (
          <p className="loading-message">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="no-admin-products">No products found.</p>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <img
                      src={product?.image?.[0]?.url}
                      alt={product.name}
                      className="admin-product-image"
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                  <td>
                    <Link className="action-link" to={`/admin/products/${product._id}/edit`}>
                      Edit
                    </Link>
                    <Link
                      className="action-link"
                      to={`/admin/products/${product._id}/update-advanced`}
                    >
                      Advanced
                    </Link>
                    <button className="delete-icon" onClick={() => handleDelete(product._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default AdminProducts;
