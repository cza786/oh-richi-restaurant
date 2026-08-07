'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('matrix'); // users, matrix

  // Mock Users List (Screen 19)
  const [users, setUsers] = useState([
    { id: '1', firstName: 'Richi', lastName: 'Owner', email: 'owner@ohrichi.com', role: 'OWNER', isActive: true },
    { id: '2', firstName: 'John', lastName: 'Manager', email: 'manager@ohrichi.com', role: 'MANAGER', isActive: true },
    { id: '3', firstName: 'Mario', lastName: 'Chef', email: 'kitchen@ohrichi.com', role: 'KITCHEN_STAFF', isActive: true },
    { id: '4', firstName: 'Sarah', lastName: 'Cashier', email: 'cashier@ohrichi.com', role: 'CASHIER', isActive: true },
    { id: '5', firstName: 'System', lastName: 'Admin', email: 'admin@ohrichi.com', role: 'ADMIN', isActive: true },
    { id: '6', firstName: 'Test', lastName: 'User', email: 'admin_test@ohrichi.com', role: 'ADMIN', isActive: true },
  ]);

  // Mock Roles List (Screen 19)
  const roles = ['OWNER', 'MANAGER', 'KITCHEN_STAFF', 'CASHIER', 'ADMIN'];

  // Mock Permissions Column list (Screen 19)
  const permissionsList = [
    { key: 'viewDashboard', label: 'View Dashboard' },
    { key: 'viewAnalytics', label: 'View Analytics' },
    { key: 'viewOrders', label: 'View Orders' },
    { key: 'acceptOrders', label: 'Accept Orders' },
    { key: 'updateOrderStatus', label: 'Update Order Status' },
    { key: 'viewKds', label: 'View KDS' },
    { key: 'editMenu', label: 'Edit Menu' },
    { key: 'manageDelivery', label: 'Manage Delivery' },
    { key: 'managePayments', label: 'Manage Payments' },
    { key: 'viewReports', label: 'View Reports' },
    { key: 'manageUsers', label: 'Manage Users' },
    { key: 'manageSettings', label: 'Manage Settings' },
  ];

  // Mock Permission Matrix state mapping roles -> permission key (boolean)
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({
    ADMIN: { viewDashboard: true, viewAnalytics: true, viewOrders: true, acceptOrders: true, updateOrderStatus: true, viewKds: true, editMenu: true, manageDelivery: true, managePayments: true, viewReports: true, manageUsers: true, manageSettings: true },
    OWNER: { viewDashboard: true, viewAnalytics: true, viewOrders: true, acceptOrders: true, updateOrderStatus: true, viewKds: true, editMenu: true, manageDelivery: true, managePayments: true, viewReports: true, manageUsers: true, manageSettings: true },
    MANAGER: { viewDashboard: true, viewAnalytics: true, viewOrders: true, acceptOrders: true, updateOrderStatus: true, viewKds: true, editMenu: true, manageDelivery: true, managePayments: true, viewReports: true, manageUsers: false, manageSettings: true },
    KITCHEN_STAFF: { viewDashboard: false, viewAnalytics: false, viewOrders: true, acceptOrders: true, updateOrderStatus: true, viewKds: true, editMenu: false, manageDelivery: false, managePayments: false, viewReports: false, manageUsers: false, manageSettings: false },
    CASHIER: { viewDashboard: true, viewAnalytics: false, viewOrders: true, acceptOrders: true, updateOrderStatus: true, viewKds: false, editMenu: false, manageDelivery: false, managePayments: true, viewReports: false, manageUsers: false, manageSettings: false },
  });

  const togglePermission = (role: string, permKey: string) => {
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permKey]: !prev[role][permKey],
      }
    }));
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const first = form.firstName.value;
    const last = form.lastName.value;
    const email = form.email.value;
    const role = form.role.value;

    setUsers(prev => [...prev, {
      id: Date.now().toString(),
      firstName: first,
      lastName: last,
      email,
      role,
      isActive: true
    }]);

    form.reset();
    alert('Staff user registered successfully!');
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Users & Access Control
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure role-based permissions, edit active staff registries, and secure system modules.
        </p>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '24px', width: 'fit-content' }}>
        <button className={`filter-tab ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>Role Permission Matrix</button>
        <button className={`filter-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Staff Accounts Registry</button>
      </div>

      {/* Tab 1: Access Control Matrix */}
      {activeTab === 'matrix' && (
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 className="card-title-text">Authorization Matrix</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-red-bright)', fontWeight: 600 }}>
              🔴 RED TOGGLES INDICATE ACTIVE PRIVILEGES
            </span>
          </div>

          <div className="pos-table-wrapper">
            <table className="pos-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '150px' }}>Role Classification</th>
                  {permissionsList.map(perm => (
                    <th key={perm.key} style={{ textAlign: 'center', minWidth: '110px', fontSize: '0.65rem' }}>
                      {perm.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      🔑 {role.replace('_', ' ')}
                    </td>
                    {permissionsList.map(perm => {
                      const isGranted = matrix[role]?.[perm.key] || false;
                      const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';
                      return (
                        <td key={perm.key} style={{ textAlign: 'center' }}>
                          <label 
                            className="checkbox-container" 
                            style={{ justifyContent: 'center', margin: '0', cursor: isOwnerOrAdmin ? 'not-allowed' : 'pointer' }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isGranted} 
                              onChange={() => !isOwnerOrAdmin && togglePermission(role, perm.key)}
                              disabled={isOwnerOrAdmin}
                            />
                            <span className="checkmark" style={{ marginRight: '0' }}></span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Users Registry */}
      {activeTab === 'users' && (
        <div className="grid-3" style={{ gridTemplateColumns: '2fr 1.2fr', alignItems: 'start' }}>
          {/* Active accounts grid */}
          <div className="dashboard-card" style={{ marginBottom: '0' }}>
            <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Active Employees Registry</h3>
            <div className="pos-table-wrapper">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Role Assigned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((usr) => (
                    <tr key={usr.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {usr.firstName} {usr.lastName}
                      </td>
                      <td>{usr.email}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#222', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                          {usr.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <label className="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={usr.isActive} 
                            onChange={() => toggleUserStatus(usr.id)} 
                          />
                          <span className="checkmark"></span>
                          <span style={{ fontSize: '0.75rem' }}>{usr.isActive ? 'Active' : 'Suspended'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create new employee form */}
          <div className="dashboard-card" style={{ marginBottom: '0' }}>
            <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Register Staff Account</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" name="firstName" className="form-input" placeholder="John" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" name="lastName" className="form-input" placeholder="Doe" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" name="email" className="form-input" placeholder="staff@ohrichi.com" required />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Role</label>
                <select name="role" className="form-select">
                  <option value="MANAGER">Manager</option>
                  <option value="KITCHEN_STAFF">Kitchen Staff</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Register Employee</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
