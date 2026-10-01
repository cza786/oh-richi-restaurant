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
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
};

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
      await db.$transaction([
        db.restaurant.update({ where: { id: restaurant.id }, data: { logoUrl } }),
        db.media.create({ data: { type: 'image', entityType: 'restaurant_logo', entityId: restaurant.id, url: logoUrl } }),
      ]);
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
