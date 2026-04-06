import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UpdateProduct.css';

const AdminUpdateProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    variantsText: '[]',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  const syncImagePreview = (nextPreview) => {
    setImagePreview((prev) => {
      prev.forEach((src) => {
        if (src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
      });

      return nextPreview;
    });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await apiClient.get(`/product/${id}`);
        const product = data?.data;
        if (!product) return;
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: String(product.price ?? ''),
          category: product.category || '',
          stock: String(product.stock ?? ''),
          variantsText: JSON.stringify(product.variants || [], null, 2),
        });
        syncImagePreview(product?.image?.map((img) => img.url) || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    return () => {
      imagePreview.forEach((src) => {
        if (src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
      });
    };
  }, [imagePreview]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('description', form.description);
      payload.append('price', String(Number(form.price)));
      payload.append('category', form.category);
      payload.append('stock', String(Number(form.stock)));
      payload.append('variants', JSON.stringify(JSON.parse(form.variantsText || '[]')));
      imageFiles.forEach((file) => payload.append('images', file));

      await apiClient.put(`/product/${id}`, payload);
      toast.success('Product updated');
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle title="Update Product" />
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Advanced edit"
          title="Update Product"
          description="Fine-tune the full product payload, including variant JSON, from a roomier editor."
          meta={
            <>
              <AdminStatusBadge tone="info">{imagePreview.length} images</AdminStatusBadge>
              <AdminStatusBadge tone="warning">Advanced mode</AdminStatusBadge>
            </>
          }
          actions={
            <div className="admin-header-actions">
              <Link className="admin-btn admin-btn--ghost" to="/admin/products">
                Back to products
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="admin-loading-state surface-card">
            <p>Loading product...</p>
          </div>
        ) : (
          <form className="admin-page" onSubmit={onSubmit}>
            <section className="admin-grid admin-grid--two">
              <div className="admin-form-shell">
                <div className="admin-form-shell__header">
                  <div>
                    <p className="admin-panel__eyebrow">Core fields</p>
                    <h2 className="admin-form-shell__title">Product payload</h2>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="advanced-product-name">Name</label>
                    <input
                      id="advanced-product-name"
                      className="admin-input"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="advanced-product-description">Description</label>
                    <textarea
                      id="advanced-product-description"
                      className="admin-textarea"
                      value={form.description}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="admin-form-grid admin-form-grid--two">
                    <div className="admin-field">
                      <label htmlFor="advanced-product-price">Price</label>
                      <input
                        id="advanced-product-price"
                        className="admin-input"
                        type="number"
                        value={form.price}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, price: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="advanced-product-stock">Stock</label>
                      <input
                        id="advanced-product-stock"
                        className="admin-input"
                        type="number"
                        value={form.stock}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, stock: event.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="admin-field">
                    <label htmlFor="advanced-product-category">Category</label>
                    <input
                      id="advanced-product-category"
                      className="admin-input"
                      value={form.category}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, category: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="admin-form-shell">
                <div className="admin-form-shell__header">
                  <div>
                    <p className="admin-panel__eyebrow">Media</p>
                    <h2 className="admin-form-shell__title">Images</h2>
                  </div>
                </div>

                <div className="admin-field">
                  <label htmlFor="advanced-product-images">Upload product images</label>
                  <input
                    id="advanced-product-images"
                    className="admin-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []).slice(0, 6);
                      const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
                      if (oversized) {
                        toast.error('Each image must be 5MB or less');
                        return;
                      }
                      setImageFiles(files);
                      syncImagePreview(files.map((file) => URL.createObjectURL(file)));
                    }}
                  />
                </div>

                {imagePreview.length > 0 ? (
                  <div className="admin-media-grid">
                    {imagePreview.map((src, index) => (
                      <div key={`${src}-${index}`} className="admin-image-card">
                        <img src={src} alt={`Preview ${index + 1}`} className="update-product-preview-image" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="admin-form-shell">
              <div className="admin-form-shell__header">
                <div>
                  <p className="admin-panel__eyebrow">Variant editor</p>
                  <h2 className="admin-form-shell__title">Variants JSON</h2>
                  <p className="admin-panel__subtitle">
                    Edit the raw variant array when you need precise control.
                  </p>
                </div>
              </div>

              <div className="admin-field">
                <label htmlFor="advanced-product-variants">Variants JSON</label>
                <textarea
                  id="advanced-product-variants"
                  className="admin-textarea update-product-json"
                  value={form.variantsText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, variantsText: event.target.value }))
                  }
                />
              </div>
            </section>

            <div className="admin-form-actions">
              <button className="admin-btn admin-btn--primary" disabled={saving} type="submit">
                {saving ? 'Updating...' : 'Update Product'}
              </button>
              <Link className="admin-btn admin-btn--ghost" to="/admin/products">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default AdminUpdateProduct;
