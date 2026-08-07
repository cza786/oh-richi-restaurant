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

    const formatted = {
      ...reward,
      discountAmount: reward.discountAmount ? Number(reward.discountAmount) : null,
      discountPercentage: reward.discountPercentage ? Number(reward.discountPercentage) : null,
      minimumOrderAmount: reward.minimumOrderAmount ? Number(reward.minimumOrderAmount) : null,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch reward detail error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
