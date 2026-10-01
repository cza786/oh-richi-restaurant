import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function restaurantData(body: any) {
  return {
    name: String(body.name || '').trim(),
    slug: slugify(body.slug || body.name || ''),
    description: body.description?.trim() || null,
    logoUrl: body.logoUrl?.trim() || null,
    coverImageUrl: body.coverImageUrl?.trim() || null,
    address: String(body.address || '').trim(),
    phone: String(body.phone || '').trim(),
    whatsapp: body.whatsapp?.trim() || null,
    isActive: body.isActive !== false,
    isOpen: body.isOpen !== false,
    openingTime: body.openingTime || null,
    closingTime: body.closingTime || null,
    deliveryRadiusKm: Number(body.deliveryRadiusKm || 0),
    minimumOrderAmount: Number(body.minimumOrderAmount || 0),
    deliveryFee: Number(body.deliveryFee || 0),
  };
}

export async function GET(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const restaurants = await db.restaurant.findMany({
    include: { _count: { select: { products: true, categories: true, orders: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(restaurants.map((restaurant) => ({
    ...restaurant,
    deliveryRadiusKm: Number(restaurant.deliveryRadiusKm),
    minimumOrderAmount: Number(restaurant.minimumOrderAmount),
    deliveryFee: Number(restaurant.deliveryFee),
    _count: { ...restaurant._count, menuItems: restaurant._count.products, menuCategories: restaurant._count.categories },
  })));
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const data = restaurantData(await request.json());
    if (!data.name || !data.slug || !data.address || !data.phone) {
      return NextResponse.json({ error: 'Name, slug, address and phone are required.' }, { status: 400 });
    }
    const restaurant = await db.restaurant.create({ data });
    return NextResponse.json(restaurant, { status: 201 });
  } catch (error) {
    console.error('Create restaurant error:', error);
    return NextResponse.json({ error: 'Unable to create restaurant. The slug must be unique.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Restaurant ID is required.' }, { status: 400 });
    const data = restaurantData(body);
    if (!data.name || !data.slug || !data.address || !data.phone) {
      return NextResponse.json({ error: 'Name, slug, address and phone are required.' }, { status: 400 });
    }
    const restaurant = await db.restaurant.update({ where: { id: body.id }, data });
    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Update restaurant error:', error);
    return NextResponse.json({ error: 'Unable to update restaurant.' }, { status: 400 });
  }
}
