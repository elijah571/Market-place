import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      enum: ['stripe', 'paystack', 'flutterwave'],
      required: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'refunded'],
      default: 'pending',
    },
    providerStatus: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      default: null,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: '',
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    verificationAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    nextVerificationAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ gateway: 1, reference: 1 }, { unique: true });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ cart: 1, createdAt: -1 });
transactionSchema.index({ order: 1, createdAt: -1 });
transactionSchema.index({ gateway: 1, idempotencyKey: 1, createdAt: -1 });
transactionSchema.index(
  { gateway: 1, idempotencyKey: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
