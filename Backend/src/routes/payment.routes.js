import express from 'express';
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

const router = express.Router();

router.post('/initialize', isAuthenticated, validate(initializePaymentSchema), initializePayment);
router.post('/verify', isAuthenticated, validate(verifyPaymentSchema), verifyPayment);
router.get('/transactions/me', isAuthenticated, getMyTransactions);

export default router;
