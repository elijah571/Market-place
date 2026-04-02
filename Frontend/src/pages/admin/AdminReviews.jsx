import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/ReviewsList.css';

const AdminReviews = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await apiClient.get('/admin/products?limit=100&page=1');
        setProducts(data?.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const loadReviews = async (product) => {
    setSelectedProduct(product);
    try {
      const { data } = await apiClient.get(`/product/reviews?id=${product._id}`);
      setReviews(data?.reviews || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load reviews');
    }
  };

  return (
    <>
      <PageTitle title="Admin Reviews" />
      <div className="reviews-list-container page-shell">
        <h1 className="reviews-list-title">Reviews Management</h1>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviews</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.numOfReviews || 0}</td>
                  <td>
                    <button className="action-btn view-btn" onClick={() => loadReviews(product)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedProduct && (
          <div className="reviews-details">
            <h2>{selectedProduct.name} Reviews</h2>
            {reviews.length === 0 ? (
              <p>No reviews for this product.</p>
            ) : (
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review._id}>
                      <td>{review.name}</td>
                      <td>{review.rating}</td>
                      <td>{review.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminReviews;
