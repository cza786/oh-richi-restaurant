import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { VALID_STAFF_ROLES, canCreateStaffRole } from '@/lib/rbac';

/**
 * POST /api/admin/users/create-staff
 * Protected endpoint to create new staff accounts (admin, store_manager, kitchen_staff).
 * Enforces role hierarchy rules to prevent unauthorized privilege escalation.
 */
export async function POST(request: Request) {
  // 1. RBAC Guard: Requires super_admin, admin, store_manager, or owner role
  const authResult = await requireRole(request, ['super_admin', 'admin', 'store_manager', 'owner']);
  if (authResult instanceof NextResponse) {
    return authResult; // Returns HTTP 401/403 if unauthorized
  }

  const requester = authResult.user;

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Security check: validate required payload parameters
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required.' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const targetRole = role.trim().toLowerCase();

    // Valid staff roles hierarchy check
    if (!VALID_STAFF_ROLES.includes(targetRole as any)) {
      return NextResponse.json(
        { error: `Invalid role specified. Allowed staff roles are: ${VALID_STAFF_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // --- Role Validation Hierarchy Check ---
    const requesterRole = (requester.role || requester.roles[0] || '').toLowerCase();

    if (!canCreateStaffRole(requesterRole, targetRole)) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to create a staff member with this role.' },
        { status: 403 }
      );
    }

    // Check if user email already exists
    const existingUser = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split name into firstName & lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Find role entity in db (uppercase role name for Role table)
    const roleDbName = targetRole.toUpperCase();
    let roleRecord = await db.role.findUnique({
      where: { name: roleDbName },
    });

    if (!roleRecord) {
      roleRecord = await db.role.create({
        data: {
          name: roleDbName,
          description: `${roleDbName} staff member.`,
        },
      });
    }

    // Create staff user account
    const newStaffUser = await db.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: targetRole, // Assigned role
        isActive: true,
        userRoles: {
          create: {
            roleId: roleRecord.id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Staff member ${newStaffUser.firstName} ${newStaffUser.lastName} created successfully.`,
        user: newStaffUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member account.' },
      { status: 500 }
    );
  }
}
