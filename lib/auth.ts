import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '@/lib/db';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  roles: string[];
}

/**
 * Computes SHA-256 hash of a raw token string for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Retrieves JWT Access Token secret key.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production.');
    }
    return 'oh_richi_fallback_secret_123';
  }
  return secret;
}

/**
 * Retrieves JWT Refresh Token secret key.
 */
export function getRefreshTokenSecret(): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: REFRESH_TOKEN_SECRET environment variable is missing in production.');
    }
    return 'oh_richi_fallback_refresh_secret_999';
  }
  return secret;
}

/**
 * Extracts access token from request cookies or Authorization header.
 */
export function extractTokenFromRequest(request: Request): string | null {
  // 1. Try Cookie header
  const cookiesHeader = request.headers.get('cookie') || '';
  const cookieToken = cookiesHeader
    .split('; ')
    .find((row) => row.startsWith('session_token='))
    ?.split('=')[1];

  if (cookieToken) return cookieToken;

  // 2. Try Authorization: Bearer <token> header
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Extracts refresh token from request cookies or payload.
 */
export function extractRefreshTokenFromRequest(request: Request, bodyToken?: string): string | null {
  if (bodyToken) return bodyToken;

  const cookiesHeader = request.headers.get('cookie') || '';
  const cookieToken = cookiesHeader
    .split('; ')
    .find((row) => row.startsWith('refresh_token='))
    ?.split('=')[1];

  return cookieToken || null;
}

/**
 * Verifies session access token and resolves active user context from database.
 */
export async function verifySessionToken(request: Request): Promise<AuthenticatedUser | null> {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) return null;

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as any;

    if (!decoded || !decoded.userId) return null;

    // Check database to ensure user is active and fetch current roles
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) return null;

    const roles = user.userRoles.map((ur) => ur.role.name);
    if (user.role && !roles.includes(user.role)) {
      roles.push(user.role);
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      roles,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generates an Access Token (15m) and persistent Refresh Token (7d).
 * Stores SHA-256 hashed refresh token in Session table.
 */
export async function generateTokenPair(
  user: AuthenticatedUser,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const jwtSecret = getJwtSecret();
  const refreshSecret = getRefreshTokenSecret();

  // Short-lived Access Token (15 minutes)
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      roles: user.roles,
    },
    jwtSecret,
    { expiresIn: '15m' }
  );

  // Long-lived Refresh Token (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tokenType: 'refresh',
      jti: crypto.randomUUID(),
    },
    refreshSecret,
    { expiresIn: '7d' }
  );

  const tokenHash = hashToken(refreshToken);

  // Persist session record with hashed token in PostgreSQL
  await db.session.create({
    data: {
      userId: user.id,
      tokenHash,
      userAgent: metadata?.userAgent || null,
      ipAddress: metadata?.ipAddress || null,
      expiresAt,
      isRevoked: false,
    },
  });

  return { accessToken, refreshToken, expiresAt };
}

/**
 * Validates refresh token, rotates session (invalidates old, issues new pair),
 * and performs REUSE DETECTION (invalidates all sessions if a revoked token is reused).
 */
export async function rotateRefreshToken(
  refreshTokenString: string,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const refreshSecret = getRefreshTokenSecret();
    const decoded = jwt.verify(refreshTokenString, refreshSecret) as any;

    if (!decoded || !decoded.userId || decoded.tokenType !== 'refresh') {
      return null;
    }

    const incomingHash = hashToken(refreshTokenString);

    // Look up session by token hash
    const sessionRecord = await db.session.findUnique({
      where: { tokenHash: incomingHash },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    // --- REUSE DETECTION ---
    // If a session record exists but is already revoked, an attacker or compromise is replaying an old token.
    // Invalidate ALL sessions belonging to this user for security!
    if (sessionRecord && sessionRecord.isRevoked) {
      console.warn(`SECURITY WARNING: Refresh token reuse detected for user ${sessionRecord.userId}. Revoking all sessions.`);
      await revokeAllUserSessions(sessionRecord.userId);
      return null;
    }

    if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
      return null;
    }

    if (!sessionRecord.user || !sessionRecord.user.isActive) {
      return null;
    }

    // Token Rotation: Revoke current session
    await db.session.update({
      where: { id: sessionRecord.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    const roles = sessionRecord.user.userRoles.map((ur) => ur.role.name);

    const userContext: AuthenticatedUser = {
      id: sessionRecord.user.id,
      email: sessionRecord.user.email,
      firstName: sessionRecord.user.firstName,
      lastName: sessionRecord.user.lastName,
      roles,
    };

    // Issue new token pair & new session
    const newPair = await generateTokenPair(userContext, metadata);
    return {
      accessToken: newPair.accessToken,
      refreshToken: newPair.refreshToken,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Revokes a single session by matching raw refresh token hash.
 */
export async function revokeSessionByToken(refreshTokenString: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(refreshTokenString);
    const session = await db.session.findUnique({ where: { tokenHash } });
    if (!session) return false;

    await db.session.update({
      where: { id: session.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Revokes all active sessions for a given user (e.g. Logout All Devices or Security Reset).
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.session.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
}

/**
 * Alias for backward compatibility
 */
export const revokeUserRefreshTokens = revokeAllUserSessions;

/**
 * Sets access_token and refresh_token HTTP-Only cookies on NextResponse.
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  // Access token cookie (15 mins)
  response.cookies.set('session_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  });

  // Refresh token cookie (7 days)
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}

/**
 * Clears access_token and refresh_token HTTP-Only cookies on NextResponse.
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

/**
 * Ensures request is authenticated. Returns { user } or NextResponse with 401 status.
 */
export async function requireAuth(
  request: Request
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const user = await verifySessionToken(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Authentication token is missing, expired, or invalid.' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Ensures request is authenticated and user holds at least one of allowed roles.
 */
export async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  const hasAllowedRole = user.roles.some((role) =>
    allowedRoles.map((r) => r.toUpperCase()).includes(role.toUpperCase())
  );

  if (!hasAllowedRole) {
    return NextResponse.json(
      { error: 'Forbidden. You do not have permission to access this resource.' },
      { status: 403 }
    );
  }

  return { user };
}
