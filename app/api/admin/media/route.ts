import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const media = await db.media.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(media);
}

export async function DELETE(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Media ID is required.' }, { status: 400 });
  await db.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

