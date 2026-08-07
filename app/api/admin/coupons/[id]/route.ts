import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateCoupon, deleteCoupon } from '@/lib/discountService';
import { requireRole } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const coupon = await db.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const formatted = {
      ...coupon,
      discountValue: Number(coupon.discountValue),
      maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
      minimumOrderAmount: Number(coupon.minimumOrderAmount),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch coupon ID error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const updated = await updateCoupon(id, body);
    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: any) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['ADMIN', 'STAFF']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    await deleteCoupon(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
