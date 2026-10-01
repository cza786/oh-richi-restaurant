import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { productSchema, validateBody } from '@/lib/schemas';

const productInclude = {
  category: true,
  restaurant: { select: { id: true, name: true, slug: true } },
  images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
  options: { orderBy: { sortOrder: 'asc' as const }, include: { items: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } } } },
};

function serializeProduct(product: any) {
  return {
    ...product,
    basePrice: Number(product.basePrice),
    options: product.options?.map((option: any) => ({
      ...option,
      items: option.items.map((item: any) => ({ ...item, priceDelta: Number(item.priceDelta) })),
    })) || [],
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const restaurantId = searchParams.get('restaurantId');
    const slug = searchParams.get('slug');
    let resolvedRestaurantId = restaurantId || undefined;
    if (!resolvedRestaurantId && slug) {
      const restaurant = await db.restaurant.findUnique({ where: { slug: slug.toLowerCase() }, select: { id: true } });
      resolvedRestaurantId = restaurant?.id;
      if (!resolvedRestaurantId) return NextResponse.json(id ? null : []);
    }

    if (id) {
      const product = await db.menuItem.findFirst({
        where: { id, isActive: true, restaurant: { isActive: true }, ...(resolvedRestaurantId ? { restaurantId: resolvedRestaurantId } : {}) },
        include: productInclude,
      });
      return product ? NextResponse.json(serializeProduct(product)) : NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const products = await db.menuItem.findMany({
      where: { isActive: true, restaurant: { isActive: true }, ...(resolvedRestaurantId ? { restaurantId: resolvedRestaurantId } : {}) },
      include: productInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(products.map(serializeProduct));
  } catch (error) {
    console.error('Fetch menu error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const validation = validateBody(productSchema, await request.json());
    if (validation instanceof NextResponse) return validation;
    const input = validation.data;

    const category = await db.menuCategory.findFirst({ where: { id: input.categoryId, restaurantId: input.restaurantId, isActive: true } });
    if (!category) return NextResponse.json({ error: 'Category does not belong to this restaurant.' }, { status: 400 });

    const product = await db.menuItem.create({
      data: {
        restaurantId: input.restaurantId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description || null,
        imageUrl: input.imageUrl || input.images.find((image) => image.isPrimary)?.imageUrl || input.images[0]?.imageUrl || null,
        basePrice: input.basePrice,
        sortOrder: input.sortOrder,
        isAvailable: input.isAvailable,
        isActive: input.isActive,
        images: { create: input.images.map(({ id: _id, ...image }) => image) },
        options: {
          create: input.options.map(({ id: _id, items, ...option }) => ({
            ...option,
            items: { create: items.map(({ id: _itemId, ...item }) => item) },
          })),
        },
      },
      include: productInclude,
    });
    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    console.error('Create menu item error:', error);
    return NextResponse.json({ error: 'Unable to create product.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });

    const existing = await db.menuItem.findUnique({ where: { id: body.id }, include: { options: { include: { items: true } }, images: true } });
    if (!existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    const restaurantId = body.restaurantId ?? existing.restaurantId;
    const categoryId = body.categoryId ?? existing.categoryId;
    const category = await db.menuCategory.findFirst({ where: { id: categoryId, restaurantId } });
    if (!category) return NextResponse.json({ error: 'Category does not belong to this restaurant.' }, { status: 400 });
    const existingImageIds = new Set(existing.images.map((image) => image.id));
    if (Array.isArray(body.images) && body.images.some((image: any) => image.id && !existingImageIds.has(image.id))) {
      return NextResponse.json({ error: 'An image does not belong to this product.' }, { status: 400 });
    }
    const existingOptions = new Map(existing.options.map((option) => [option.id, option]));
    if (Array.isArray(body.options)) {
      for (const option of body.options) {
        if (option.id && !existingOptions.has(option.id)) return NextResponse.json({ error: 'An option does not belong to this product.' }, { status: 400 });
        const currentOption = option.id ? existingOptions.get(option.id) : undefined;
        const existingItemIds = new Set((currentOption?.items || []).map((item) => item.id));
        if ((option.items || []).some((item: any) => item.id && !existingItemIds.has(item.id))) {
          return NextResponse.json({ error: 'An option item does not belong to this product option.' }, { status: 400 });
        }
      }
    }

    await db.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id: existing.id },
        data: {
          restaurantId,
          categoryId,
          ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
          ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
          ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl?.trim() || null } : {}),
          ...(body.basePrice !== undefined ? { basePrice: Number(body.basePrice) } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
          ...(body.isAvailable !== undefined ? { isAvailable: Boolean(body.isAvailable) } : {}),
          ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        },
      });

      if (Array.isArray(body.images)) {
        const retainedIds = body.images.map((image: any) => image.id).filter(Boolean);
        await tx.productImage.deleteMany({ where: { productId: existing.id, ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}) } });
        for (const image of body.images) {
          const data = { imageUrl: String(image.imageUrl).trim(), isPrimary: Boolean(image.isPrimary), sortOrder: Number(image.sortOrder || 0) };
          if (image.id) await tx.productImage.update({ where: { id: image.id }, data });
          else await tx.productImage.create({ data: { productId: existing.id, ...data } });
        }
      }

      if (Array.isArray(body.options)) {
        for (const option of body.options) {
          const optionData = { name: String(option.name).trim(), isRequired: Boolean(option.isRequired), sortOrder: Number(option.sortOrder || 0) };
          const savedOption = option.id
            ? await tx.productOption.update({ where: { id: option.id }, data: optionData })
            : await tx.productOption.create({ data: { productId: existing.id, ...optionData } });
          const retainedItemIds = (option.items || []).map((item: any) => item.id).filter(Boolean);
          await tx.optionItem.updateMany({ where: { optionId: savedOption.id, ...(retainedItemIds.length ? { id: { notIn: retainedItemIds } } : {}) }, data: { isActive: false } });
          for (const item of option.items || []) {
            const itemData = { name: String(item.name).trim(), priceDelta: Number(item.priceDelta || 0), isActive: item.isActive !== false, sortOrder: Number(item.sortOrder || 0) };
            if (item.id) await tx.optionItem.update({ where: { id: item.id }, data: itemData });
            else await tx.optionItem.create({ data: { optionId: savedOption.id, ...itemData } });
          }
        }
      }
    });

    const updated = await db.menuItem.findUnique({ where: { id: existing.id }, include: productInclude });
    return NextResponse.json(serializeProduct(updated));
  } catch (error) {
    console.error('Update menu item error:', error);
    return NextResponse.json({ error: 'Unable to update product.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    await db.menuItem.update({ where: { id }, data: { isActive: false, isAvailable: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive menu item error:', error);
    return NextResponse.json({ error: 'Unable to archive product.' }, { status: 500 });
  }
}
