import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createPromotion } from '@/lib/discountService';
import { requireRole } from '@/lib/auth';

// GET all promotions
export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const promotions = await db.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = promotions.map(p => ({
      ...p,
      discountValue: Number(p.discountValue),
      maxDiscountAmount: p.maxDiscountAmount ? Number(p.maxDiscountAmount) : null,
      minimumOrderAmount: Number(p.minimumOrderAmount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch promotions error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create promotion
export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const promo = await createPromotion(body);
    return NextResponse.json({ success: true, promotion: promo });
  } catch (error: any) {
    console.error('Create promotion error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
