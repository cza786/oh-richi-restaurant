import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const restaurant = await db.restaurant.findFirst({
      where: { slug: slug.toLowerCase(), isActive: true },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: { isActive: true },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
              include: {
                images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
                options: { orderBy: { sortOrder: 'asc' }, include: { items: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } },
              },
            },
          },
        },
      },
    });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    const menuCategories = restaurant.categories.map((category) => ({
      ...category,
      menuItems: category.products.map((product) => ({
        ...product,
        basePrice: Number(product.basePrice),
        options: product.options.map((option) => ({ ...option, items: option.items.map((item) => ({ ...item, priceDelta: Number(item.priceDelta) })) })),
      })),
    }));
    return NextResponse.json({
      ...restaurant,
      deliveryRadiusKm: Number(restaurant.deliveryRadiusKm),
      minimumOrderAmount: Number(restaurant.minimumOrderAmount),
      deliveryFee: Number(restaurant.deliveryFee),
      menuCategories,
    });
  } catch (error) {
    console.error('Fetch restaurant error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
