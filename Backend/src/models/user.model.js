import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    pinCode: { type: Number, default: null },
    phoneNo: { type: Number, default: null },
  },
  { _id: true }
);

const recentlyViewedSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: 'user',
      enum: ['admin', 'user'],
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        default: 'default_id',
      },
      url: {
        type: String,
        default: 'default_url',
      },
    },
    verificationToken: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: Date.now,
    },

    resetPasswordToken: {
      type: String,
      default: '',
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: Date.now,
    },
    refreshTokenHash: {
      type: String,
      default: '',
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    addresses: [addressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    recentlyViewed: {
      type: [recentlyViewedSchema],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ wishlist: 1 });
userSchema.index({ 'recentlyViewed.product': 1, updatedAt: -1 });

export const User = mongoose.model('User', userSchema);
