import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { POST as createProduct, PUT as updateProduct, DELETE as archiveProduct } from '@/app/api/menu/route';

export async function GET(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId');
  const categoryId = searchParams.get('categoryId');
  const products = await db.menuItem.findMany({
    where: { ...(restaurantId ? { restaurantId } : {}), ...(categoryId ? { categoryId } : {}) },
    include: {
      category: true,
      restaurant: { select: { id: true, name: true, slug: true } },
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      options: { include: { items: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: [{ restaurantId: 'asc' }, { sortOrder: 'asc' }],
  });
  return NextResponse.json(products.map((product) => ({
    ...product,
    basePrice: Number(product.basePrice),
    options: product.options.map((option) => ({ ...option, items: option.items.map((item) => ({ ...item, priceDelta: Number(item.priceDelta) })) })),
  })));
}

export const POST = createProduct;
export const PUT = updateProduct;
export const DELETE = archiveProduct;
