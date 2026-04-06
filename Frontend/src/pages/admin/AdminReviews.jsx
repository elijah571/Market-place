import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/ReviewsList.css';
import { formatCompactNumber } from '../../utils/formatters';

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
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Review moderation"
          title="Reviews"
          description="Browse feedback by product, then open the selected product’s review stream without leaving the moderation workspace."
          meta={
            <>
              <AdminStatusBadge tone="info">
                {formatCompactNumber(products.length)} products
              </AdminStatusBadge>
              <AdminStatusBadge tone="warning">
                {selectedProduct ? selectedProduct.name : 'No product selected'}
              </AdminStatusBadge>
            </>
          }
        />

        <section className="admin-grid admin-grid--two reviews-layout">
          <div className="admin-table-shell">
            <div className="admin-table-shell__header">
              <div>
                <p className="admin-panel__eyebrow">Products</p>
                <h2 className="admin-table-shell__title">Review source list</h2>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading-state">
                <p>Loading products...</p>
              </div>
            ) : (
              <div className="admin-table-shell__inner">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Reviews</th>
                      <th>Rating</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <p className="admin-table__primary">{product.name}</p>
                        </td>
                        <td>{product.numOfReviews || 0}</td>
                        <td>{product.rating || 0}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn--primary"
                            onClick={() => loadReviews(product)}
                            type="button"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-panel reviews-details">
            <div className="admin-panel__header">
              <div>
                <p className="admin-panel__eyebrow">Selected product</p>
                <h2 className="admin-panel__title">
                  {selectedProduct ? selectedProduct.name : 'Choose a product'}
                </h2>
                <p className="admin-panel__subtitle">
                  {selectedProduct
                    ? 'Read customer comments and ratings for the selected item.'
                    : 'Pick a product from the list to inspect its review feed.'}
                </p>
              </div>
            </div>

            {selectedProduct ? (
              <>
                <div className="reviews-summary">
                  <AdminStatusBadge tone="info">
                    {selectedProduct.numOfReviews || 0} reviews
                  </AdminStatusBadge>
                  <AdminStatusBadge tone="warning">
                    {selectedProduct.rating || 0} rating
                  </AdminStatusBadge>
                </div>

                {reviews.length === 0 ? (
                  <div className="admin-empty-state">
                    <p>No reviews for this product.</p>
                  </div>
                ) : (
                  <div className="reviews-feed">
                    {reviews.map((review) => (
                      <article key={review._id} className="reviews-review-card">
                        <div className="reviews-review-card__header">
                          <div>
                            <p className="admin-table__primary">{review.name}</p>
                          </div>
                          <AdminStatusBadge tone="warning">{review.rating}/5</AdminStatusBadge>
                        </div>
                        <p className="admin-muted">{review.comment}</p>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
};

export default AdminReviews;
