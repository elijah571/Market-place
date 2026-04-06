import { z } from 'zod';
import { PAYMENT_GATEWAYS } from '../services/payment/payment.constants.js';

const gatewaySchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => PAYMENT_GATEWAYS.includes(value), {
    message: `gateway must be one of: ${PAYMENT_GATEWAYS.join(', ')}`,
  });

export const initializePaymentSchema = z.object({
  gateway: gatewaySchema,
  cartId: z.string().min(2, 'cartId is required'),
  currency: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  gateway: gatewaySchema,
  reference: z.string().min(2, 'reference is required'),
  cartId: z.string().optional(),
});
