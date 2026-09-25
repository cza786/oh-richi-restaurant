import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { generateTokenPair, setAuthCookies } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import {
  isCaptchaRequired,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyCaptchaToken,
  getFailedAttemptCount,
} from '@/lib/captcha';
import { loginSchema, validateBody } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Rate Limiting on /login: Max 5 attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`login:${ipAddress}`, 5, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again after 15 minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimit.resetMs / 1000).toString(),
          },
        }
      );
    }

    let rawData: any = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      rawData = await request.json();
    } else {
      const formData = await request.formData();
      rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
        captchaToken: formData.get('captchaToken'),
        captchaAnswer: formData.get('captchaAnswer'),
      };
    }

    const email = (rawData.email || '').toString().trim().toLowerCase();
    const password = (rawData.password || '').toString();
    const captchaToken = (rawData.captchaToken || '').toString();
    const captchaAnswer = (rawData.captchaAnswer || '').toString();

    const validationResult = validateBody(loginSchema, { email, password });
    if (validationResult instanceof NextResponse) {
      return validationResult;
    }

    const attemptKey = `login:${ipAddress}:${email}`;
    const captchaNeeded = isCaptchaRequired(attemptKey);

    if (captchaNeeded) {
      const isCaptchaValid = verifyCaptchaToken(captchaToken, captchaAnswer);
      if (!isCaptchaValid) {
        return NextResponse.json(
          {
            error: 'Invalid CAPTCHA solution. Please try again.',
            requiresCaptcha: true,
          },
          { status: 400 }
        );
      }
    }

    // Find user by email or phone number
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email },
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

    if (!user || !user.isActive) {
      recordFailedAttempt(attemptKey);
      const attempts = getFailedAttemptCount(attemptKey);
      return NextResponse.json(
        {
          error: 'Invalid email or password.',
          requiresCaptcha: attempts >= 3,
          failedAttempts: attempts,
        },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isPasswordValid) {
      recordFailedAttempt(attemptKey);
      const attempts = getFailedAttemptCount(attemptKey);
      return NextResponse.json(
        {
          error: 'Invalid email or password.',
          requiresCaptcha: attempts >= 3,
          failedAttempts: attempts,
        },
        { status: 400 }
      );
    }

    // Success - reset failed attempt count for this user/IP
    resetFailedAttempts(attemptKey);



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
      message: 'Logged in successfully.',
      user: authenticatedUser,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    });

    setAuthCookies(response, tokenPair.accessToken, tokenPair.refreshToken);

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

