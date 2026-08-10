'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface StaffUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminStaffDashboardPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kitchen_staff',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Current logged in user's role (mocked/loaded from session)
  const [currentUserRole, setCurrentUserRole] = useState<string>('super_admin');

  // Fetch staff Directory
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/users/staff');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load staff directory.');
        setLoading(false);
        return;
      }

      setStaffList(data.users || []);
    } catch (err) {
      console.error(err);
      setError('Network error fetching staff members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Handle Staff Creation Form
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.role) {
      setModalError('All fields are required.');
      return;
    }

    try {
      setModalLoading(true);
      const res = await fetch('/api/admin/users/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Failed to create staff member.');
        setModalLoading(false);
        return;
      }

      setModalSuccess(data.message || 'Staff member created successfully!');
      setFormData({ name: '', email: '', password: '', role: 'kitchen_staff' });
      
      // Refresh list
      fetchStaff();

      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setModalError('Failed to create staff account.');
    } finally {
      setModalLoading(false);
    }
  };

  const getRoleBadge = (roleName: string) => {
    const r = roleName.toLowerCase();
    switch (r) {
      case 'super_admin':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'admin':
      case 'store_manager':
      case 'manager':
      case 'owner':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'kitchen_staff':
      case 'chef':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1">
              <span>🛡️ RBAC Management Console</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Staff & Roles Directory</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage system access permissions for Super Admins, Managers, and Kitchen Staff
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition"
            >
              ← Back to Main Dashboard
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2"
            >
              <span>+ Create New Staff Member</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={fetchStaff} className="underline text-xs">Retry</button>
          </div>
        )}

        {/* Staff Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Staff Name</th>
                  <th className="px-6 py-4">Email / Contact</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <p>Loading staff directory...</p>
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No staff members found. Click "+ Create New Staff Member" to add one.
                    </td>
                  </tr>
                ) : (
                  staffList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}` : 'Staff Member'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {user.email || user.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center text-xs text-emerald-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-slate-600 mr-2" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Create New Staff Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Create New Staff Member</h2>
            <p className="text-xs text-slate-400 mb-6">
              Assign appropriate RBAC roles to grant staff access.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                ⚠️ {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
                ✓ {modalSuccess}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Chef"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="chef@ohrichi.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Assign System Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-white text-sm font-medium"
                >
                  <option value="kitchen_staff">Kitchen Staff (Read-only orders & statuses)</option>
                  <option value="store_manager">Store Manager / Admin (Inventory, Orders, Settings)</option>
                  {currentUserRole === 'super_admin' && (
                    <>
                      <option value="admin">System Admin</option>
                      <option value="super_admin">Super Admin (Full system control & user management)</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  * Note: Admin users cannot assign Super Admin roles unless logged in as Super Admin.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-2"
                >
                  {modalLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
