import { z } from 'zod';
import { NextResponse } from 'next/server';

// Helper for string/number conversion
const numericField = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const parsed = Number(val);
  return isNaN(parsed) ? val : parsed;
}, z.number());

// 1. Auth Schemas
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.'),
});

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.string().trim().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

// 2. Order Schemas
export const orderItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required.'),
  quantity: z.preprocess((val) => Number(val), z.number().int().positive('Item quantity must be at least 1.')),
  unitPrice: numericField,
  subtotal: numericField,
  notes: z.string().optional().nullable(),
});

export const createOrderSchema = z.object({
  restaurantId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customerName: z.string().trim().min(1, 'Customer name is required.'),
  customerPhone: z.string().optional().nullable(),
  customerEmail: z.string().trim().email('Invalid customer email address.').optional().nullable(),
  tableId: z.string().optional().nullable(),
  orderType: z.enum(['TAKEAWAY', 'DELIVERY']),
  subtotal: numericField,
  taxAmount: numericField.optional().default(0),
  deliveryFee: numericField.optional().default(0),
  discountAmount: numericField.optional().default(0),
  totalAmount: numericField,
  specialInstructions: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  orderItems: z.array(orderItemSchema).min(1, 'Order must contain at least one order item.'),
  couponCode: z.string().optional().nullable(),
  redemptionCode: z.string().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  id: z.string().min(1, 'Order ID is required.'),
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
});

// 3. Coupon Schemas
export const createCouponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required.'),
  name: z.string().trim().min(1, 'Coupon name is required.'),
  discountType: z.enum(['percentage_discount', 'amount_discount', 'free_item']),
  discountValue: numericField,
  minimumOrderAmount: numericField.optional().default(0),
  maxDiscountAmount: numericField.optional().nullable(),
  dineInAllowed: z.boolean().optional().default(true),
  takeAwayAllowed: z.boolean().optional().default(true),
  guestAllowed: z.boolean().optional().default(true),
});

// 4. Promotion Schemas
export const createPromotionSchema = z.object({
  name: z.string().trim().min(1, 'Promotion name is required.'),
  promotionType: z.enum(['HAPPY_HOUR', 'SPECIAL_DEAL', 'BANNER_PROMO']),
  discountType: z.enum(['percentage_discount', 'amount_discount']),
  discountValue: numericField,
  dineInAllowed: z.boolean().optional().default(true),
  takeAwayAllowed: z.boolean().optional().default(true),
});

// 5. Reward Schemas
export const createRewardSchema = z.object({
  name: z.string().trim().min(1, 'Reward name is required.'),
  requiredPoints: z.preprocess((val) => Number(val), z.number().int().positive()),
  rewardType: z.enum(['DISCOUNT_AMOUNT', 'DISCOUNT_PERCENTAGE', 'FREE_ITEM']),
  discountAmount: numericField.optional().nullable(),
  discountPercentage: numericField.optional().nullable(),
});

/**
 * Validates data against a Zod schema. Returns { data } or formatted 400 Bad Request NextResponse.
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T } | NextResponse {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return NextResponse.json(
      {
        error: 'Validation failed. Invalid request body format.',
        details: formattedErrors,
      },
      { status: 400 }
    );
  }

  return { data: result.data };
}
