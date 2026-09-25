import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all active restaurants for Door2Door marketplace directory
export async function GET() {
  try {
    const restaurants = await db.restaurant.findMany({
      where: { isActive: true },
      include: {
        locations: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            city: true,
            addressLine1: true,
            phone: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(restaurants);
  } catch (error: any) {
    console.error('Fetch restaurants error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
