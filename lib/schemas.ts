import { z } from 'zod';
import { NextResponse } from 'next/server';

const moneyField = z.preprocess((value) => Number(value), z.number().finite().nonnegative());

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.'),
});

export const orderItemSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required.'),
  quantity: z.preprocess((value) => Number(value), z.number().int().min(1).max(99)),
  optionItemIds: z.array(z.string().trim().min(1)).max(20).default([]),
});

export const createOrderSchema = z.object({
  restaurantId: z.string().trim().min(1, 'Restaurant ID is required.'),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(3).max(40),
    whatsapp: z.string().trim().max(40).optional().nullable(),
    address: z.string().trim().min(5).max(500),
    latitude: z.number().finite().min(-90).max(90).optional().nullable(),
    longitude: z.number().finite().min(-180).max(180).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  }),
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
  customerNote: z.string().trim().max(1000).optional().nullable(),
  orderItems: z.array(orderItemSchema).min(1).max(100),
});

export const updateOrderStatusSchema = z.object({
  id: z.string().trim().min(1, 'Order ID is required.'),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
  adminNote: z.string().trim().max(1000).optional().nullable(),
}).refine((value) => value.status !== undefined || value.paymentStatus !== undefined || value.adminNote !== undefined, {
  message: 'At least one update field is required.',
});

export const categorySchema = z.object({
  restaurantId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.preprocess((value) => Number(value ?? 0), z.number().int()),
  isActive: z.boolean().optional(),
});

export const optionItemInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  priceDelta: moneyField.default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.preprocess((value) => Number(value ?? 0), z.number().int()),
});

export const productOptionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  isRequired: z.boolean().default(false),
  sortOrder: z.preprocess((value) => Number(value ?? 0), z.number().int()),
  items: z.array(optionItemInputSchema).min(1),
});

export const productImageInputSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().trim().min(1).max(2000),
  isPrimary: z.boolean().default(false),
  sortOrder: z.preprocess((value) => Number(value ?? 0), z.number().int()),
});

export const productSchema = z.object({
  restaurantId: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(3000).optional().nullable(),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
  basePrice: moneyField,
  sortOrder: z.preprocess((value) => Number(value ?? 0), z.number().int()),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  options: z.array(productOptionInputSchema).default([]),
  images: z.array(productImageInputSchema).default([]),
});

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | NextResponse {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data };

  return NextResponse.json(
    {
      error: 'Validation failed. Invalid request body format.',
      details: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    },
    { status: 400 }
  );
}
