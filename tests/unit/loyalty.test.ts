import { describe, it, expect, vi } from 'vitest';
import { calculateEarnedPoints } from '@/lib/loyaltyService';

// Mock DB client
vi.mock('@/lib/db', () => ({
  default: {
    loyaltyRule: {
      findFirst: vi.fn(),
    },
  },
}));

import db from '@/lib/db';

describe('Loyalty Service Business Logic (lib/loyaltyService.ts)', () => {
  it('should return 0 points when no active loyalty rule exists', async () => {
    vi.mocked(db.loyaltyRule.findFirst).mockResolvedValueOnce(null);

    const points = await calculateEarnedPoints(50, 'DINE_IN', 50, 5, 0);
    expect(points).toBe(0);
  });

  it('should calculate points correctly based on pointsPerEuro setting', async () => {
    vi.mocked(db.loyaltyRule.findFirst).mockResolvedValueOnce({
      id: 'rule-1',
      earnOnDineIn: true,
      earnOnTakeAway: true,
      earnOnDelivery: true,
      minimumOrderAmount: 10.0,
      pointsPerEuro: 2.0,
      maximumPointsPerOrder: null,
      isActive: true,
    } as any);

    // subtotal = 40, discount = 5 -> base = 35 -> points = 35 * 2 = 70
    const points = await calculateEarnedPoints(40, 'DINE_IN', 40, 4, 5);
    expect(points).toBe(70);
  });

  it('should return 0 points if order total is below minimum required order threshold', async () => {
    vi.mocked(db.loyaltyRule.findFirst).mockResolvedValueOnce({
      id: 'rule-1',
      earnOnDineIn: true,
      earnOnTakeAway: true,
      earnOnDelivery: true,
      minimumOrderAmount: 25.0,
      pointsPerEuro: 1.0,
      maximumPointsPerOrder: null,
      isActive: true,
    } as any);

    // Order total = 15 < minimumRequired 25
    const points = await calculateEarnedPoints(15, 'DINE_IN', 15, 1.5, 0);
    expect(points).toBe(0);
  });

  it('should cap points if maximumPointsPerOrder is configured', async () => {
    vi.mocked(db.loyaltyRule.findFirst).mockResolvedValueOnce({
      id: 'rule-1',
      earnOnDineIn: true,
      earnOnTakeAway: true,
      earnOnDelivery: true,
      minimumOrderAmount: 10.0,
      pointsPerEuro: 1.0,
      maximumPointsPerOrder: 100,
      isActive: true,
    } as any);

    // subtotal = 250 -> points before cap = 250 -> capped at 100
    const points = await calculateEarnedPoints(250, 'DELIVERY', 250, 20, 0);
    expect(points).toBe(100);
  });
});
