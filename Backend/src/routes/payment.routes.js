import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getMyTransactions,
  initializePayment,
  verifyPayment,
} from '../controllers/payment.controller.js';
import { isAuthenticated } from '../middleware/authentification.js';
import { validate } from '../middleware/validate.js';
import {
  initializePaymentSchema,
  verifyPaymentSchema,
} from '../validation/payment.validation.js';
import { CACHE_TTLS, withCache } from '../utils/cache.js';

const router = express.Router();
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/initialize',
  paymentLimiter,
  isAuthenticated,
  validate(initializePaymentSchema),
  initializePayment
);
router.post(
  '/verify',
  paymentLimiter,
  isAuthenticated,
  validate(verifyPaymentSchema),
  verifyPayment
);
router.get(
  '/transactions/me',
  isAuthenticated,
  withCache({
    namespace: 'transactions-me',
    ttlSeconds: CACHE_TTLS.transactions,
    varyByUser: true,
    tags: (req) => ['transactions', `transactions:${req.user._id}`],
  }),
  getMyTransactions
);

export default router;
