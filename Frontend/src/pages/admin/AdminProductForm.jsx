import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/CreateProduct.css';

const initialState = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
};

const emptyVariant = () => ({
  color: '',
  size: '',
  stock: '',
  sku: '',
});

const categories = [
  'Computers',
  'Mobiles',
  'Accessories',
  'Clothes',
  'Shoes',
  'TVs',
  'Cameras',
];

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialState);
  const [variants, setVariants] = useState([emptyVariant()]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [variantImages, setVariantImages] = useState({});

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
      if (!isEdit) return;

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
        });

        if (Array.isArray(product.variants) && product.variants.length > 0) {
          setVariants(
            product.variants.map((variant) => ({
              color: variant.color || '',
              size: variant.size || '',
              stock: String(variant.stock ?? ''),
              sku: variant.sku || '',
            }))
          );
        }

        syncImagePreview(product.image?.map((img) => img.url) || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isEdit]);

  useEffect(() => {
    return () => {
      imagePreview.forEach((src) => {
        if (src.startsWith('blob:')) {
          URL.revokeObjectURL(src);
        }
      });
    };
  }, [imagePreview]);

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onVariantChange = (index, key, value) => {
    setVariants((prev) =>
      prev.map((variant, idx) => (idx === index ? { ...variant, [key]: value } : variant))
    );
  };

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);

  const removeVariant = (index) => {
    setVariants((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });

    setVariantImages((prev) =>
      Object.entries(prev).reduce((next, [key, value]) => {
        const currentIndex = Number(key);

        if (currentIndex === index) return next;

        next[currentIndex > index ? currentIndex - 1 : currentIndex] = value;
        return next;
      }, {})
    );
  };

  const onFilesChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 6);
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error('Each image must be 5MB or less');
      return;
    }

    setImageFiles(files);
    syncImagePreview(files.map((file) => URL.createObjectURL(file)));
  };

  const removeImagePreview = (index) => {
    setImagePreview((prev) => {
      const target = prev[index];
      if (target?.startsWith('blob:')) {
        URL.revokeObjectURL(target);
      }

      return prev.filter((_, idx) => idx !== index);
    });
    setImageFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onVariantImageChange = (index, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Each image must be 5MB or less');
      return;
    }

    setVariantImages((prev) => ({ ...prev, [index]: file }));
  };

  const validate = () => {
    if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
      return 'Name, description, and category are required';
    }

    if (Number(form.price) <= 0) {
      return 'Price must be greater than 0';
    }

    if (Number(form.stock) < 0) {
      return 'Stock cannot be negative';
    }

    const cleanVariants = variants.filter(
      (variant) => variant.color.trim() || variant.size.trim() || variant.stock
    );

    for (const variant of cleanVariants) {
      if (!variant.color.trim() || !variant.size.trim()) {
        return 'Each variant requires both color and size';
      }

      if (Number(variant.stock) < 0) {
        return 'Variant stock cannot be negative';
      }
    }

    if (!isEdit && imageFiles.length === 0) {
      return 'At least one image is required';
    }

    return null;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const formattedVariants = variants
        .filter((variant) => variant.color.trim() && variant.size.trim())
        .map((variant) => ({
          color: variant.color.trim(),
          size: variant.size.trim(),
          stock: Number(variant.stock || 0),
          sku: variant.sku?.trim() || '',
        }));

      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('description', form.description.trim());
      payload.append('price', String(Number(form.price)));
      payload.append('category', form.category.trim());
      payload.append('stock', String(Number(form.stock)));
      payload.append('variants', JSON.stringify(formattedVariants));

      imageFiles.forEach((file) => payload.append('images', file));
      Object.entries(variantImages).forEach(([, file]) => payload.append('variantImages', file));

      if (isEdit) {
        await apiClient.put(`/product/${id}`, payload);
        toast.success('Product updated');
      } else {
        await apiClient.post('/products', payload);
        toast.success('Product created');
      }

      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle title={isEdit ? 'Update Product' : 'Create Product'} />
      <div className="admin-page">
        <AdminPageHeader
          eyebrow={isEdit ? 'Catalog update' : 'Catalog creation'}
          title={isEdit ? 'Update Product' : 'Create Product'}
          description="A cleaner product workspace for core info, media, and variants, with enough structure to move quickly without losing detail."
          meta={
            <>
              <AdminStatusBadge tone="info">{imagePreview.length} images</AdminStatusBadge>
              <AdminStatusBadge tone="warning">{variants.length} variants</AdminStatusBadge>
              <AdminStatusBadge tone="success">
                {form.category || 'Choose category'}
              </AdminStatusBadge>
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
                    <p className="admin-panel__eyebrow">Core details</p>
                    <h2 className="admin-form-shell__title">Product information</h2>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="product-name">Product name</label>
                    <input
                      id="product-name"
                      className="admin-input"
                      name="name"
                      placeholder="Product name"
                      value={form.name}
                      onChange={onFieldChange}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label htmlFor="product-description">Description</label>
                    <textarea
                      id="product-description"
                      className="admin-textarea"
                      name="description"
                      placeholder="Product description"
                      value={form.description}
                      onChange={onFieldChange}
                      rows={5}
                      required
                    />
                  </div>

                  <div className="admin-form-grid admin-form-grid--two">
                    <div className="admin-field">
                      <label htmlFor="product-price">Price</label>
                      <input
                        id="product-price"
                        className="admin-input"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={form.price}
                        onChange={onFieldChange}
                        required
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor="product-stock">Base stock</label>
                      <input
                        id="product-stock"
                        className="admin-input"
                        name="stock"
                        type="number"
                        min="0"
                        placeholder="Base stock"
                        value={form.stock}
                        onChange={onFieldChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-field">
                    <label htmlFor="product-category">Category</label>
                    <select
                      id="product-category"
                      className="admin-select"
                      name="category"
                      value={form.category}
                      onChange={onFieldChange}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-form-shell">
                <div className="admin-form-shell__header">
                  <div>
                    <p className="admin-panel__eyebrow">Media</p>
                    <h2 className="admin-form-shell__title">Product images</h2>
                    <p className="admin-panel__subtitle">
                      Upload up to six images. Each image must be 5MB or less.
                    </p>
                  </div>
                </div>

                <div className="admin-field">
                  <label htmlFor="product-images">Product images</label>
                  <input
                    id="product-images"
                    className="admin-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onFilesChange}
                    required={!isEdit}
                  />
                </div>

                {imagePreview.length > 0 ? (
                  <div className="admin-media-grid">
                    {imagePreview.map((src, index) => (
                      <div key={`${src}-${index}`} className="admin-image-card">
                        <img src={src} alt={`Product preview ${index + 1}`} />
                        <div className="admin-image-card__actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => removeImagePreview(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-upload-note">Image previews will appear here after upload.</p>
                )}
              </div>
            </section>

            <section className="admin-form-shell">
              <div className="admin-form-shell__header">
                <div>
                  <p className="admin-panel__eyebrow">Variants</p>
                  <h2 className="admin-form-shell__title">Stock combinations</h2>
                  <p className="admin-panel__subtitle">
                    Add color and size combinations with optional SKU and image overrides.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={addVariant}
                >
                  Add variant
                </button>
              </div>

              <div className="admin-variant-grid">
                {variants.map((variant, index) => (
                  <div className="admin-variant-row" key={`variant-${index}`}>
                    <input
                      className="admin-input"
                      placeholder="Color"
                      value={variant.color}
                      onChange={(event) => onVariantChange(index, 'color', event.target.value)}
                    />
                    <input
                      className="admin-input"
                      placeholder="Size"
                      value={variant.size}
                      onChange={(event) => onVariantChange(index, 'size', event.target.value)}
                    />
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      placeholder="Stock"
                      value={variant.stock}
                      onChange={(event) => onVariantChange(index, 'stock', event.target.value)}
                    />
                    <input
                      className="admin-input"
                      placeholder="SKU (optional)"
                      value={variant.sku}
                      onChange={(event) => onVariantChange(index, 'sku', event.target.value)}
                    />
                    <div className="create-product-variant-actions">
                      <input
                        className="admin-input"
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          onVariantImageChange(index, event.target.files?.[0])
                        }
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => removeVariant(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="admin-form-actions">
              <button className="admin-btn admin-btn--primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
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

export default AdminProductForm;
