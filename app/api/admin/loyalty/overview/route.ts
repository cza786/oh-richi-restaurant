import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const totalCustomers = await db.loyaltyAccount.count();

    const transactions = await db.loyaltyTransaction.findMany();
    
    let totalIssued = 0;
    let totalRedeemed = 0;
    
    transactions.forEach(t => {
      if (t.points > 0) {
        totalIssued += t.points;
      } else {
        totalRedeemed += Math.abs(t.points);
      }
    });

    const activeRewards = await db.reward.count({
      where: { isActive: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const redemptionsThisMonth = await db.rewardRedemption.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Top redeemed reward query
    const redemptions = await db.rewardRedemption.findMany({
      include: { reward: true },
    });

    const rewardCounts: Record<string, number> = {};
    redemptions.forEach(r => {
      rewardCounts[r.reward.name] = (rewardCounts[r.reward.name] || 0) + 1;
    });

    let topReward = 'None';
    let maxRedemptions = 0;
    Object.entries(rewardCounts).forEach(([name, count]) => {
      if (count > maxRedemptions) {
        maxRedemptions = count;
        topReward = name;
      }
    });

    return NextResponse.json({
      totalCustomers,
      totalIssued,
      totalRedeemed,
      activeRewards,
      redemptionsThisMonth,
      topReward,
    });
  } catch (error: any) {
    console.error('Fetch loyalty overview error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
