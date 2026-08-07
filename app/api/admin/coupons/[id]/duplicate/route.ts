import { NextResponse } from 'next/server';
import { duplicateCoupon } from '@/lib/discountService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cloned = await duplicateCoupon(id);
    return NextResponse.json({ success: true, coupon: cloned });
  } catch (error: any) {
    console.error('Duplicate coupon error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
