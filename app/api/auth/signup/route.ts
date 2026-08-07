import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { generateTokenPair, setAuthCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    let firstName = '';
    let lastName = '';
    let email = '';
    let password = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      firstName = body.firstName || '';
      lastName = body.lastName || '';
      email = body.email || '';
      password = body.password || '';
    } else {
      const formData = await request.formData();
      firstName = (formData.get('firstName') as string) || '';
      lastName = (formData.get('lastName') as string) || '';
      email = (formData.get('email') as string) || '';
      password = (formData.get('password') as string) || '';
    }

    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim().toLowerCase();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Get or create ADMIN role
    let adminRole = await db.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      adminRole = await db.role.create({
        data: {
          name: 'ADMIN',
          description: 'System administrator created during sign up',
        },
      });
    }

    // Create User and link role in a transaction
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          isActive: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      return user;
    });

    const authenticatedUser = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      roles: ['ADMIN'],
    };

    const tokenPair = await generateTokenPair(authenticatedUser);

    const response = NextResponse.json({
      message: 'Admin registered successfully.',
      user: authenticatedUser,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    });

    setAuthCookies(response, tokenPair.accessToken, tokenPair.refreshToken);

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
