import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all menu items (optional filter by restaurant slug or restaurantId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const restaurantId = searchParams.get('restaurantId');

    const whereClause: any = { isActive: true };

    if (restaurantId) {
      whereClause.restaurantId = restaurantId;
    } else if (slug) {
      const restaurant = await db.restaurant.findUnique({
        where: { slug: slug.toLowerCase() },
      });
      if (restaurant) {
        whereClause.restaurantId = restaurant.id;
      }
    }

    const items = await db.menuItem.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format Decimal values to numbers for simple frontend integration
    const formattedItems = items.map(item => ({
      ...item,
      basePrice: Number(item.basePrice),
    }));

    return NextResponse.json(formattedItems);
  } catch (error: any) {
    console.error('Fetch menu items error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create menu item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, categoryName, basePrice, description, imageUrl } = body;

    if (!name || !basePrice) {
      return NextResponse.json({ error: 'Name and base price are required.' }, { status: 400 });
    }

    // Resolve or find target category
    const catName = categoryName || 'Burgers';
    let category = await db.menuCategory.findFirst({
      where: { name: catName },
    });

    // Create category if none exists to avoid DB constraints violation
    if (!category) {
      // Find a location to bind the category to
      const location = await db.restaurantLocation.findFirst();
      if (!location) {
        return NextResponse.json({ error: 'No restaurant locations exist to bind the menu item.' }, { status: 400 });
      }

      category = await db.menuCategory.create({
        data: {
          name: catName,
          restaurantId: location.restaurantId,
          locationId: location.id,
          isActive: true,
        },
      });
    }

    const newItem = await db.menuItem.create({
      data: {
        name,
        restaurantId: category.restaurantId,
        categoryId: category.id,
        basePrice: Number(basePrice),
        description: description || '',
        imageUrl: imageUrl || null,
        isAvailable: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      ...newItem,
      basePrice: Number(newItem.basePrice),
    });
  } catch (error: any) {
    console.error('Create menu item error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT edit menu item
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, basePrice, description, imageUrl, isAvailable } = body;

    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required.' }, { status: 400 });
    }

    // Construct dynamic update fields
    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (basePrice !== undefined) dataToUpdate.basePrice = Number(basePrice);
    if (description !== undefined) dataToUpdate.description = description;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl || null;
    if (isAvailable !== undefined) dataToUpdate.isAvailable = Boolean(isAvailable);

    const updatedItem = await db.menuItem.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      ...updatedItem,
      basePrice: Number(updatedItem.basePrice),
    });
  } catch (error: any) {
    console.error('Update menu item error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE menu item (Soft delete by setting isActive to false)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required.' }, { status: 400 });
    }

    // Soft delete to preserve historical order items analytics
    await db.menuItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Menu item successfully deleted.' });
  } catch (error: any) {
    console.error('Delete menu item error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
