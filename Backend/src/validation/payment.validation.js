import { z } from 'zod';

export const initializePaymentSchema = z.object({
  gateway: z.string().min(2, 'gateway is required'),
  amount: z.preprocess((v) => Number(v), z.number().positive('amount must be positive')),
  currency: z.string().optional(),
  orderId: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  gateway: z.string().min(2, 'gateway is required'),
  reference: z.string().min(2, 'reference is required'),
  orderId: z.string().optional(),
});
