import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { adminAdjustPoints } from '@/lib/loyaltyService';

// GET customer loyalty profile details and transaction logs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find customer profile
    const customer = await db.user.findUnique({
      where: { id },
      include: {
        loyaltyAccount: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const transactions = await db.loyaltyTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
      },
      account: customer.loyaltyAccount || {
        currentPoints: 0,
        lifetimeEarnedPoints: 0,
        lifetimeRedeemedPoints: 0,
        lifetimeExpiredPoints: 0,
      },
      history: transactions,
    });
  } catch (error: any) {
    console.error('Fetch customer loyalty error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST adjust points balance manually
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { points, reason } = await request.json();

    if (!points || !reason) {
      return NextResponse.json({ error: 'Points value and reason are required.' }, { status: 400 });
    }

    const result = await adminAdjustPoints(
      id,
      parseInt(points),
      reason,
      'ADMIN_DASHBOARD'
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Adjust points error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
