import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { validateDateRange } from '@/lib/discountService';

// GET all active coupons
export async function GET() {
  try {
    const now = new Date();
    const coupons = await db.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        code: 'asc',
      },
    });

    const formatted = coupons.map((c) => ({
      ...c,
      discountValue: Number(c.discountValue),
      maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
      minimumOrderAmount: Number(c.minimumOrderAmount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch active coupons error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST validate coupon code
export async function POST(request: Request) {
  try {
    const { code, subtotal, customerId } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const now = new Date();

    const coupon = await db.coupon.findUnique({
      where: { code: uppercaseCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'Coupon code is invalid or expired.' }, { status: 400 });
    }

    if (coupon.startDate > now || coupon.endDate < now) {
      return NextResponse.json({ error: 'Coupon code is not currently active.' }, { status: 400 });
    }

    const sub = Number(subtotal || 0);
    const minOrder = Number(coupon.minimumOrderAmount);
    if (sub < minOrder) {
      return NextResponse.json({
        error: `Minimum order amount of €${minOrder.toFixed(2)} is required to use this coupon.`,
      }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    const val = Number(coupon.discountValue);

    if (coupon.discountType === 'percentage_discount') {
      discountAmount = (sub * val) / 100;
      if (coupon.maxDiscountAmount) {
        const maxD = Number(coupon.maxDiscountAmount);
        if (discountAmount > maxD) {
          discountAmount = maxD;
        }
      }
    } else if (coupon.discountType === 'fixed_amount_discount') {
      discountAmount = val;
    } else if (coupon.discountType === 'free_item') {
      discountAmount = val; // value acts as the item price discount
    }

    // Cap discount at subtotal
    if (discountAmount > sub) {
      discountAmount = sub;
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: val,
      discountAmount: Number(discountAmount.toFixed(2)),
      freeMenuItemId: coupon.freeMenuItemId,
    });
  } catch (error: any) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
