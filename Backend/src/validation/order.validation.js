import { z } from 'zod';

const shippingSchema = z.object({
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  pinCode: z.union([z.string().min(1), z.number().min(1)]),
  phoneNo: z.union([z.string().min(1), z.number().min(1)]),
});

const orderItemSchema = z.object({
  name: z.string().min(1),
  price: z.preprocess((v) => Number(v), z.number().positive()),
  quantity: z.preprocess((v) => Number(v), z.number().min(1)),
  image: z.string().optional(),
  product: z.string().min(1),
  selectedColor: z.string().optional(),
  selectedSize: z.string().optional(),
  variantId: z.string().optional().nullable(),
});

export const createOrderSchema = z.object({
  shippingInfo: shippingSchema,
  orderItems: z.array(orderItemSchema).min(1),
  paymentInfo: z
    .object({
      id: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  itemPrice: z.preprocess((v) => Number(v), z.number().min(0)),
  taxPrice: z.preprocess((v) => Number(v), z.number().min(0)),
  shippingPrice: z.preprocess((v) => Number(v), z.number().min(0)),
  discountPrice: z.preprocess((v) => Number(v), z.number().min(0)).optional(),
  promoCode: z.string().trim().optional(),
  totalPrice: z.preprocess((v) => Number(v), z.number().min(0)),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Processing', 'Shipped', 'Delivered', 'Cancelled']),
});
