import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  const authResult = await requireRole(request, ['SUPER_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;
  const customers = await db.customer.findMany({
    include: { _count: { select: { orders: true } }, orders: { select: { orderNumber: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(customers);
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Customer ID is required.' }, { status: 400 });
    if (!body.name?.trim() || !body.phone?.trim() || !body.address?.trim()) {
      return NextResponse.json({ error: 'Name, phone, and address are required.' }, { status: 400 });
    }
    const latitude = body.latitude === '' || body.latitude == null ? null : Number(body.latitude);
    const longitude = body.longitude === '' || body.longitude == null ? null : Number(body.longitude);
    if ((latitude == null) !== (longitude == null) || (latitude != null && (!Number.isFinite(latitude) || !Number.isFinite(longitude)))) {
      return NextResponse.json({ error: 'Valid latitude and longitude must be provided together.' }, { status: 400 });
    }
    const customer = await db.customer.update({
      where: { id: body.id },
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        whatsapp: body.whatsapp?.trim() || null,
        address: body.address.trim(),
        latitude,
        longitude,
        notes: body.notes?.trim() || null,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Unable to update guest customer.' }, { status: 400 });
  }
}
