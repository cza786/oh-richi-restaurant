import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const promotions = await db.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        priority: 'desc',
      },
    });

    const formatted = promotions.map((p) => ({
      ...p,
      discountValue: Number(p.discountValue),
      maxDiscountAmount: p.maxDiscountAmount ? Number(p.maxDiscountAmount) : null,
      minimumOrderAmount: Number(p.minimumOrderAmount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch active promotions error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
