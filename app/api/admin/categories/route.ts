import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { categorySchema, validateBody } from '@/lib/schemas';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const restaurantId = new URL(request.url).searchParams.get('restaurantId');
    const categories = await db.menuCategory.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      include: { restaurant: { select: { id: true, name: true, slug: true } }, _count: { select: { products: true } } },
      orderBy: [{ restaurantId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const validation = validateBody(categorySchema, await request.json());
    if (validation instanceof NextResponse) return validation;
    const restaurant = await db.restaurant.findUnique({ where: { id: validation.data.restaurantId }, select: { id: true } });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    const category = await db.menuCategory.create({ data: { ...validation.data, imageUrl: validation.data.imageUrl || null, isActive: validation.data.isActive ?? true } });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Unable to create category. Its name must be unique within the restaurant.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
    const category = await db.menuCategory.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl?.trim() || null } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Unable to update category.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
    await db.menuCategory.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive category error:', error);
    return NextResponse.json({ error: 'Unable to archive category.' }, { status: 500 });
  }
}
