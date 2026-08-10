import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET general store profile configurations
export async function GET() {
  try {
    const restaurant = await db.restaurant.findFirst({
      include: {
        locations: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant entity not seeded.' }, { status: 404 });
    }

    const location = restaurant.locations[0] || null;

    // Send a structured configuration response
    return NextResponse.json({
      id: restaurant.id,
      name: restaurant.name,
      logoUrl: restaurant.logoUrl || '',
      website: restaurant.website || '',
      phone: location?.phone || '',
      email: location?.email || '',
      address: location ? `${location.addressLine1}, ${location.city}, ${location.country}` : '',
      currency: 'EUR',
      vat: 10.0,
      autoAccept: true,
      locationId: location?.id || '',
    });
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT modify settings metadata profiles
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, logoUrl, phone, email, address, locationId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required.' }, { status: 400 });
    }

    // Update restaurant info
    const updatedRestaurant = await db.restaurant.update({
      where: { id },
      data: {
        name: name,
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    // Update location details if linked
    if (locationId) {
      const parts = (address || '').split(',');
      const addressLine1 = parts[0]?.trim() || '123 Via Roma';
      const city = parts[1]?.trim() || 'Rome';
      const country = parts[2]?.trim() || 'Italy';

      await db.restaurantLocation.update({
        where: { id: locationId },
        data: {
          phone: phone,
          email: email,
          addressLine1,
          city,
          country,
        },
      });
    }

    return NextResponse.json({ success: true, restaurant: updatedRestaurant });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
