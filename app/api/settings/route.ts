import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

function serializeRestaurant(restaurant: any) {
  return {
    ...restaurant,
    deliveryRadiusKm: Number(restaurant.deliveryRadiusKm),
    minimumOrderAmount: Number(restaurant.minimumOrderAmount),
    deliveryFee: Number(restaurant.deliveryFee),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const restaurant = restaurantId
      ? await db.restaurant.findUnique({ where: { id: restaurantId } })
      : await db.restaurant.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });

    let platformSettings: Array<{ key: string; value: string; description: string | null }> | undefined;
    if (searchParams.get('includeGeneric') === 'true') {
      const authResult = await requireRole(request, ['SUPER_ADMIN']);
      if (authResult instanceof NextResponse) return authResult;
      platformSettings = await db.setting.findMany({ select: { key: true, value: true, description: true }, orderBy: { key: 'asc' } });
    }
    return NextResponse.json({ ...serializeRestaurant(restaurant), ...(platformSettings ? { platformSettings } : {}) });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Restaurant ID is required.' }, { status: 400 });
    if (!body.name?.trim() || !body.address?.trim() || !body.phone?.trim()) {
      return NextResponse.json({ error: 'Name, address and phone are required.' }, { status: 400 });
    }
    const restaurant = await db.$transaction(async (tx) => {
      const updated = await tx.restaurant.update({
        where: { id: body.id },
        data: {
          name: body.name.trim(),
          description: body.description?.trim() || null,
          logoUrl: body.logoUrl?.trim() || null,
          coverImageUrl: body.coverImageUrl?.trim() || null,
          address: body.address.trim(),
          phone: body.phone.trim(),
          whatsapp: body.whatsapp?.trim() || null,
          isActive: body.isActive !== false,
          isOpen: body.isOpen !== false,
          openingTime: body.openingTime || null,
          closingTime: body.closingTime || null,
          deliveryRadiusKm: Number(body.deliveryRadiusKm || 0),
          minimumOrderAmount: Number(body.minimumOrderAmount || 0),
          deliveryFee: Number(body.deliveryFee || 0),
        },
      });
      if (Array.isArray(body.platformSettings)) {
        for (const setting of body.platformSettings) {
          const key = String(setting.key || '').trim();
          if (!key) continue;
          await tx.setting.upsert({
            where: { key },
            update: { value: String(setting.value ?? ''), description: setting.description?.trim() || null },
            create: { key, value: String(setting.value ?? ''), description: setting.description?.trim() || null },
          });
        }
      }
      return updated;
    });
    return NextResponse.json(serializeRestaurant(restaurant));
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Unable to update settings.' }, { status: 500 });
  }
}
