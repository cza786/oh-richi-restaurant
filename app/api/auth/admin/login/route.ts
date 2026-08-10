import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { generateTokenPair, setAuthCookies, AuthenticatedUser } from '@/lib/auth';
import { isAdminPortalAllowed } from '@/lib/rbac';

/**
 * POST /api/auth/admin/login
 * Validates Email + Password authentication for management staff (super_admin, admin, store_manager, kitchen_staff).
 * Strictly prevents customer role accounts from logging in.
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
      include: {
        userRoles: {
          include: { role: true },
        },
      },
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

    // Resolve user roles hierarchy
    const userRoleNames = user.userRoles.map((ur) => ur.role.name.toLowerCase());
    const primaryRole = user.role?.toLowerCase() || userRoleNames[0] || 'customer';

    // RBAC Security Guard: Ensure user role is permitted to log in via admin portal
    if (!isAdminPortalAllowed(primaryRole)) {
      return NextResponse.json(
        { error: 'Access forbidden. Customer accounts are not allowed to log in via the management portal.' },
        { status: 403 }
      );
    }

    const userContext: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || primaryRole,
      roles: user.userRoles.map((ur) => ur.role.name),
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
