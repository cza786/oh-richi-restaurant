import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import db from '@/lib/db';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function hasExpectedSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  if (mimeType === 'image/webp') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

async function requireAdmin(request: Request) {
  const result = await requireRole(request, ['SUPER_ADMIN']);
  return result instanceof NextResponse ? result : null;
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const image = formData.get('image') || formData.get('logo');
    const restaurantId = String(formData.get('restaurantId') || '').trim();
    const restaurant = restaurantId ? await db.restaurant.findUnique({ where: { id: restaurantId } }) : null;
    if (restaurantId && !restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });

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
    const extension = ALLOWED_IMAGE_TYPES[mimeType];
    if (!extension) return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are supported.' }, { status: 415 });

    const bytes = new Uint8Array(await image.arrayBuffer());
    if (!hasExpectedSignature(bytes, mimeType)) return NextResponse.json({ error: 'The file contents do not match a valid image.' }, { status: 415 });
    const fileName = `logo-${randomUUID()}.${extension}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'logo');
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), bytes);

    const logoUrl = `/uploads/logo/${fileName}`;

    await db.media.create({ data: { type: 'image', entityType: 'restaurant_logo', entityId: restaurant?.id || null, url: logoUrl } });

    return NextResponse.json(
      { success: true, logoUrl },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Upload logo image error:', error);
    return NextResponse.json({ error: 'Unable to upload the logo image.' }, { status: 500 });
  }
}
