import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { adminDashboardService } from '../services/admin/admin-dashboard.service.js';

export const getDashboardAnalytics = asyncHandler(async (_req, res) => {
  const analytics = await adminDashboardService.getDashboardAnalytics();

  return sendSuccess(res, {
    data: analytics,
  });
});
