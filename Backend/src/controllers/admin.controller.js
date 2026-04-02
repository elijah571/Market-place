import { asyncHandler } from '../middleware/asyncHandler.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { sendSuccess } from '../utils/response.js';

export const getDashboardAnalytics = asyncHandler(async (_req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    userCount,
    productCount,
    orderCount,
    lowStockCount,
    revenueAgg,
    recentUsers,
    recentOrders,
    recentProducts,
    orderStatusBreakdown,
    paymentStatusBreakdown,
    categoryBreakdown,
    salesTrend,
    topViewedProducts,
    topSellingProducts,
  ] = await Promise.all([
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
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt').lean(),
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
          createdAt: { $gte: thirtyDaysAgo },
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

  const revenueSummary = revenueAgg[0] || {
    totalRevenue: 0,
    totalDiscounts: 0,
    averageOrderValue: 0,
  };

  return sendSuccess(res, {
    data: {
      overview: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        lowStockProducts: lowStockCount,
        totalRevenue: Number(revenueSummary.totalRevenue || 0).toFixed(2),
        totalDiscounts: Number(revenueSummary.totalDiscounts || 0).toFixed(2),
        averageOrderValue: Number(revenueSummary.averageOrderValue || 0).toFixed(2),
      },
      breakdowns: {
        orderStatus: orderStatusBreakdown.map((entry) => ({
          label: entry._id || 'Unknown',
          value: entry.count,
        })),
        paymentStatus: paymentStatusBreakdown.map((entry) => ({
          label: entry._id || 'Pending',
          value: entry.count,
        })),
        categories: categoryBreakdown.map((entry) => ({
          label: entry._id || 'Uncategorized',
          value: entry.count,
        })),
      },
      charts: {
        salesTrend: salesTrend.map((entry) => ({
          label: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}-${String(
            entry._id.day
          ).padStart(2, '0')}`,
          orders: entry.orders,
          revenue: Number(entry.revenue || 0).toFixed(2),
        })),
      },
      spotlight: {
        recentUsers,
        recentOrders,
        recentProducts,
        topViewedProducts,
        topSellingProducts,
      },
    },
  });
});
