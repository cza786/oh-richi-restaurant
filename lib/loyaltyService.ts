import db from './db';

/**
 * Calculates reward points earned from a given order based on active loyalty rules.
 */
export async function calculateEarnedPoints(
  orderTotal: number,

  
  orderType: string,
  subtotal: number,
  taxAmount: number,
  discountAmount: number
) {
  // Retrieve the active loyalty rule
  const rule = await db.loyaltyRule.findFirst({
    where: { isActive: true },
  });

  if (!rule) {
    return 0; // No rule configured
  }

  // Check if earning is allowed for the order type
  if (orderType === 'DINE_IN' && !rule.earnOnDineIn) return 0;
  if (orderType === 'TAKEAWAY' && !rule.earnOnTakeAway) return 0;
  if (orderType === 'DELIVERY' && !rule.earnOnDelivery) return 0;

  // Verify minimum order amount required to earn points
  const minRequired = Number(rule.minimumOrderAmount);
  if (orderTotal < minRequired) {
    return 0;
  }

  // Points base calculation (default rule: €1 spent = 1 point)
  // Let's default to subtotal minus discount as base unless configured otherwise
  const baseAmount = Math.max(0, subtotal - discountAmount);
  
  let points = Math.floor(baseAmount * Number(rule.pointsPerEuro));

  // Cap points per order if set
  if (rule.maximumPointsPerOrder && points > rule.maximumPointsPerOrder) {
    points = rule.maximumPointsPerOrder;
  }

  return points;
}

/**
 * Awards earned points to the customer's loyalty account upon order completion.
 */
export async function awardPointsForOrder(orderId: string) {
  try {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { customer: true },
      });

      if (!order || !order.customerId) {
        return { success: false, reason: 'Guest order or invalid order ID' };
      }

      // Check if order is completed and paid
      if (order.status !== 'COMPLETED' || order.paymentStatus !== 'PAID') {
        return { success: false, reason: 'Order is not completed and paid' };
      }

      // Check if points were already awarded
      if (order.pointsEarned && order.pointsEarned > 0) {
        return { success: false, reason: 'Points already awarded' };
      }

      const points = await calculateEarnedPoints(
        Number(order.totalAmount),
        order.orderType,
        Number(order.subtotal),
        Number(order.taxAmount),
        Number(order.discountAmount)
      );

      if (points <= 0) {
        return { success: true, points: 0, reason: 'Zero points calculated' };
      }

      // Get or create loyalty account
      let account = await tx.loyaltyAccount.findUnique({
        where: { userId: order.customerId },
      });

      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: {
            userId: order.customerId,
            currentPoints: 0,
            lifetimeEarnedPoints: 0,
          },
        });
      }

      const newBalance = account.currentPoints + points;

      // Update loyalty account totals
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          currentPoints: newBalance,
          lifetimeEarnedPoints: account.lifetimeEarnedPoints + points,
        },
      });

      // Create log transaction
      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          userId: order.customerId,
          orderId: order.id,
          type: 'EARNED',
          points: points,
          balanceAfter: newBalance,
          description: `Earned from Order #${order.shortId}`,
        },
      });

      // Update Order model with points awarded
      await tx.order.update({
        where: { id: order.id },
        data: { pointsEarned: points },
      });

      return { success: true, points };
    });
  } catch (err: any) {
    console.error('Error awarding points:', err);
    throw err;
  }
}

/**
 * Redeems points for a specific reward.
 */
export async function redeemReward(userId: string, rewardId: string) {
  try {
    return await db.$transaction(async (tx) => {
      const reward = await tx.reward.findUnique({
        where: { id: rewardId },
      });

      if (!reward || !reward.isActive) {
        throw new Error('Reward is not active or invalid');
      }

      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account || account.currentPoints < reward.requiredPoints) {
        throw new Error('Insufficient points balance');
      }

      const voucherCode = `RWD-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrToken = `QR-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

      // Deduct points
      const newBalance = account.currentPoints - reward.requiredPoints;
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          currentPoints: newBalance,
          lifetimeRedeemedPoints: account.lifetimeRedeemedPoints + reward.requiredPoints,
        },
      });

      // Create redemption voucher record
      const redemption = await tx.rewardRedemption.create({
        data: {
          rewardId: reward.id,
          userId,
          redemptionCode: voucherCode,
          qrToken,
          pointsUsed: reward.requiredPoints,
          status: 'PENDING',
        },
      });

      // Log transaction
      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          userId,
          redemptionId: redemption.id,
          type: 'REDEEMED',
          points: -reward.requiredPoints,
          balanceAfter: newBalance,
          description: `Redeemed Reward: ${reward.name}`,
        },
      });

      return redemption;
    });
  } catch (err: any) {
    console.error('Error redeeming reward:', err);
    throw err;
  }
}

/**
 * Applies a redeemed reward to a pending checkout order.
 */
export async function applyRewardToOrder(orderId: string, redemptionCode: string) {
  try {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const redemption = await tx.rewardRedemption.findUnique({
        where: { redemptionCode },
        include: { reward: true },
      });

      if (!redemption || redemption.status !== 'PENDING') {
        throw new Error('Reward voucher is invalid or already used');
      }

      // Check if order meets min spend criteria
      if (redemption.reward.minimumOrderAmount && Number(order.subtotal) < Number(redemption.reward.minimumOrderAmount)) {
        throw new Error(`Order subtotal must be at least €${redemption.reward.minimumOrderAmount} to apply this reward`);
      }

      // Determine discount benefit
      let discount = 0;
      if (redemption.reward.rewardType === 'FIXED_DISCOUNT') {
        discount = Number(redemption.reward.discountAmount || 0);
      } else if (redemption.reward.rewardType === 'FREE_ITEM') {
        // Find if item is in the cart and discount its price, or set flat discount value
        discount = Number(redemption.reward.discountAmount || 8.00); // default mock free item discount value
      }

      const subtotalVal = Number(order.subtotal);
      const taxVal = Number(order.taxAmount);
      const deliveryVal = Number(order.deliveryFee);

      const finalDiscount = Math.min(subtotalVal, discount);
      const newTotal = Math.max(0, subtotalVal + taxVal + deliveryVal - finalDiscount);

      // Update Order record
      await tx.order.update({
        where: { id: order.id },
        data: {
          rewardRedemptionId: redemption.id,
          rewardDiscountAmount: finalDiscount,
          discountAmount: finalDiscount,
          totalAmount: newTotal,
          pointsRedeemed: redemption.pointsUsed,
        },
      });

      // Update Redemption status
      await tx.rewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
        },
      });

      return { success: true, discountApplied: finalDiscount };
    });
  } catch (err: any) {
    console.error('Error applying reward:', err);
    throw err;
  }
}

/**
 * Reverses awarded points if an order gets refunded or cancelled.
 */
export async function reversePointsForRefund(orderId: string) {
  try {
    return await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order || !order.customerId) return { success: false };

      // Reverse points earned
      if (order.pointsEarned && order.pointsEarned > 0) {
        const account = await tx.loyaltyAccount.findUnique({
          where: { userId: order.customerId },
        });

        if (account) {
          const newPoints = Math.max(0, account.currentPoints - order.pointsEarned);
          await tx.loyaltyAccount.update({
            where: { id: account.id },
            data: { currentPoints: newPoints },
          });

          await tx.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: account.id,
              userId: order.customerId,
              orderId: order.id,
              type: 'REVERSED',
              points: -order.pointsEarned,
              balanceAfter: newPoints,
              description: `Reversed points due to refund/cancellation of Order #${order.shortId}`,
            },
          });
        }
      }

      // Return redeemed points if used
      if (order.rewardRedemptionId) {
        const redemption = await tx.rewardRedemption.findUnique({
          where: { id: order.rewardRedemptionId },
        });

        if (redemption && redemption.status === 'APPLIED') {
          const account = await tx.loyaltyAccount.findUnique({
            where: { userId: order.customerId },
          });

          if (account) {
            const newPoints = account.currentPoints + redemption.pointsUsed;
            await tx.loyaltyAccount.update({
              where: { id: account.id },
              data: { currentPoints: newPoints },
            });

            await tx.loyaltyTransaction.create({
              data: {
                loyaltyAccountId: account.id,
                userId: order.customerId,
                redemptionId: redemption.id,
                type: 'RETURNED',
                points: redemption.pointsUsed,
                balanceAfter: newPoints,
                description: `Returned redeemed points due to cancellation of Order #${order.shortId}`,
              },
            });

            await tx.rewardRedemption.update({
              where: { id: redemption.id },
              data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
              },
            });
          }
        }
      }

      return { success: true };
    });
  } catch (err: any) {
    console.error('Error reversing points:', err);
    throw err;
  }
}

/**
 * Manually adjusts customer points balance (Admin action).
 */
export async function adminAdjustPoints(userId: string, points: number, reason: string, createdBy: string) {
  try {
    return await db.$transaction(async (tx) => {
      let account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: {
            userId,
            currentPoints: 0,
            lifetimeEarnedPoints: 0,
          },
        });
      }

      const newBalance = Math.max(0, account.currentPoints + points);

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          currentPoints: newBalance,
          lifetimeEarnedPoints: points > 0 ? account.lifetimeEarnedPoints + points : account.lifetimeEarnedPoints,
          lifetimeRedeemedPoints: points < 0 ? account.lifetimeRedeemedPoints + Math.abs(points) : account.lifetimeRedeemedPoints,
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          userId,
          type: 'ADMIN_ADJUSTMENT',
          points,
          balanceAfter: newBalance,
          description: reason,
          createdBy,
        },
      });

      return { success: true, newBalance };
    });
  } catch (err: any) {
    console.error('Error adjusting points:', err);
    throw err;
  }
}

/**
 * Checks for expired points and deducts them (Points Expiry cron action).
 */
export async function expireOldPoints() {
  // Logic to calculate points that have exceeded X days threshold (can be scheduled)
  // For MVP, we provide a placeholder resolver
  return { expired: 0 };
}
