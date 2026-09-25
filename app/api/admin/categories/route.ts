import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

// GET categories for a restaurant (or all)
export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    const where: any = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const categories = await db.menuCategory.findMany({
      where,
      include: {
        restaurant: { select: { id: true, name: true, slug: true } },
        _count: { select: { menuItems: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Admin fetch categories error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create category
export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { restaurantId, name, description, sortOrder } = body;

    if (!restaurantId || !name || !name.trim()) {
      return NextResponse.json({ error: 'restaurantId and name are required.' }, { status: 400 });
    }

    // Get restaurant main location
    const location = await db.restaurantLocation.findFirst({
      where: { restaurantId },
    });

    if (!location) {
      return NextResponse.json({ error: 'Restaurant location not found.' }, { status: 400 });
    }

    const category = await db.menuCategory.create({
      data: {
        restaurantId,
        locationId: location.id,
        name: name.trim(),
        description: description?.trim() || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isActive: true,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Admin create category error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT update category
export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, name, description, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await db.menuCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Admin update category error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
    }

    await db.menuCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error: any) {
    console.error('Admin delete category error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
