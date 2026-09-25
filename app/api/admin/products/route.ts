import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

// GET products for a restaurant (or category / all)
export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const categoryId = searchParams.get('categoryId');

    const where: any = {};
    if (restaurantId) where.restaurantId = restaurantId;
    if (categoryId) where.categoryId = categoryId;

    const products = await db.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true, slug: true } },
        variations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Admin fetch products error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create product
export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { restaurantId, categoryId, name, description, basePrice, imageUrl, isAvailable } = body;

    if (!restaurantId || !categoryId || !name || !name.trim() || basePrice === undefined) {
      return NextResponse.json({ error: 'restaurantId, categoryId, name, and basePrice are required.' }, { status: 400 });
    }

    const product = await db.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        name: name.trim(),
        description: description?.trim() || null,
        basePrice: Number(basePrice),
        imageUrl: imageUrl?.trim() || '/burger_hero.png',
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        isActive: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Admin create product error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT update product
export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, categoryId, name, description, basePrice, imageUrl, isAvailable, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await db.menuItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Admin update product error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    await db.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    console.error('Admin delete product error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
