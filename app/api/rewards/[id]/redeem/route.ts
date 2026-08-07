import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { redeemReward } from '@/lib/loyaltyService';

const JWT_SECRET = process.env.JWT_SECRET || 'oh_richi_fallback_secret_123';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    const redemption = await redeemReward(decoded.userId, id);
    return NextResponse.json({ success: true, redemption });
  } catch (error: any) {
    console.error('Redeem reward error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 400 });
  }
}
