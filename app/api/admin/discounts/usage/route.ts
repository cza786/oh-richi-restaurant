import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const usages = await db.orderDiscount.findMany({
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = usages.map(u => ({
      id: u.id,
      orderNumber: u.order.shortId,
      customerName: u.order.customerName || 'Guest Customer',
      discountSource: u.discountSource,
      codeOrPromoName: u.name,
      discountType: u.discountType,
      discountAmount: Number(u.discountAmount),
      orderType: u.order.orderType,
      orderTotalBefore: Number(u.order.subtotal) + Number(u.order.taxAmount) + Number(u.order.deliveryFee),
      orderTotalAfter: Number(u.order.totalAmount),
      usedDate: u.createdAt.toLocaleString(),
      status: u.order.status === 'COMPLETED' ? 'used' : u.order.status === 'CANCELLED' ? 'cancelled' : 'applied',
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch discount usages error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
