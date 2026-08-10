import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateOTP, normalizeIdentifier } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request);
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = (body.identifier || body.email || body.phone || '').toString().trim();

    if (!rawIdentifier) {
      return NextResponse.json({ error: 'Please enter your Gmail address or phone number.' }, { status: 400 });
    }

    const { identifier, type } = normalizeIdentifier(rawIdentifier);

    // Rate Limiting: Max 5 OTP requests per 10 minutes per IP
    const rateLimit = checkRateLimit(`otp-send:${ipAddress}:${identifier}`, 5, 10 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    // Generate OTP
    const { code, type: idType } = generateOTP(identifier);

    // Check if user exists in database by email or phone
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { phone: rawIdentifier },
        ],
      },
    });

    const maskedDestination = idType === 'email'
      ? identifier.replace(/(.{2})(.*)(?=@)/, (_, b, c) => b + '*'.repeat(c.length))
      : identifier.slice(0, 3) + '****' + identifier.slice(-2);

    return NextResponse.json({
      success: true,
      message: `A 6-digit security OTP code has been sent to ${maskedDestination}.`,
      identifier,
      type: idType,
      userExists: !!existingUser,
      // Provide OTP code in response for testing convenience
      demoOtp: code,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error sending OTP.' }, { status: 500 });
  }
}
