import { NextResponse } from 'next/server';
import { applyRewardToOrder } from '@/lib/loyaltyService';

export async function POST(request: Request) {
  try {
    const { orderId, redemptionCode } = await request.json();

    if (!orderId || !redemptionCode) {
      return NextResponse.json({ error: 'Order ID and redemption code are required.' }, { status: 400 });
    }

    const result = await applyRewardToOrder(orderId, redemptionCode);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Apply reward error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
