import { NextResponse } from 'next/server';
import { getDiscountOverview } from '@/lib/discountService';

export async function GET() {
  try {
    const stats = await getDiscountOverview();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Fetch discount overview stats error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
