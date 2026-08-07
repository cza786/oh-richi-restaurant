import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createCoupon } from '@/lib/discountService';
import { requireRole } from '@/lib/auth';

// GET all coupons
export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = coupons.map(c => ({
      ...c,
      discountValue: Number(c.discountValue),
      maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
      minimumOrderAmount: Number(c.minimumOrderAmount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch coupons error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create coupon
export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const coupon = await createCoupon(body);
    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
