import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * POST /api/auth/customer/send-otp
 * Generates a 4-digit OTP for customer phone verification and saves it to the otp_tokens table.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Security check: validate phone presence
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Valid phone number is required.' },
        { status: 400 }
      );
    }

    // Sanitize phone number (strip whitespace and formatting)
    const sanitizedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');

    if (sanitizedPhone.length < 7) {
      return NextResponse.json(
        { error: 'Invalid phone number format.' },
        { status: 400 }
      );
    }

    // Generate secure 4-digit numeric OTP code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Set 10-minute expiration window
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP token in PostgreSQL database via Prisma
    await db.otpToken.create({
      data: {
        phone: sanitizedPhone,
        code,
        expiresAt,
        isVerified: false,
      },
    });

    // Send SMS via Twilio/SMS Provider in production (simulated here)
    console.log(`[SMS OTP DEBUG] Sent 4-digit code ${code} to ${sanitizedPhone}`);

    return NextResponse.json({
      success: true,
      message: `OTP code sent to ${sanitizedPhone}.`,
      expiresAt: expiresAt.toISOString(),
      // Include demoOtp in non-production environments for automated testing/UI review
      demoOtp: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (error: any) {
    console.error('Error in send-otp API:', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP code. Please try again.' },
      { status: 500 }
    );
  }
}
