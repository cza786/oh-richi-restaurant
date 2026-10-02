import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { isSupportedDeliveryPolygon, resolveDelivery } from '@/lib/delivery';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.restaurantId) return NextResponse.json({ error: 'Restaurant ID is required.' }, { status: 400 });
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const coordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;
    const restaurant = await db.restaurant.findFirst({
      where: { id: body.restaurantId, isActive: true },
      include: { deliveryZones: { where: { isActive: true } } },
    });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    const delivery = resolveDelivery(restaurant.deliveryZones, coordinates, Number(restaurant.deliveryFee));
    if (!delivery.available) {
      return NextResponse.json({
        error: delivery.requiresCoordinates
          ? 'Location is required for this restaurant.'
          : 'Location is outside the configured delivery zones.',
        requiresCoordinates: delivery.requiresCoordinates,
      }, { status: 400 });
    }
    return NextResponse.json({ deliveryFee: delivery.fee, zone: delivery.zone });
  } catch (error) {
    console.error('Delivery quote error:', error);
    return NextResponse.json({ error: 'Unable to calculate delivery.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const restaurantId = new URL(request.url).searchParams.get('restaurantId');
  const restaurant = restaurantId ? await db.restaurant.findUnique({ where: { id: restaurantId } }) : await db.restaurant.findFirst();
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
  const zones = await db.deliveryZone.findMany({ where: { restaurantId: restaurant.id }, orderBy: { name: 'asc' } });
  return NextResponse.json({
    settings: {
      restaurantId: restaurant.id,
      deliveryRadius: Number(restaurant.deliveryRadiusKm),
      minimumOrderAmount: Number(restaurant.minimumOrderAmount),
      baseDeliveryFee: Number(restaurant.deliveryFee),
    },
    zones: zones.map((zone) => ({ ...zone, deliveryFee: Number(zone.deliveryFee) })),
  });
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();

    if (body.action === 'update_settings') {
      if (!body.restaurantId) return NextResponse.json({ error: 'Restaurant ID is required.' }, { status: 400 });
      const deliveryRadiusKm = Number(body.deliveryRadius || 0);
      const minimumOrderAmount = Number(body.minimumOrderAmount || 0);
      const deliveryFee = Number(body.baseDeliveryFee || 0);
      if (![deliveryRadiusKm, minimumOrderAmount, deliveryFee].every((value) => Number.isFinite(value) && value >= 0)) {
        return NextResponse.json({ error: 'Delivery values must be non-negative numbers.' }, { status: 400 });
      }
      const restaurant = await db.restaurant.update({
        where: { id: body.restaurantId },
        data: {
          deliveryRadiusKm,
          minimumOrderAmount,
          deliveryFee,
        },
      });
      return NextResponse.json({ success: true, restaurant });
    }
    if (body.action === 'create_zone') {
      if (!body.restaurantId || !body.zoneName?.trim()) return NextResponse.json({ error: 'Restaurant and zone name are required.' }, { status: 400 });
      if (body.polygon != null && !isSupportedDeliveryPolygon(body.polygon)) return NextResponse.json({ error: 'Zone polygon must be valid GeoJSON Polygon or MultiPolygon data.' }, { status: 400 });
      const deliveryFee = Number(body.deliveryFee || 0);
      if (!Number.isFinite(deliveryFee) || deliveryFee < 0) return NextResponse.json({ error: 'Delivery fee must be a non-negative number.' }, { status: 400 });
      const zone = await db.deliveryZone.create({
        data: { restaurantId: body.restaurantId, name: body.zoneName.trim(), polygon: body.polygon ?? undefined, deliveryFee, isActive: body.isActive !== false },
      });
      return NextResponse.json({ success: true, zone }, { status: 201 });
    }
    if (body.action === 'update_zone') {
      if (!body.zoneId) return NextResponse.json({ error: 'Zone ID is required.' }, { status: 400 });
      if (body.polygon != null && !isSupportedDeliveryPolygon(body.polygon)) return NextResponse.json({ error: 'Zone polygon must be valid GeoJSON Polygon or MultiPolygon data.' }, { status: 400 });
      if (body.deliveryFee !== undefined && (!Number.isFinite(Number(body.deliveryFee)) || Number(body.deliveryFee) < 0)) return NextResponse.json({ error: 'Delivery fee must be a non-negative number.' }, { status: 400 });
      const zone = await db.deliveryZone.update({
        where: { id: body.zoneId },
        data: { ...(body.zoneName !== undefined ? { name: body.zoneName.trim() } : {}), ...(body.polygon !== undefined ? { polygon: body.polygon } : {}), ...(body.deliveryFee !== undefined ? { deliveryFee: Number(body.deliveryFee) } : {}), ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}) },
      });
      return NextResponse.json({ success: true, zone });
    }
    if (body.action === 'delete_zone') {
      if (!body.zoneId) return NextResponse.json({ error: 'Zone ID is required.' }, { status: 400 });
      await db.deliveryZone.delete({ where: { id: body.zoneId } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid delivery action.' }, { status: 400 });
  } catch (error) {
    console.error('Update delivery error:', error);
    return NextResponse.json({ error: 'Unable to update delivery configuration.' }, { status: 500 });
  }
}
