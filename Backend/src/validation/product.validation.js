import { z } from 'zod';

const variantSchema = z
  .object({
    color: z.string().optional(),
    size: z.string().optional(),
    stock: z
      .preprocess((val) => Number(val), z.number().min(0).optional())
      .optional(),
    priceDelta: z
      .preprocess((val) => Number(val), z.number().optional())
      .optional(),
    sku: z.string().optional(),
    attributes: z.record(z.string()).optional(),
    image: z
      .object({
        public_id: z.string().optional(),
        url: z.string().url().optional(),
      })
      .optional(),
  })
  .refine(
    (v) =>
      Boolean(
        (v.color && v.size) ||
          v.stock !== undefined ||
          v.priceDelta !== undefined ||
          v.sku ||
          (v.attributes && Object.keys(v.attributes).length) ||
          (v.image && (v.image.public_id || v.image.url))
      ),
    { message: 'Variant must include at least one attribute or image' }
  )
  .optional();

const baseProductSchema = {
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(4, 'Description is required'),
  price: z.preprocess((val) => Number(val), z.number().positive()),
  category: z.string().min(2, 'Category is required'),
  subcategory: z.string().trim().optional(),
  stock: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
  variants: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    }, z.array(variantSchema).optional())
    .optional(),
};

export const createProductSchema = z.object({
  ...baseProductSchema,
});

export const updateProductSchema = z.object({
  ...Object.fromEntries(
    Object.entries(baseProductSchema).map(([k, v]) => [k, v.optional()])
  ),
});

export const createReviewSchema = z.object({
  rating: z.preprocess((val) => Number(val), z.number().min(1).max(5)),
  comment: z.string().trim().min(3, 'Review comment must be at least 3 characters'),
  productId: z.string().min(1, 'productId is required'),
});
