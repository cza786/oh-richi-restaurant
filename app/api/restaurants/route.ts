import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const restaurants = await db.restaurant.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true, orders: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(restaurants.map((restaurant) => ({
      ...restaurant,
      deliveryRadiusKm: Number(restaurant.deliveryRadiusKm),
      minimumOrderAmount: Number(restaurant.minimumOrderAmount),
      deliveryFee: Number(restaurant.deliveryFee),
      _count: { ...restaurant._count, menuItems: restaurant._count.products },
    })));
  } catch (error) {
    console.error('Fetch restaurants error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
