import { NextResponse } from 'next/server';
import { getDiscountReports } from '@/lib/discountService';

export async function GET() {
  try {
    const reports = await getDiscountReports();
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Fetch discount reports error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
