import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  createOrderSchema,
  updateOrderStatusSchema,
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
        restaurantId: 'restaurant-1',
        customer: {
          name: 'Alice Smith',
          phone: '+1 555 0100',
          address: '10 Main Street',
        },
        paymentMethod: 'cod',
        orderItems: [
          {
            productId: 'item-1',
            quantity: 2,
            optionItemIds: [],
          },
        ],
      };

      const result = validateBody(createOrderSchema, validOrder);
      expect(result).not.toBeInstanceOf(NextResponse);
      if (!(result instanceof NextResponse)) {
        expect(result.data.customer.name).toBe('Alice Smith');
        expect(result.data.paymentMethod).toBe('cod');
      }
    });

    it('should reject order payload missing customerName or with invalid orderType', () => {
      const invalidOrder = {
        restaurantId: 'restaurant-1',
        customer: { name: '', phone: '', address: '' },
        paymentMethod: 'invalid',
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
        status: 'ready',
      });

      expect(result).not.toBeInstanceOf(NextResponse);
    });

    it('should reject status update payload missing order id', () => {
      const result = validateBody(updateOrderStatusSchema, {
        status: 'ready',
      });

      expect(result).toBeInstanceOf(NextResponse);
    });
  });
});
