import express from 'express';
import { getDashboardAnalytics } from '../controllers/admin.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import { withCache } from '../utils/cache.js';

const router = express.Router();

router.get(
  '/admin/dashboard',
  isAuthenticated,
  isAdmin,
  withCache(60 * 1000),
  getDashboardAnalytics
);

export default router;
