import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Restaurant slug is required.' }, { status: 400 });
    }

    const restaurant = await db.restaurant.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        locations: {
          where: { isActive: true },
        },
        menuCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { isActive: true },
              include: {
                variations: { where: { isAvailable: true } },
                itemAddons: { include: { addon: true } },
                itemSpiceLevels: { include: { spiceLevel: true } },
              },
            },
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error: any) {
    console.error('Fetch restaurant by slug error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
