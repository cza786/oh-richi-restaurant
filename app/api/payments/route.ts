import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const restaurantId = new URL(request.url).searchParams.get('restaurantId');
    const payments = await db.payment.findMany({
      where: restaurantId ? { order: { restaurantId } } : undefined,
      include: { order: { include: { customer: { select: { name: true } }, restaurant: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(payments.map((payment) => ({
      id: payment.id,
      orderId: payment.order.orderNumber,
      method: payment.method,
      amount: Number(payment.amount),
      status: payment.status,
      transactionId: payment.transactionId,
      paidBy: payment.order.customer.name,
      restaurant: payment.order.restaurant.name,
      time: payment.createdAt,
    })));
  } catch (error) {
    console.error('Fetch payments error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
