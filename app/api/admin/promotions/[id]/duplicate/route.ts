import { NextResponse } from 'next/server';
import { duplicatePromotion } from '@/lib/discountService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cloned = await duplicatePromotion(id);
    return NextResponse.json({ success: true, promotion: cloned });
  } catch (error: any) {
    console.error('Duplicate promotion error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
