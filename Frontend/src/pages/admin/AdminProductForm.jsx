import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
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

        setImagePreview(product.image?.map((img) => img.url) || []);
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
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      });
    };
  }, [imagePreview]);

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onVariantChange = (index, key, value) => {
    setVariants((prev) =>
      prev.map((variant, idx) =>
        idx === index
          ? {
              ...variant,
              [key]: value,
            }
          : variant
      )
    );
  };

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);

  const removeVariant = (index) => {
    setVariants((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
    setVariantImages((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const onFilesChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 6);
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error('Each image must be 5MB or less');
      return;
    }
    setImageFiles(files);
    setImagePreview(files.map((file) => URL.createObjectURL(file)));
  };

  const removeImagePreview = (index) => {
    setImagePreview((prev) => prev.filter((_, idx) => idx !== index));
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
      Object.entries(variantImages).forEach(([, file]) =>
        payload.append('variantImages', file)
      );

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
      <div className="create-product-container page-shell">
        <h2 className="form-title">{isEdit ? 'Update Product' : 'Create Product'}</h2>
        {loading ? (
          <p>Loading product...</p>
        ) : (
          <form className="product-form" onSubmit={onSubmit}>
            <input
              className="form-input"
              name="name"
              placeholder="Product name"
              value={form.name}
              onChange={onFieldChange}
              required
            />
            <textarea
              className="form-input"
              name="description"
              placeholder="Product description"
              value={form.description}
              onChange={onFieldChange}
              rows={4}
              required
            />
            <input
              className="form-input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={onFieldChange}
              required
            />
            <select
              className="form-select"
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
            <input
              className="form-input"
              name="stock"
              type="number"
              min="0"
              placeholder="Base stock"
              value={form.stock}
              onChange={onFieldChange}
              required
            />

            <div className="file-input-container">
              <label>Product Images</label>
              <input
                className="form-input-file"
                type="file"
                multiple
                accept="image/*"
                onChange={onFilesChange}
                required={!isEdit}
              />
              {imagePreview.length > 0 && (
                <div className="image-preview-container">
                  {imagePreview.map((src, index) => (
                    <div key={`${src}-${index}`} className="preview-item">
                      <img src={src} alt="preview" className="image-preview" />
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => removeImagePreview(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="variant-block">
              <div className="variant-header">
                <h3>Variants</h3>
                <button type="button" className="variant-add-btn" onClick={addVariant}>
                  Add Variant
                </button>
              </div>
              {variants.map((variant, index) => (
                <div className="variant-row" key={`variant-${index}`}>
                  <input
                    className="form-input"
                    placeholder="Color"
                    value={variant.color}
                    onChange={(e) => onVariantChange(index, 'color', e.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="Size"
                    value={variant.size}
                    onChange={(e) => onVariantChange(index, 'size', e.target.value)}
                  />
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={variant.stock}
                    onChange={(e) => onVariantChange(index, 'stock', e.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="SKU (optional)"
                    value={variant.sku}
                    onChange={(e) => onVariantChange(index, 'sku', e.target.value)}
                  />
                  <button
                    type="button"
                    className="variant-remove-btn"
                    onClick={() => removeVariant(index)}
                  >
                    Remove
                  </button>
                  <label className="variant-image-upload">
                    Variant Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        onVariantImageChange(index, event.target.files?.[0])
                      }
                    />
                  </label>
                </div>
              ))}
            </div>

            <button className="submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default AdminProductForm;
