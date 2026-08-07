import { NextResponse } from 'next/server';
import { requireAuth, revokeUserRefreshTokens } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
    });
  } catch (error: any) {
    console.error('Session check error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST endpoint clears cookies (logout) and revokes user refresh tokens
export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request);
    if (!(authResult instanceof NextResponse)) {
      await revokeUserRefreshTokens(authResult.user.id);
    }
  } catch (err) {
    // Continue clearing cookies even if auth check fails
  }

  const response = NextResponse.json({ message: 'Logged out successfully.' });

  response.cookies.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // expire immediately
    path: '/',
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // expire immediately
    path: '/',
  });

  return response;
}
