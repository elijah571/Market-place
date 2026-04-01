import { z } from 'zod';

const numericField = (label) =>
  z.preprocess(
    (value) => Number(value),
    z.number().int().positive(`${label} is required`)
  );

export const addressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  country: z.string().trim().min(1, 'Country is required'),
  state: z.string().trim().min(1, 'State is required'),
  city: z.string().trim().min(1, 'City is required'),
  address: z.string().trim().min(3, 'Address is required'),
  pinCode: numericField('Pin code'),
  phoneNo: numericField('Phone number'),
});

export const updateAddressSchema = addressSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'Provide at least one address field to update' }
);

export const wishlistSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
});

export const recentlyViewedSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
});
