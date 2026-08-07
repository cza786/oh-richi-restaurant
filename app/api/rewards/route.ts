import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const rewards = await db.reward.findMany({
      where: { isActive: true },
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
    console.error('Fetch rewards catalog error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
