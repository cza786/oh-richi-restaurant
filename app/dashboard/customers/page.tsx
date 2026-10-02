'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/customers');
    const data = await response.json();
    if (response.ok) setCustomers(data); else setMessage(data.error || 'Unable to load guest customers.');
  }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/admin/customers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || 'Unable to save guest customer.');
    setEditing(null);
    setMessage('Guest customer saved.');
    await load();
  };
  return <DashboardLayout><div style={{ marginBottom: '24px' }}><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Guest Customers</h1><p style={{ color: 'var(--text-muted)' }}>Guest delivery details recorded during checkout. These are not login accounts.</p></div>{message && <div className="auth-success" style={{ marginBottom: '16px' }}>{message}</div>}<div className="dashboard-card"><div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Name</th><th>Phone</th><th>WhatsApp</th><th>Address</th><th>Orders</th><th>Latest order</th><th>Action</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.phone}</td><td>{customer.whatsapp || '—'}</td><td>{customer.address}</td><td>{customer._count.orders}</td><td>{customer.orders[0]?.orderNumber || '—'}</td><td><button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setEditing({ ...customer })}>Edit</button></td></tr>)}</tbody></table></div></div>{editing && <div className="drawer open"><div className="drawer-content"><div className="drawer-header"><h2>Edit guest customer</h2><button onClick={() => setEditing(null)}>×</button></div><form onSubmit={save} style={{ padding: '20px' }}><div className="grid-2"><label className="form-group"><span className="form-label">Name</span><input className="form-input" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required /></label><label className="form-group"><span className="form-label">Phone</span><input className="form-input" value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} required /></label><label className="form-group"><span className="form-label">WhatsApp</span><input className="form-input" value={editing.whatsapp || ''} onChange={(event) => setEditing({ ...editing, whatsapp: event.target.value })} /></label><label className="form-group"><span className="form-label">Latitude</span><input className="form-input" type="number" step="any" value={editing.latitude ?? ''} onChange={(event) => setEditing({ ...editing, latitude: event.target.value })} /></label><label className="form-group"><span className="form-label">Longitude</span><input className="form-input" type="number" step="any" value={editing.longitude ?? ''} onChange={(event) => setEditing({ ...editing, longitude: event.target.value })} /></label></div><label className="form-group"><span className="form-label">Address</span><input className="form-input" value={editing.address} onChange={(event) => setEditing({ ...editing, address: event.target.value })} required /></label><label className="form-group"><span className="form-label">Notes</span><textarea className="form-input" value={editing.notes || ''} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} /></label><button className="btn btn-primary">Save customer</button></form></div></div>}</DashboardLayout>;
}

