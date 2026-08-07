import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    let account = await db.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    if (!account) {
      account = await db.loyaltyAccount.create({
        data: {
          userId: user.id,
          currentPoints: 0,
          lifetimeEarnedPoints: 0,
        },
      });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    console.error('Fetch loyalty/me error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
