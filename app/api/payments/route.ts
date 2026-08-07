import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all payments transaction ledger (Pure read query)
export async function GET() {
  try {
    const payments = await db.payment.findMany({
      include: {
        order: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format Decimal values for frontend
    const formatted = payments.map(p => ({
      id: p.id,
      orderId: p.order?.shortId || 'OR-MOCK',
      method: p.paymentMethod,
      amount: Number(p.amount),
      status: p.status === 'SUCCESSFUL' ? 'paid' : 'pending',
      paidBy: p.order?.customerName || 'Walk-in Customer',
      time: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch payments error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
