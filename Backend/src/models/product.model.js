import mongoose from 'mongoose';

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
      MaxLength: [7, 'price can not exceed 7 digit'],
    },
    rating: {
      type: Number,
      default: 0,
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
    stock: {
      type: Number,
      required: [true, 'Please Enter Product Name'],
      MaxLength: [5, 'stock can not exceed 5 digit'],
      default: 1,
    },

    numOfReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
