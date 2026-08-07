import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET delivery settings & zones
export async function GET() {
  try {
    const settings = await db.deliverySettings.findFirst();
    const zones = await db.deliveryZone.findMany({
      orderBy: { name: 'asc' },
    });

    // Format Decimal fields to numbers
    const formattedSettings = settings ? {
      ...settings,
      minimumOrderAmount: Number(settings.minimumOrderAmount),
      baseDeliveryFee: Number(settings.baseDeliveryFee),
      feePerKm: Number(settings.feePerKm),
      freeDeliveryOver: settings.freeDeliveryOver ? Number(settings.freeDeliveryOver) : null,
    } : null;

    const formattedZones = zones.map(z => ({
      ...z,
      deliveryFee: Number(z.deliveryFee),
      minimumOrder: Number(z.minimumOrder),
    }));

    return NextResponse.json({
      settings: formattedSettings,
      zones: formattedZones,
    });
  } catch (error: any) {
    console.error('Fetch delivery info error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT modify delivery settings or zone exclusions
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, settingsId, deliveryRadius, minimumOrderAmount, baseDeliveryFee, feePerKm, freeDeliveryOver, zoneId, zoneName, city, postalCode, zoneMinOrder, fixedFee } = body;

    // Check if modifying general settings
    if (action === 'update_settings') {
      if (!settingsId) {
        return NextResponse.json({ error: 'Settings ID is required.' }, { status: 400 });
      }

      const updated = await db.deliverySettings.update({
        where: { id: settingsId },
        data: {
          deliveryRadius: Number(deliveryRadius),
          minimumOrderAmount: Number(minimumOrderAmount),
          baseDeliveryFee: Number(baseDeliveryFee),
          feePerKm: Number(feePerKm),
          freeDeliveryOver: freeOverVal(freeDeliveryOver),
        },
      });

      return NextResponse.json({ success: true, settings: updated });
    }

    // Check if adding/modifying zone exceptions
    if (action === 'create_zone') {
      const location = await db.restaurantLocation.findFirst();
      if (!location) {
        return NextResponse.json({ error: 'No restaurant locations exist.' }, { status: 400 });
      }

      const newZone = await db.deliveryZone.create({
        data: {
          locationId: location.id,
          name: zoneName || 'New Exception Zone',
          postalCode: postalCode || '',
          deliveryFee: Number(fixedFee) || 0,
          minimumOrder: Number(zoneMinOrder) || 0,
        },
      });

      return NextResponse.json({ success: true, zone: newZone });
    }

    if (action === 'delete_zone') {
      if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required.' }, { status: 400 });
      }

      await db.deliveryZone.delete({
        where: { id: zoneId },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid operation action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Update delivery settings error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// Helper to convert free delivery option
function freeOverVal(val: any) {
  if (val === undefined || val === null || val === '') return null;
  return Number(val);
}
