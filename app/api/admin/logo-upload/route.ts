import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'oh_richi_fallback_secret_123';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ADMIN_ROLES = new Set(['ADMIN', 'OWNER', 'MANAGER']);
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
};

function getSessionToken(request: Request) {
  return (request.headers.get('cookie') || '')
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('session_token='))
    ?.slice('session_token='.length);
}

async function requireAdmin(request: Request) {
  const token = getSessionToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let userId: string | undefined;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: 'Session expired or invalid.' }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: 'Session expired or invalid.' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });

  const canManage = user?.isActive
    && user.userRoles.some(({ role }) => ADMIN_ROLES.has(role.name.toUpperCase()));

  if (!canManage) {
    return NextResponse.json({ error: 'You do not have permission to manage restaurant settings.' }, { status: 403 });
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const image = formData.get('image') || formData.get('logo');

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Please choose an image file to upload.' }, { status: 400 });
    }

    if (!image.size) {
      return NextResponse.json({ error: 'The selected image file is empty.' }, { status: 400 });
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Logo images must be 5 MB or smaller.' }, { status: 413 });
    }

    const mimeType = image.type.toLowerCase();
    const extension = ALLOWED_IMAGE_TYPES[mimeType] || path.extname(image.name).slice(1) || 'png';

    const bytes = new Uint8Array(await image.arrayBuffer());
    const fileName = `logo-${randomUUID()}.${extension}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'logo');
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), bytes);

    const logoUrl = `/uploads/logo/${fileName}`;

    // Automatically update restaurant logo in DB if restaurant exists
    const restaurant = await db.restaurant.findFirst();
    if (restaurant) {
      await db.restaurant.update({
        where: { id: restaurant.id },
        data: { logoUrl },
      });
    }

    return NextResponse.json(
      { success: true, logoUrl },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Upload logo image error:', error);
    return NextResponse.json({ error: 'Unable to upload the logo image.' }, { status: 500 });
  }
}
