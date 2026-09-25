/**
 * Role-Based Access Control (RBAC) Core Utilities
 * Centralized role definitions and hierarchy rules for security validation.
 */

export const DEFAULT_CUSTOMER_ROLE = 'customer';

export const VALID_STAFF_ROLES = [
  'super_admin',
  'admin',
  'owner',
  'manager',
  'store_manager',
  'kitchen_staff',
  'cashier',
] as const;

export type StaffRole = (typeof VALID_STAFF_ROLES)[number];

/**
 * Checks whether a given role string is a customer role.
 */
export function isCustomerRole(role?: string | null): boolean {
  if (!role) return false;
  return role.trim().toLowerCase() === DEFAULT_CUSTOMER_ROLE;
}

/**
 * Checks whether a user role is allowed to access the admin management portal.
 * Customers are strictly forbidden.
 */
export function isAdminPortalAllowed(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  if (normalized === DEFAULT_CUSTOMER_ROLE) return false;

  // Allowed staff roles or custom admin-level roles
  return (
    VALID_STAFF_ROLES.includes(normalized as StaffRole) ||
    normalized === 'owner' ||
    normalized === 'manager'
  );
}

/**
 * Role Hierarchy Validation Matrix:
 * - super_admin: can create any staff role (admin, store_manager, kitchen_staff, cashier, super_admin)
 * - admin: can create store_manager, kitchen_staff, cashier (CANNOT create super_admin or admin)
 * - store_manager: can create kitchen_staff, cashier (CANNOT create super_admin, admin, or store_manager)
 * - others (kitchen_staff, cashier, customer, etc.): CANNOT create any staff roles
 */
export function canCreateStaffRole(requesterRole: string, targetRole: string): boolean {
  const req = requesterRole.trim().toLowerCase();
  const target = targetRole.trim().toLowerCase();

  // Target role must be a valid staff role
  if (!VALID_STAFF_ROLES.includes(target as StaffRole)) {
    return false;
  }

  if (req === 'super_admin') {
    return true;
  }

  if (req === 'admin') {
    return target !== 'super_admin' && target !== 'admin';
  }

  if (req === 'store_manager') {
    return target !== 'super_admin' && target !== 'admin' && target !== 'store_manager';
  }

  return false;
}

/**
 * Returns true if creating the target staff role is forbidden for the requester role.
 */
export function isForbiddenRoleCreation(requesterRole: string, targetRole: string): boolean {
  return !canCreateStaffRole(requesterRole, targetRole);
}
