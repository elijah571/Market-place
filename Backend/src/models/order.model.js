import mongoose from 'mongoose';

const orderTimelineSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['order', 'payment'],
      required: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    actor: {
      type: String,
      trim: true,
      default: 'system',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      country: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      pinCode: {
        type: Number,
        required: true,
      },
      phoneNo: {
        type: Number,
        required: true,
      },
    },

    orderItems: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
          required: true,
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
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      default: null,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['PendingPayment', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'PendingPayment',
    },
    paymentInfo: {
      id: {
        type: String,
      },
      gateway: {
        type: String,
        default: '',
      },
      status: {
        type: String,
        default: 'Pending',
      },
      providerStatus: {
        type: String,
        default: '',
      },
      currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: 'USD',
      },
      amountPaid: {
        type: Number,
        default: 0,
      },
    },

    paidAt: {
      type: Date,
    },

    itemPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    deliveredAt: {
      type: Date,
    },
    statusTimeline: {
      type: [orderTimelineSchema],
      default: [],
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ cart: 1 }, { unique: true, sparse: true });
orderSchema.index({ 'paymentInfo.id': 1 });
orderSchema.index({ 'paymentInfo.status': 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
