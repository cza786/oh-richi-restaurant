import { NextResponse } from 'next/server';
import {
  clearAuthCookies,
  extractRefreshTokenFromRequest,
  revokeAllUserSessions,
  revokeSessionByToken,
  verifySessionToken,
} from '@/lib/auth';

export async function POST(request: Request) {
  return handleLogout(request);
}

export async function DELETE(request: Request) {
  return handleLogout(request);
}

async function handleLogout(request: Request) {
  try {
    const url = new URL(request.url);
    let logoutAll = url.searchParams.get('all') === 'true' || url.searchParams.get('logoutAll') === 'true';

    let bodyToken: string | undefined;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await request.json();
        if (body.logoutAll || body.all) {
          logoutAll = true;
        }
        if (body.refreshToken) {
          bodyToken = body.refreshToken;
        }
      } catch (err) {
        // payload without json body
      }
    }

    const authenticatedUser = await verifySessionToken(request);
    const refreshToken = extractRefreshTokenFromRequest(request, bodyToken);

    if (logoutAll && authenticatedUser) {
      // Revoke all active sessions for this user across all devices
      await revokeAllUserSessions(authenticatedUser.id);
    } else if (refreshToken) {
      // Revoke only current device session
      await revokeSessionByToken(refreshToken);
    }

    const response = NextResponse.json({
      message: logoutAll ? 'Logged out from all devices.' : 'Logged out successfully.',
    });

    // Clear HTTP-Only cookies
    clearAuthCookies(response);

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    clearAuthCookies(response);
    return response;
  }
}
