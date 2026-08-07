import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  signupSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  createCouponSchema,
  validateBody,
} from '@/lib/schemas';
import { NextResponse } from 'next/server';

describe('Zod Request Body Schema Validation (lib/schemas.ts)', () => {
  describe('loginSchema', () => {
    it('should validate correct login payload', () => {
      const result = validateBody(loginSchema, {
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('should reject invalid email in login payload', () => {
      const result = validateBody(loginSchema, {
        email: 'invalid-email-string',
        password: 'password123',
      });

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(400);
    });
  });

  describe('createOrderSchema', () => {
    it('should validate correct order checkout payload', () => {
      const validOrder = {
        customerName: 'Alice Smith',
        orderType: 'DINE_IN',
        subtotal: 25.0,
        totalAmount: 25.0,
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 2,
            unitPrice: 12.5,
            subtotal: 25.0,
          },
        ],
      };

      const result = validateBody(createOrderSchema, validOrder);
      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.data.customerName).toBe('Alice Smith');
        expect(result.data.orderType).toBe('DINE_IN');
      }
    });

    it('should reject order payload missing customerName or with invalid orderType', () => {
      const invalidOrder = {
        customerName: '',
        orderType: 'INVALID_TYPE',
        subtotal: 25.0,
        totalAmount: 25.0,
        orderItems: [],
      };

      const result = validateBody(createOrderSchema, invalidOrder);
      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(400);
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('should validate status update payload', () => {
      const result = validateBody(updateOrderStatusSchema, {
        id: 'order-123',
        status: 'READY',
      });

      expect(result).not.toBeInstanceOf(NextResponse);
    });

    it('should reject status update payload missing order id', () => {
      const result = validateBody(updateOrderStatusSchema, {
        status: 'READY',
      });

      expect(result).toBeInstanceOf(NextResponse);
    });
  });
});
