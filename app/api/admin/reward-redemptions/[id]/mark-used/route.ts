import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { orderId } = await request.json();

    const updated = await db.$transaction(async (tx) => {
      const red = await tx.rewardRedemption.update({
        where: { id },
        data: {
          status: 'USED',
          usedAt: new Date(),
        },
      });

      if (orderId) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            rewardRedemptionId: id,
          },
        });
      }

      return red;
    });

    // Write status change log
    await db.rewardRedemptionLog.create({
      data: {
        redemptionId: id,
        oldStatus: 'APPLIED',
        newStatus: 'USED',
        changedBy: 'CASHIER',
        note: `Voucher marked as completed/used for order.`,
      },
    });

    return NextResponse.json({ success: true, redemption: updated });
  } catch (error: any) {
    console.error('Mark redemption used error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
