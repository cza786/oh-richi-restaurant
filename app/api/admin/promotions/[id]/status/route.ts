import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const updated = await db.promotion.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    return NextResponse.json({ success: true, promotion: updated });
  } catch (error: any) {
    console.error('Toggle promotion status error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
