import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

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
      const restaurant = await db.restaurant.update({
        where: { id: body.restaurantId },
        data: {
          deliveryRadiusKm: Number(body.deliveryRadius || 0),
          minimumOrderAmount: Number(body.minimumOrderAmount || 0),
          deliveryFee: Number(body.baseDeliveryFee || 0),
        },
      });
      return NextResponse.json({ success: true, restaurant });
    }
    if (body.action === 'create_zone') {
      if (!body.restaurantId || !body.zoneName?.trim()) return NextResponse.json({ error: 'Restaurant and zone name are required.' }, { status: 400 });
      const zone = await db.deliveryZone.create({
        data: { restaurantId: body.restaurantId, name: body.zoneName.trim(), polygon: body.polygon ?? undefined, deliveryFee: Number(body.deliveryFee || 0), isActive: body.isActive !== false },
      });
      return NextResponse.json({ success: true, zone }, { status: 201 });
    }
    if (body.action === 'update_zone') {
      if (!body.zoneId) return NextResponse.json({ error: 'Zone ID is required.' }, { status: 400 });
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
