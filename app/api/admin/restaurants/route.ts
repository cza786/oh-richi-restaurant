import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

// Helper to sanitize slug
function generateSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// GET all restaurants for Super Admin management
export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER']);
    if (authResult instanceof NextResponse) return authResult;

    const restaurants = await db.restaurant.findMany({
      include: {
        locations: {
          select: { id: true, name: true, city: true, addressLine1: true, phone: true },
        },
        _count: {
          select: {
            menuItems: true,
            menuCategories: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(restaurants);
  } catch (error: any) {
    console.error('Admin fetch restaurants error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create a new restaurant (SUPER_ADMIN only)
export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, slug, description, logoUrl, website, isActive, city, addressLine1 } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Restaurant name is required.' }, { status: 400 });
    }

    const finalSlug = generateSlug(slug || name);
    if (!finalSlug) {
      return NextResponse.json({ error: 'Invalid restaurant slug.' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await db.restaurant.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Restaurant slug "${finalSlug}" is already in use by another restaurant.` },
        { status: 400 }
      );
    }

    // Create Restaurant and initial default location inside a transaction
    const newRestaurant = await db.$transaction(async (tx) => {
      const rest = await tx.restaurant.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          description: description?.trim() || null,
          logoUrl: logoUrl?.trim() || null,
          website: website?.trim() || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      // Create default main branch location
      await tx.restaurantLocation.create({
        data: {
          restaurantId: rest.id,
          name: 'Main Branch',
          addressLine1: addressLine1?.trim() || '123 Main Street',
          city: city?.trim() || 'Central',
          postalCode: '00100',
          country: 'Country',
          isActive: true,
        },
      });

      return rest;
    });

    return NextResponse.json(newRestaurant);
  } catch (error: any) {
    console.error('Admin create restaurant error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT update restaurant (SUPER_ADMIN only)
export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { id, name, slug, description, logoUrl, website, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? logoUrl.trim() : null;
    if (website !== undefined) updateData.website = website ? website.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (slug) {
      const sanitizedSlug = generateSlug(slug);
      const existing = await db.restaurant.findUnique({
        where: { slug: sanitizedSlug },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: `Slug "${sanitizedSlug}" is already taken by another restaurant.` },
          { status: 400 }
        );
      }
      updateData.slug = sanitizedSlug;
    }

    const updatedRestaurant = await db.restaurant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedRestaurant);
  } catch (error: any) {
    console.error('Admin update restaurant error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
