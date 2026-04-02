import { z } from 'zod';

export const initializePaymentSchema = z.object({
  gateway: z.string().min(2, 'gateway is required'),
  cartId: z.string().min(2, 'cartId is required'),
  currency: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  gateway: z.string().min(2, 'gateway is required'),
  reference: z.string().min(2, 'reference is required'),
  cartId: z.string().optional(),
});
