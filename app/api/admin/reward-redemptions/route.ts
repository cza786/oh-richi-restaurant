import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const redemptions = await db.rewardRedemption.findMany({
      include: {
        reward: true,
        user: true,
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = redemptions.map(r => ({
      id: r.id,
      redemptionCode: r.redemptionCode,
      qrToken: r.qrToken,
      pointsUsed: r.pointsUsed,
      status: r.status,
      customerName: `${r.user.firstName} ${r.user.lastName}`,
      customerEmail: r.user.email,
      rewardName: r.reward.name,
      orderNumber: r.order?.shortId || '-',
      createdDate: r.createdAt.toLocaleDateString(),
      usedDate: r.usedAt ? r.usedAt.toLocaleDateString() : '-',
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch reward redemptions error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
