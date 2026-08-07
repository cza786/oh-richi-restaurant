import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'oh_richi_fallback_secret_123';

export async function POST(request: Request) {
  try {
    const { redemptionId } = await request.json();

    if (!redemptionId) {
      return NextResponse.json({ error: 'Redemption ID is required.' }, { status: 400 });
    }
    
    const cookiesHeader = request.headers.get('cookie') || '';
    const token = cookiesHeader
      .split('; ')
      .find((row) => row.startsWith('session_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    // Verify user and fetch their roles to check if they are a staff member
    const currentUser = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'User account is inactive or not found.' }, { status: 401 });
    }

    const rolesList = currentUser.userRoles.map((ur) => ur.role.name);
    const isStaff = rolesList.some((r) => ['ADMIN', 'OWNER', 'MANAGER', 'CASHIER'].includes(r));

    const result = await db.$transaction(async (tx) => {
      const redemption = await tx.rewardRedemption.findUnique({
        where: { id: redemptionId },
      });

      if (!redemption) {
        throw new Error('Redemption voucher not found');
      }

      // Allow if user is the customer who owns the redemption OR is a staff member
      if (redemption.userId !== decoded.userId && !isStaff) {
        throw new Error('You do not have permission to cancel this redemption voucher');
      }

      if (redemption.status === 'USED' || redemption.status === 'CANCELLED') {
        throw new Error('Voucher is already used or cancelled');
      }

      const account = await tx.loyaltyAccount.findUnique({
        where: { userId: redemption.userId },
      });

      if (account) {
        const newBalance = account.currentPoints + redemption.pointsUsed;
        await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: { currentPoints: newBalance },
        });

        await tx.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            userId: redemption.userId,
            redemptionId: redemption.id,
            type: 'RETURNED',
            points: redemption.pointsUsed,
            balanceAfter: newBalance,
            description: `Returned points from cancelled redemption: ${redemption.redemptionCode}`,
          },
        });
      }

      // If applied to an order, clear the order fields
      const order = await tx.order.findFirst({
        where: { rewardRedemptionId: redemption.id },
      });
      if (order) {
        const subtotalVal = Number(order.subtotal);
        const taxVal = Number(order.taxAmount);
        const deliveryVal = Number(order.deliveryFee);
        await tx.order.update({
          where: { id: order.id },
          data: {
            rewardRedemptionId: null,
            rewardDiscountAmount: 0,
            discountAmount: 0,
            totalAmount: subtotalVal + taxVal + deliveryVal,
            pointsRedeemed: 0,
          },
        });
      }

      const updated = await tx.rewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, redemption: result });
  } catch (error: any) {
    console.error('Cancel redemption error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
