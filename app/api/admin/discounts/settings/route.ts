import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateDiscountSettings } from '@/lib/discountService';

// GET global discount settings
export async function GET() {
  try {
    const settings = await db.discountSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Discount settings not found.' }, { status: 404 });
    }

    const formatted = {
      ...settings,
      maxTotalDiscountPercentage: Number(settings.maxTotalDiscountPercentage),
      requireApprovalThresholdAmount: Number(settings.requireApprovalThresholdAmount),
      requireApprovalThresholdPercent: Number(settings.requireApprovalThresholdPercent),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch discount settings error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT modify global settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateDiscountSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Update discount settings error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
