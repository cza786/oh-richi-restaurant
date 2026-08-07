import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reward = await db.reward.findUnique({
      where: { id },
    });

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found.' }, { status: 404 });
    }

    return NextResponse.json(reward);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updated = await db.reward.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        requiredPoints: parseInt(body.requiredPoints),
        rewardType: body.rewardType,
        menuItemId: body.menuItemId || null,
        discountAmount: body.discountAmount ? parseFloat(body.discountAmount) : null,
        dineInAllowed: Boolean(body.dineInAllowed),
        takeAwayAllowed: Boolean(body.takeAwayAllowed),
        deliveryAllowed: Boolean(body.deliveryAllowed),
        totalUsageLimit: body.totalUsageLimit ? parseInt(body.totalUsageLimit) : null,
        minimumOrderAmount: body.minimumOrderAmount ? parseFloat(body.minimumOrderAmount) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.reward.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
