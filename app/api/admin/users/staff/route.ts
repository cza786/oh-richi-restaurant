import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

/**
 * GET /api/admin/users/staff
 * Retrieves list of non-customer staff users. Protected for management access.
 */
export async function GET(request: Request) {
  const authResult = await requireRole(request, ['super_admin', 'admin', 'store_manager', 'owner', 'kitchen_staff']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const staffMembers = await db.user.findMany({
      where: {
        NOT: {
          role: 'customer',
        },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      count: staffMembers.length,
      users: staffMembers,
    });
  } catch (error: any) {
    console.error('Error fetching staff users:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve staff directory.' },
      { status: 500 }
    );
  }
}
