import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { generateTokenPair, setAuthCookies } from '@/lib/auth';
import { normalizeIdentifier, verifyOTP } from '@/lib/otp';
import { getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const body = await request.json().catch(() => ({}));
    
    const rawIdentifier = (body.identifier || body.email || body.phone || '').toString().trim();
    const otpCode = (body.otpCode || body.code || '').toString().trim();
    const firstName = (body.firstName || 'Customer').toString().trim();
    const lastName = (body.lastName || 'User').toString().trim();

    if (!rawIdentifier || !otpCode) {
      return NextResponse.json({ error: 'Identifier and 6-digit OTP code are required.' }, { status: 400 });
    }

    const { identifier, type } = normalizeIdentifier(rawIdentifier);

    // Verify OTP code
    const otpResult = verifyOTP(identifier, otpCode);
    if (!otpResult.valid) {
      return NextResponse.json({ error: otpResult.error || 'Invalid OTP code.' }, { status: 400 });
    }

    // OTP verified successfully - Find or create user
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { phone: rawIdentifier },
        ],
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // If user does not exist, auto-register customer account via OTP
    if (!user) {
      // Find or ensure CUSTOMER role exists
      let customerRole = await db.role.findUnique({ where: { name: 'CUSTOMER' } });
      if (!customerRole) {
        customerRole = await db.role.create({
          data: { name: 'CUSTOMER', description: 'Customer role' },
        });
      }

      const generatedPasswordHash = await bcrypt.hash(`OtpUser_${Date.now()}_${Math.random()}`, 10);
      const userEmail = type === 'email' ? identifier : `user_${identifier.replace(/[^0-9]/g, '')}@ohrichi.local`;
      const userPhone = type === 'phone' ? identifier : null;

      user = await db.user.create({
        data: {
          email: userEmail,
          passwordHash: generatedPasswordHash,
          firstName,
          lastName,
          phone: userPhone,
          isActive: true,
          userRoles: {
            create: {
              roleId: customerRole.id,
            },
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Create loyalty account for new customer
      await db.loyaltyAccount.create({
        data: {
          userId: user.id,
          currentPoints: 50, // 50 welcome points!
          lifetimeEarnedPoints: 50,
        },
      }).catch(() => undefined);
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been deactivated. Please contact support.' }, { status: 403 });
    }

    const rolesList = user.userRoles.map((ur) => ur.role.name);

    const authenticatedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: rolesList,
    };

    const tokenPair = await generateTokenPair(authenticatedUser, { userAgent, ipAddress });

    const response = NextResponse.json({
      message: 'OTP verified successfully. Logged in!',
      user: {
        ...authenticatedUser,
        phone: user.phone,
      },
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    });

    setAuthCookies(response, tokenPair.accessToken, tokenPair.refreshToken);

    return response;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error verifying OTP.' }, { status: 500 });
  }
}
