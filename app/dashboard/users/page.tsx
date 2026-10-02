'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const emptyUser = { email: '', firstName: '', lastName: '', phone: '', password: '', isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    if (response.ok) setUsers(data); else setMessage(data.error || 'Unable to load users.');
  }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/admin/users', { method: editing.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || 'Unable to save user.');
    setEditing(null);
    setMessage('User saved.');
    await load();
  };
  return <DashboardLayout><div className="flex-between" style={{ marginBottom: '24px' }}><div><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Super Admin Users</h1><p style={{ color: 'var(--text-muted)' }}>Manage the platform administrators defined by the MVP.</p></div><button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setEditing({ ...emptyUser })}>Add user</button></div>{message && <div className="auth-success" style={{ marginBottom: '16px' }}>{message}</div>}<div className="dashboard-card"><div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Active</th><th>Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.firstName} {user.lastName}</td><td>{user.email}</td><td>{user.phone || '—'}</td><td>{user.role}</td><td>{user.isActive ? 'Yes' : 'No'}</td><td><button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setEditing({ ...user, password: '' })}>Edit</button></td></tr>)}</tbody></table></div></div>{editing && <div className="drawer open"><div className="drawer-content"><div className="drawer-header"><h2>{editing.id ? 'Edit user' : 'Add user'}</h2><button onClick={() => setEditing(null)}>×</button></div><form onSubmit={save} style={{ padding: '20px' }}><div className="grid-2"><label className="form-group"><span className="form-label">First name</span><input className="form-input" value={editing.firstName} onChange={(event) => setEditing({ ...editing, firstName: event.target.value })} required /></label><label className="form-group"><span className="form-label">Last name</span><input className="form-input" value={editing.lastName} onChange={(event) => setEditing({ ...editing, lastName: event.target.value })} required /></label><label className="form-group"><span className="form-label">Email</span><input className="form-input" type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} required /></label><label className="form-group"><span className="form-label">Phone</span><input className="form-input" value={editing.phone || ''} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} /></label></div><label className="form-group"><span className="form-label">{editing.id ? 'New password (leave blank to keep)' : 'Password'}</span><input className="form-input" type="password" minLength={10} value={editing.password} onChange={(event) => setEditing({ ...editing, password: event.target.value })} required={!editing.id} /></label><label style={{ display: 'block', marginBottom: '20px' }}><input type="checkbox" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> Active</label><button className="btn btn-primary">Save user</button></form></div></div>}</DashboardLayout>;
}

