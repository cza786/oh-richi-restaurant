import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract session token from cookie or Authorization header
  const token =
    request.cookies.get('session_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  // 1. Protect Dashboard & Admin Page Routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    // Exclude signup/login sub-paths if present
    const isPublicAdminRoute =
      pathname === '/admin/signup' ||
      pathname === '/admin/login' ||
      pathname === '/login';

    if (!isPublicAdminRoute && !token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Admin API Endpoints
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Authentication token is required to access admin endpoints.' },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  // 3. Inject Essential Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

export const middleware = proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
