import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
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
        setImagePreview(product?.image?.map((img) => img.url) || []);
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
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
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
      <Navbar />
      <div className="update-product-wrapper">
        <h2 className="update-product-title">Update Product</h2>
        {loading ? (
          <p>Loading product...</p>
        ) : (
          <form className="update-product-form" onSubmit={onSubmit}>
            <label>Name</label>
            <input
              className="update-product-input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <label>Description</label>
            <textarea
              className="update-product-textarea"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
            <label>Price</label>
            <input
              className="update-product-input"
              type="number"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              required
            />
            <label>Category</label>
            <input
              className="update-product-input"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              required
            />
            <label>Stock</label>
            <input
              className="update-product-input"
              type="number"
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              required
            />
            <label>Upload Product Images</label>
            <input
              className="update-product-input"
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
                setImagePreview(files.map((file) => URL.createObjectURL(file)));
              }}
            />
            {imagePreview.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {imagePreview.map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt="preview"
                    className="update-product-preview-image"
                  />
                ))}
              </div>
            )}
            <label>Variants JSON</label>
            <textarea
              className="update-product-textarea"
              value={form.variantsText}
              onChange={(e) => setForm((prev) => ({ ...prev, variantsText: e.target.value }))}
            />
            <button className="update-product-submit-btn" disabled={saving} type="submit">
              {saving ? 'Updating...' : 'Update Product'}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default AdminUpdateProduct;
