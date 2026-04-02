import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  getActivePromoCodes,
  resolvePromotion,
} from '../utils/promotions.js';
import { sendSuccess } from '../utils/response.js';

export const getActivePromotions = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    data: getActivePromoCodes().map((promo) => ({
      code: promo.code,
      type: promo.type,
      value: promo.value,
      minSubtotal: promo.minSubtotal,
      description: promo.description,
    })),
  });
});

export const validatePromotionCode = asyncHandler(async (req, res) => {
  const { promoCode, subtotal = 0, shippingPrice = 0 } = req.body;
  const promo = resolvePromotion({
    promoCode,
    subtotal: Number(subtotal),
    shippingPrice: Number(shippingPrice),
  });

  if (!promo || !promo.valid) {
    return res.status(400).json({
      success: false,
      message: promo?.message || 'Promo code is invalid or inactive',
    });
  }

  return sendSuccess(res, {
    message: 'Promo code applied successfully',
    data: promo,
  });
});
