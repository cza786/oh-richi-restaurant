import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'oh_richi_fallback_secret_123';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ADMIN_ROLES = new Set(['ADMIN', 'OWNER', 'MANAGER']);
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function getSessionToken(request: Request) {
  return (request.headers.get('cookie') || '')
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('session_token='))
    ?.slice('session_token='.length);
}

async function requireMenuManager(request: Request) {
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

  const canManageMenu = user?.isActive
    && user.userRoles.some(({ role }) => ADMIN_ROLES.has(role.name));

  if (!canManageMenu) {
    return NextResponse.json({ error: 'You do not have permission to manage menu images.' }, { status: 403 });
  }

  return null;
}

function hasExpectedSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length
      && signature.every((byte, index) => bytes[index] === byte);
  }

  if (mimeType === 'image/webp') {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const authError = await requireMenuManager(request);
    if (authError) return authError;

    const formData = await request.formData();
    const image = formData.get('image');

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
    }

    if (!image.size) {
      return NextResponse.json({ error: 'The selected image is empty.' }, { status: 400 });
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Product images must be 5 MB or smaller.' }, { status: 413 });
    }

    const mimeType = image.type.toLowerCase();
    const extension = ALLOWED_IMAGE_TYPES[mimeType];
    if (!extension) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are supported.' }, { status: 415 });
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    if (!hasExpectedSignature(bytes, mimeType)) {
      return NextResponse.json({ error: 'The file contents do not match a valid image.' }, { status: 415 });
    }

    const fileName = `${randomUUID()}.${extension}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'menu');
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), bytes, { flag: 'wx' });

    return NextResponse.json(
      { imageUrl: `/uploads/menu/${fileName}` },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Upload menu image error:', error);
    return NextResponse.json({ error: 'Unable to upload the product image.' }, { status: 500 });
  }
}
