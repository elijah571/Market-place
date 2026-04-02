import express from 'express';
import { getDashboardAnalytics } from '../controllers/admin.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import { CACHE_TTLS, withCache } from '../utils/cache.js';

const router = express.Router();

router.get(
  '/admin/dashboard',
  isAuthenticated,
  isAdmin,
  withCache({
    namespace: 'admin-dashboard',
    ttlSeconds: CACHE_TTLS.adminDashboard,
    tags: ['admin-dashboard', 'catalog', 'orders', 'users'],
  }),
  getDashboardAnalytics
);

export default router;
