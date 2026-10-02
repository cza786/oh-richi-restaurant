import { describe, expect, it } from 'vitest';
import { isSupportedDeliveryPolygon, pointInGeoJson, resolveDelivery } from '@/lib/delivery';
import { isWithinOpeningHours } from '@/lib/restaurantHours';

const polygon = {
  type: 'Polygon',
  coordinates: [[[66, 24], [68, 24], [68, 26], [66, 26], [66, 24]]],
};

describe('delivery rules', () => {
  it('finds coordinates inside a GeoJSON polygon', () => {
    expect(isSupportedDeliveryPolygon(polygon)).toBe(true);
    expect(isSupportedDeliveryPolygon({ type: 'Polygon', coordinates: [] })).toBe(false);
    expect(pointInGeoJson({ latitude: 25, longitude: 67 }, polygon)).toBe(true);
    expect(pointInGeoJson({ latitude: 30, longitude: 67 }, polygon)).toBe(false);
  });

  it('uses the matching delivery-zone fee', () => {
    const result = resolveDelivery([
      { id: 'zone-1', name: 'Central', polygon, deliveryFee: 4.5, isActive: true },
    ], { latitude: 25, longitude: 67 }, 2);
    expect(result).toMatchObject({ available: true, fee: 4.5, zone: { id: 'zone-1' } });
  });

  it('requires coordinates when mapped zones exist', () => {
    const result = resolveDelivery([
      { id: 'zone-1', name: 'Central', polygon, deliveryFee: 4.5, isActive: true },
    ], null, 2);
    expect(result).toMatchObject({ available: false, requiresCoordinates: true });
  });

  it('falls back to the restaurant fee when no mapped zones exist', () => {
    const result = resolveDelivery([], null, 3);
    expect(result).toMatchObject({ available: true, fee: 3, requiresCoordinates: false });
  });
});

describe('restaurant opening hours', () => {
  it('supports ordinary daytime hours', () => {
    expect(isWithinOpeningHours('10:00', '23:00', new Date('2026-10-02T12:00:00Z'), 'UTC')).toBe(true);
    expect(isWithinOpeningHours('10:00', '23:00', new Date('2026-10-02T09:00:00Z'), 'UTC')).toBe(false);
  });

  it('supports opening hours that cross midnight', () => {
    expect(isWithinOpeningHours('18:00', '02:00', new Date('2026-10-02T23:00:00Z'), 'UTC')).toBe(true);
    expect(isWithinOpeningHours('18:00', '02:00', new Date('2026-10-02T03:00:00Z'), 'UTC')).toBe(false);
  });
});
