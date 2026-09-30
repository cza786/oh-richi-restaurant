import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({ restaurants: [], products: [] });
    }

    const lowerQuery = query.toLowerCase();

    // 1. Search matching Restaurants
    const restaurants = await db.restaurant.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        locations: { select: { city: true, addressLine1: true } },
        _count: { select: { menuItems: true } },
      },
      take: 10,
    });

    // 2. Search matching Menu Items across all restaurants
    const products = await db.menuItem.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        restaurant: { isActive: true },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: { select: { name: true } },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
      take: 20,
    });

    const formattedProducts = products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
    }));

    return NextResponse.json({
      restaurants,
      products: formattedProducts,
    });
  } catch (error: any) {
    console.error('Marketplace global search error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
