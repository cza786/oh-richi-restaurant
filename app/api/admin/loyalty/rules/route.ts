import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET active loyalty configuration rule
export async function GET() {
  try {
    const rule = await db.loyaltyRule.findFirst({
      where: { isActive: true },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Loyalty rules not found.' }, { status: 404 });
    }

    const formatted = {
      ...rule,
      pointsPerEuro: Number(rule.pointsPerEuro),
      minimumOrderAmount: Number(rule.minimumOrderAmount),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch loyalty rules error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT modify loyalty rules
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      pointsPerEuro,
      minimumOrderAmount,
      maximumPointsPerOrder,
      pointsActivationMode,
      pendingActivationHours,
      expiryEnabled,
      expiryDays,
      earnOnDineIn,
      earnOnTakeAway,
      earnOnDelivery,
    } = body;

    const updated = await db.loyaltyRule.update({
      where: { id },
      data: {
        pointsPerEuro,
        minimumOrderAmount,
        maximumPointsPerOrder: maximumPointsPerOrder ? parseInt(maximumPointsPerOrder) : null,
        pointsActivationMode,
        pendingActivationHours: parseInt(pendingActivationHours) || 0,
        expiryEnabled: Boolean(expiryEnabled),
        expiryDays: expiryDays ? parseInt(expiryDays) : null,
        earnOnDineIn: Boolean(earnOnDineIn),
        earnOnTakeAway: Boolean(earnOnTakeAway),
        earnOnDelivery: Boolean(earnOnDelivery),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update loyalty rules error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
