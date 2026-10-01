import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get('q')?.trim() || '';
    if (!query) return NextResponse.json({ restaurants: [], products: [] });
    const [restaurants, products] = await Promise.all([
      db.restaurant.findMany({
        where: { isActive: true, OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }, { address: { contains: query, mode: 'insensitive' } }] },
        include: { _count: { select: { products: true } } },
        take: 10,
      }),
      db.menuItem.findMany({
        where: { isActive: true, isAvailable: true, restaurant: { isActive: true }, OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }, { category: { name: { contains: query, mode: 'insensitive' } } }] },
        include: { category: { select: { name: true } }, restaurant: { select: { id: true, name: true, slug: true, logoUrl: true } }, options: { select: { id: true, isRequired: true } } },
        take: 20,
      }),
    ]);
    return NextResponse.json({
      restaurants: restaurants.map((restaurant) => ({ ...restaurant, _count: { ...restaurant._count, menuItems: restaurant._count.products } })),
      products: products.map((product) => ({ ...product, basePrice: Number(product.basePrice) })),
    });
  } catch (error) {
    console.error('Marketplace search error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
