import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { updatePromotion, deletePromotion } from '@/lib/discountService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promo = await db.promotion.findUnique({
      where: { id },
    });

    if (!promo) {
      return NextResponse.json({ error: 'Promotion not found.' }, { status: 404 });
    }

    const formatted = {
      ...promo,
      discountValue: Number(promo.discountValue),
      maxDiscountAmount: promo.maxDiscountAmount ? Number(promo.maxDiscountAmount) : null,
      minimumOrderAmount: Number(promo.minimumOrderAmount),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch promotion ID error:', error);
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
    const updated = await updatePromotion(id, body);
    return NextResponse.json({ success: true, promotion: updated });
  } catch (error: any) {
    console.error('Update promotion error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deletePromotion(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete promotion error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
