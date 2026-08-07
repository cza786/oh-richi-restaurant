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

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Rate Limiting on /customer/login: Max 5 attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`customer-login:${ipAddress}`, 5, 15 * 60 * 1000);
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

    let email = '';
    let password = '';
    let captchaToken = '';
    let captchaAnswer = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email || '';
      password = body.password || '';
      captchaToken = body.captchaToken || '';
      captchaAnswer = body.captchaAnswer || '';
    } else {
      const formData = await request.formData();
      email = (formData.get('email') as string) || '';
      password = (formData.get('password') as string) || '';
      captchaToken = (formData.get('captchaToken') as string) || '';
      captchaAnswer = (formData.get('captchaAnswer') as string) || '';
    }

    email = email.trim().toLowerCase();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const attemptKey = `customer-login:${ipAddress}:${email}`;
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

    // Find user and include roles
    const user = await db.user.findUnique({
      where: { email },
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
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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

    const rolesList = user.userRoles.map((ur) => ur.role.name);
    
    // Ensure user has CUSTOMER role (or let owner/manager log in as customer)
    if (!rolesList.includes('CUSTOMER') && !rolesList.includes('ADMIN') && !rolesList.includes('OWNER')) {
      return NextResponse.json({ error: 'Account is not configured as a customer profile.' }, { status: 403 });
    }

    // Success - reset failed attempt count for this customer/IP
    resetFailedAttempts(attemptKey);



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
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

