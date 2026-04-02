import express from 'express';
import {
  getActivePromotions,
  validatePromotionCode,
} from '../controllers/promotion.controller.js';

const router = express.Router();

router.get('/promotions', getActivePromotions);
router.post('/promotions/validate', validatePromotionCode);

export default router;
