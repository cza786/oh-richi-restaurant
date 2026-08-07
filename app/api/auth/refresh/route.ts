import { NextResponse } from 'next/server';
import { extractRefreshTokenFromRequest, rotateRefreshToken, setAuthCookies } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Rate Limiting on /refresh: Max 10 attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`refresh:${ipAddress}`, 10, 15 * 60 * 1000);


    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many refresh requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimit.resetMs / 1000).toString(),
          },
        }
      );
    }

    let bodyToken: string | undefined;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await request.json();
        bodyToken = body.refreshToken;
      } catch (err) {
        // payload without json body
      }
    }

    const refreshToken = extractRefreshTokenFromRequest(request, bodyToken);

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required.' }, { status: 400 });
    }

    const tokenPair = await rotateRefreshToken(refreshToken, { userAgent, ipAddress });

    if (!tokenPair) {
      return NextResponse.json(
        { error: 'Refresh token is invalid, revoked, or expired.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      message: 'Token refreshed successfully.',
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    });

    setAuthCookies(response, tokenPair.accessToken, tokenPair.refreshToken);

    return response;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
