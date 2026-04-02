import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';

export const adminRepository = {
  getDashboardSummary({ now, thirtyDaysAgo }) {
    return Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalDiscounts: { $sum: '$discountPrice' },
            averageOrderValue: { $avg: '$totalPrice' },
          },
        },
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt')
        .lean(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderStatus totalPrice paymentInfo createdAt')
        .lean(),
      Product.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name price stock category createdAt image')
        .lean(),
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$paymentInfo.status', 'Pending'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Product.find()
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(5)
        .select('name viewCount price category rating image')
        .lean(),
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.product',
            unitsSold: { $sum: '$orderItems.quantity' },
            revenue: {
              $sum: {
                $multiply: ['$orderItems.price', '$orderItems.quantity'],
              },
            },
            productName: { $first: '$orderItems.name' },
            image: { $first: '$orderItems.image' },
          },
        },
        { $sort: { unitsSold: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);
  },
};
