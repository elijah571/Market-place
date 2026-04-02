import mongoose from 'mongoose';

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const productVariantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    size: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    // Room for future attributes (e.g., material) without schema changes
    attributes: {
      type: Map,
      of: String,
      default: undefined,
    },
    stock: {
      type: Number,
      min: [0, 'Variant stock cannot be negative'],
      default: 0,
    },
    priceDelta: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      public_id: {
        type: String,
        default: '',
      },
      url: {
        type: String,
        default: '',
      },
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Enter Product Name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please Enter Product description'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
      maxlength: [7, 'Price cannot exceed 7 digits'], // FIXED
    },

    rating: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    category: {
      type: String,
      required: [true, 'Please Enter Product Name'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Please enter product stock'],
      maxlength: [5, 'Stock cannot exceed 5 digits'],
      default: 1,
    },
    colors: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    sizes: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    variants: [productVariantSchema],
    numOfReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
        },
        comment: {
          type: String,
          required: [true, 'Please Enter Product Name'],
          trim: true,
        },
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  } else if (this.slug) {
    this.slug = slugify(this.slug);
  }

  if (Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags.map((tag) => slugify(tag)).filter(Boolean))];
  }

  if (!Array.isArray(this.variants) || this.variants.length === 0) {
    return;
  }

  this.stock = this.variants.reduce(
    (total, variant) => total + Math.max(0, Number(variant.stock || 0)),
    0
  );

  const colors = this.variants
    .map((variant) => (variant.color || '').trim().toLowerCase())
    .filter(Boolean);
  const sizes = this.variants
    .map((variant) => (variant.size || '').trim().toUpperCase())
    .filter(Boolean);

  this.colors = [...new Set(colors)];
  this.sizes = [...new Set(sizes)];
});

productVariantSchema.index({ color: 1, size: 1, sku: 1 });
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  category: 'text',
  subcategory: 'text',
  tags: 'text',
  slug: 'text',
});
productSchema.index({ slug: 1 }, { sparse: true });
productSchema.index({ category: 1, subcategory: 1, brand: 1, createdAt: -1 });
productSchema.index({ category: 1, price: 1, rating: -1, createdAt: -1 });
productSchema.index({ brand: 1, createdAt: -1 });
productSchema.index({ tags: 1, createdAt: -1 });
productSchema.index({ stock: 1, createdAt: -1 });
productSchema.index({ viewCount: -1, createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
