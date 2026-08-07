import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

// GET all rewards in catalog
export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const rewards = await db.reward.findMany({
      orderBy: { requiredPoints: 'asc' },
    });

    const formatted = rewards.map(r => ({
      ...r,
      discountAmount: r.discountAmount ? Number(r.discountAmount) : null,
      discountPercentage: r.discountPercentage ? Number(r.discountPercentage) : null,
      minimumOrderAmount: r.minimumOrderAmount ? Number(r.minimumOrderAmount) : null,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch admin rewards error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create new reward
export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      name,
      description,
      imageUrl,
      requiredPoints,
      rewardType,
      menuItemId,
      discountAmount,
      dineInAllowed,
      takeAwayAllowed,
      deliveryAllowed,
      totalUsageLimit,
      minimumOrderAmount,
    } = body;

    const restaurant = await db.restaurant.findFirst();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant entity not seeded.' }, { status: 400 });
    }

    const reward = await db.reward.create({
      data: {
        restaurantId: restaurant.id,
        name,
        description,
        imageUrl,
        requiredPoints: parseInt(requiredPoints),
        rewardType,
        menuItemId: menuItemId || null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        dineInAllowed: Boolean(dineInAllowed),
        takeAwayAllowed: Boolean(takeAwayAllowed),
        deliveryAllowed: Boolean(deliveryAllowed),
        totalUsageLimit: totalUsageLimit ? parseInt(totalUsageLimit) : null,
        minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
        isActive: true,
      },
    });

    return NextResponse.json(reward);
  } catch (error: any) {
    console.error('Create reward error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
