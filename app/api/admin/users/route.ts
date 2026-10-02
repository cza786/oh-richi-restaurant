import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole, revokeAllUserSessions } from '@/lib/auth';

export async function GET(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const users = await db.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const password = String(body.password || '');
    if (!email || !firstName || !lastName || password.length < 10) {
      return NextResponse.json({ error: 'Email, first name, last name, and a password of at least 10 characters are required.' }, { status: 400 });
    }
    const user = await db.user.create({
      data: { email, firstName, lastName, phone: body.phone?.trim() || null, passwordHash: await bcrypt.hash(password, 12), role: 'SUPER_ADMIN', isActive: body.isActive !== false },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Unable to create user. The email must be unique.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    if (body.id === authResult.user.id && body.isActive === false) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 409 });
    }
    const password = body.password ? String(body.password) : '';
    if (password && password.length < 10) return NextResponse.json({ error: 'Password must be at least 10 characters.' }, { status: 400 });
    const user = await db.user.update({
      where: { id: body.id },
      data: {
        ...(body.email !== undefined ? { email: String(body.email).trim().toLowerCase() } : {}),
        ...(body.firstName !== undefined ? { firstName: String(body.firstName).trim() } : {}),
        ...(body.lastName !== undefined ? { lastName: String(body.lastName).trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });
    if (password || body.isActive === false) await revokeAllUserSessions(body.id);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Unable to update user.' }, { status: 400 });
  }
}

