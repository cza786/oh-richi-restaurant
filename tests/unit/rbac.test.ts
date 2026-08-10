import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CUSTOMER_ROLE,
  VALID_STAFF_ROLES,
  canCreateStaffRole,
  isForbiddenRoleCreation,
  isCustomerRole,
  isAdminPortalAllowed,
} from '@/lib/rbac';

describe('RBAC Role Hierarchy & Security Validation', () => {
  it('should allow super_admin to create admin, store_manager, kitchen_staff, and cashier', () => {
    const requesterRole = 'super_admin';
    const targetRoles = ['admin', 'store_manager', 'kitchen_staff', 'cashier', 'super_admin'];

    targetRoles.forEach((targetRole) => {
      const canCreate = canCreateStaffRole(requesterRole, targetRole);
      expect(canCreate).toBe(true);
    });
  });

  it('should prevent an admin or store_manager from creating a super_admin or another admin', () => {
    // Admin checks
    expect(isForbiddenRoleCreation('admin', 'super_admin')).toBe(true);
    expect(isForbiddenRoleCreation('admin', 'admin')).toBe(true);
    expect(canCreateStaffRole('admin', 'store_manager')).toBe(true);
    expect(canCreateStaffRole('admin', 'kitchen_staff')).toBe(true);
    expect(canCreateStaffRole('admin', 'cashier')).toBe(true);

    // Store manager checks
    expect(isForbiddenRoleCreation('store_manager', 'super_admin')).toBe(true);
    expect(isForbiddenRoleCreation('store_manager', 'admin')).toBe(true);
    expect(isForbiddenRoleCreation('store_manager', 'store_manager')).toBe(true);
    expect(canCreateStaffRole('store_manager', 'kitchen_staff')).toBe(true);
    expect(canCreateStaffRole('store_manager', 'cashier')).toBe(true);

    // Kitchen staff and customer checks
    expect(isForbiddenRoleCreation('kitchen_staff', 'cashier')).toBe(true);
    expect(isForbiddenRoleCreation('customer', 'cashier')).toBe(true);
  });

  it('should assign customer role by default for phone + OTP registered users', () => {
    expect(DEFAULT_CUSTOMER_ROLE).toBe('customer');
    expect(isCustomerRole('customer')).toBe(true);
    expect(isCustomerRole('CUSTOMER')).toBe(true);
    expect(isCustomerRole('admin')).toBe(false);
    expect(isCustomerRole(null)).toBe(false);
  });

  it('should restrict customer accounts from logging in through admin portal', () => {
    // Customers restricted
    expect(isAdminPortalAllowed('customer')).toBe(false);
    expect(isAdminPortalAllowed('CUSTOMER')).toBe(false);
    expect(isAdminPortalAllowed(null)).toBe(false);
    expect(isAdminPortalAllowed('')).toBe(false);

    // Management staff allowed
    VALID_STAFF_ROLES.forEach((role) => {
      expect(isAdminPortalAllowed(role)).toBe(true);
    });
    expect(isAdminPortalAllowed('owner')).toBe(true);
    expect(isAdminPortalAllowed('manager')).toBe(true);
  });
});
