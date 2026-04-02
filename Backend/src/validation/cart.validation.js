import { z } from 'zod';

const cartItemSchema = z.object({
  product: z.string().optional(),
  productId: z.string().optional(),
  quantity: z.preprocess((value) => Number(value), z.number().int().positive()),
  selectedColor: z.string().optional(),
  selectedSize: z.string().optional(),
  variantId: z.string().nullable().optional(),
});

const shippingSchema = z.object({
  country: z.string().trim().optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  pinCode: z.union([z.string(), z.number()]).optional(),
  phoneNo: z.union([z.string(), z.number()]).optional(),
});

export const syncCartSchema = z.object({
  items: z.array(cartItemSchema).default([]),
  shippingInfo: shippingSchema.optional(),
  promoCode: z.string().trim().optional(),
});

export const mergeCartSchema = z.object({
  items: z.array(cartItemSchema).default([]),
  shippingInfo: shippingSchema.optional(),
  promoCode: z.string().trim().optional(),
});
