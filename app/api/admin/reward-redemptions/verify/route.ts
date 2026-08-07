import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Verification code or QR token is required.' }, { status: 400 });
    }

    const redemption = await db.rewardRedemption.findFirst({
      where: {
        OR: [
          { redemptionCode: code },
          { qrToken: code },
        ],
      },
      include: {
        reward: true,
        user: true,
      },
    });

    if (!redemption) {
      return NextResponse.json({ isValid: false, error: 'Voucher not found.' });
    }

    if (redemption.status !== 'PENDING' && redemption.status !== 'APPLIED') {
      return NextResponse.json({ 
        isValid: false, 
        error: `Voucher is already in status: ${redemption.status}` 
      });
    }

    return NextResponse.json({
      isValid: true,
      redemption: {
        id: redemption.id,
        code: redemption.redemptionCode,
        status: redemption.status,
        pointsUsed: redemption.pointsUsed,
        rewardName: redemption.reward.name,
        rewardType: redemption.reward.rewardType,
        customerName: `${redemption.user.firstName} ${redemption.user.lastName}`,
      },
    });
  } catch (error: any) {
    console.error('Verify redemption error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
