import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateTokenPair, setAuthCookies, AuthenticatedUser } from '@/lib/auth';

/**
 * POST /api/auth/customer/verify-otp
 * Verifies 4-digit OTP code, upserts customer user with role 'customer', and issues JWT authentication.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    // Security check: validate inputs
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and 4-digit OTP code are required.' },
        { status: 400 }
      );
    }

    const sanitizedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
    const sanitizedCode = code.toString().trim();

    // Look up active, unverified OTP record
    const otpRecord = await db.otpToken.findFirst({
      where: {
        phone: sanitizedPhone,
        isVerified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP code has expired or was not requested. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify 4-digit OTP code matching
    if (otpRecord.code !== sanitizedCode) {
      return NextResponse.json(
        { error: 'Invalid 4-digit OTP code.' },
        { status: 400 }
      );
    }

    // Mark OTP token as verified
    await db.otpToken.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    // Check if customer user account exists by phone
    let user = await db.user.findUnique({
      where: { phone: sanitizedPhone },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    // If new user, register automatically with default role 'customer'
    if (!user) {
      // Find or get CUSTOMER role id
      let customerRole = await db.role.findFirst({
        where: { name: { in: ['CUSTOMER', 'customer'] } },
      });

      if (!customerRole) {
        customerRole = await db.role.create({
          data: {
            name: 'CUSTOMER',
            description: 'Registered customers who place orders online.',
          },
        });
      }

      user = await db.user.create({
        data: {
          phone: sanitizedPhone,
          role: 'customer', // Default role assigned upon creation
          isActive: true,
          userRoles: {
            create: {
              roleId: customerRole.id,
            },
          },
        },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Build user context
    const userContext: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'customer',
      roles: user.userRoles.map((ur) => ur.role.name),
    };

    // Issue JWT Access Token & Refresh Token pair
    const tokenPair = await generateTokenPair(userContext);

    // Create JSON response and set HTTP-Only cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: userContext.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken: tokenPair.accessToken,
    });

    return setAuthCookies(response, tokenPair.accessToken, tokenPair.refreshToken);
  } catch (error: any) {
    console.error('Error in verify-otp API:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP code. Please try again.' },
      { status: 500 }
    );
  }
}
