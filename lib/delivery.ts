export type Coordinates = { latitude: number; longitude: number };

type ZoneLike = {
  id: string;
  name: string;
  polygon: unknown;
  deliveryFee: unknown;
  isActive: boolean;
};

function asPolygons(value: unknown): number[][][][] {
  if (!value || typeof value !== 'object') return [];
  const shape = value as { type?: unknown; coordinates?: unknown };
  if (shape.type === 'Polygon' && Array.isArray(shape.coordinates)) {
    return [shape.coordinates as number[][][]];
  }
  if (shape.type === 'MultiPolygon' && Array.isArray(shape.coordinates)) {
    return shape.coordinates as number[][][][];
  }
  return [];
}

export function isSupportedDeliveryPolygon(value: unknown): boolean {
  const polygons = asPolygons(value);
  return polygons.length > 0 && polygons.every((rings) => rings.length > 0 && rings.every((ring) => ring.length >= 4));
}

function pointInRing(longitude: number, latitude: number, ring: number[][]): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    if (!Array.isArray(currentPoint) || !Array.isArray(previousPoint)) continue;
    const [currentLongitude, currentLatitude] = currentPoint;
    const [previousLongitude, previousLatitude] = previousPoint;
    if (![currentLongitude, currentLatitude, previousLongitude, previousLatitude].every(Number.isFinite)) continue;

    const crossesLatitude = (currentLatitude > latitude) !== (previousLatitude > latitude);
    const crossingLongitude = ((previousLongitude - currentLongitude) * (latitude - currentLatitude))
      / (previousLatitude - currentLatitude) + currentLongitude;
    if (crossesLatitude && longitude < crossingLongitude) inside = !inside;
  }
  return inside;
}

export function pointInGeoJson(coordinates: Coordinates, polygon: unknown): boolean {
  return asPolygons(polygon).some((rings) => {
    const [outerRing, ...holes] = rings;
    if (!outerRing || !pointInRing(coordinates.longitude, coordinates.latitude, outerRing)) return false;
    return !holes.some((hole) => pointInRing(coordinates.longitude, coordinates.latitude, hole));
  });
}

export function resolveDelivery(
  zones: ZoneLike[],
  coordinates: Coordinates | null,
  fallbackFee: number,
): { available: boolean; fee: number; zone: { id: string; name: string } | null; requiresCoordinates: boolean } {
  const mappedZones = zones.filter((zone) => zone.isActive && asPolygons(zone.polygon).length > 0);
  if (mappedZones.length === 0) {
    return { available: true, fee: fallbackFee, zone: null, requiresCoordinates: false };
  }
  if (!coordinates) {
    return { available: false, fee: fallbackFee, zone: null, requiresCoordinates: true };
  }

  const match = mappedZones.find((zone) => pointInGeoJson(coordinates, zone.polygon));
  if (!match) return { available: false, fee: fallbackFee, zone: null, requiresCoordinates: false };
  return {
    available: true,
    fee: Number(match.deliveryFee),
    zone: { id: match.id, name: match.name },
    requiresCoordinates: false,
  };
}
