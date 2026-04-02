import { adminRepository } from '../../repositories/admin.repository.js';

export const adminDashboardService = {
  async getDashboardAnalytics() {
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
    ] = await adminRepository.getDashboardSummary({ now, thirtyDaysAgo });

    const revenueSummary = revenueAgg[0] || {
      totalRevenue: 0,
      totalDiscounts: 0,
      averageOrderValue: 0,
    };

    return {
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
    };
  },
};
