import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { generateTokenPair, setAuthCookies, AuthenticatedUser } from '@/lib/auth';

/**
 * POST /api/auth/admin/login
 * Validates the single Super Admin account used by the MVP management portal.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Security check: validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Look up user account by email in PostgreSQL database
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact administration.' },
        { status: 403 }
      );
    }

    // Security check: Verify password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.role.toUpperCase() !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access forbidden. Only the Super Admin can use this portal.' },
        { status: 403 }
      );
    }

    const userContext: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
    };

    // Issue JWT token pair embedding user role in payload
    const tokenPair = await generateTokenPair(userContext);

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: userContext.role,
        roles: userContext.roles,
      },
      accessToken: tokenPair.accessToken,
    });

    return setAuthCookies(response, tokenPair.accessToken, tokenPair.refreshToken);
  } catch (error: any) {
    console.error('Error in admin login API:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
