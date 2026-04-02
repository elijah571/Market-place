import mongoose from 'mongoose';

const cartShippingSchema = new mongoose.Schema(
  {
    country: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    pinCode: { type: String, trim: true, default: '' },
    phoneNo: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const cartItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    selectedColor: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    selectedSize: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    availableStock: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const cartSummarySchema = new mongoose.Schema(
  {
    itemPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
  },
  { _id: false }
);

const cartIssueSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    shippingInfo: {
      type: cartShippingSchema,
      default: () => ({}),
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USD',
    },
    summary: {
      type: cartSummarySchema,
      default: () => ({}),
    },
    issues: {
      type: [cartIssueSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'converted'],
      default: 'active',
      index: true,
    },
    convertedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

cartSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
  }
);
cartSchema.index({ status: 1, lastActivityAt: 1 });
cartSchema.index({ user: 1, updatedAt: -1 });

export const Cart = mongoose.model('Cart', cartSchema);
