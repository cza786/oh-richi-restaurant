'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const emptyRestaurant = {
  id: '', name: '', slug: '', description: '', logoUrl: '', coverImageUrl: '', address: '', phone: '', whatsapp: '',
  isActive: true, isOpen: true, openingTime: '10:00', closingTime: '23:00', deliveryRadiusKm: 0, minimumOrderAmount: 0, deliveryFee: 0,
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/restaurants');
    const data = await response.json();
    if (response.ok) setRestaurants(data); else setError(data.error || 'Unable to load restaurants.');
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin/restaurants', { method: editing.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Unable to save restaurant.');
    setEditing(null);
    await load();
  };

  return <DashboardLayout>
    <div className="flex-between" style={{ marginBottom: '24px' }}><div><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Restaurants</h1><p style={{ color: 'var(--text-muted)' }}>Manage each tenant and its delivery configuration.</p></div><button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setEditing({ ...emptyRestaurant })}>Add restaurant</button></div>
    {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
    <div className="dashboard-card"><div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Restaurant</th><th>Address</th><th>Products</th><th>Open</th><th>Active</th><th>Action</th></tr></thead><tbody>
      {restaurants.map((restaurant) => <tr key={restaurant.id}><td><strong>{restaurant.name}</strong><br /><small>/{restaurant.slug}</small></td><td>{restaurant.address}</td><td>{restaurant._count?.products ?? restaurant._count?.menuItems ?? 0}</td><td>{restaurant.isOpen ? 'Yes' : 'No'}</td><td>{restaurant.isActive ? 'Yes' : 'No'}</td><td><button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setEditing({ ...restaurant })}>Edit</button></td></tr>)}
    </tbody></table></div></div>

    {editing && <div className="drawer open"><div className="drawer-content"><div className="drawer-header"><h2>{editing.id ? 'Edit restaurant' : 'Add restaurant'}</h2><button onClick={() => setEditing(null)}>×</button></div><form onSubmit={save} style={{ padding: '20px' }}>
      <div className="grid-2">
        <label className="form-group"><span className="form-label">Name</span><input className="form-input" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value, ...(!editing.id && !editing.slug ? { slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') } : {}) })} required /></label>
        <label className="form-group"><span className="form-label">Slug</span><input className="form-input" value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} required /></label>
        <label className="form-group"><span className="form-label">Phone</span><input className="form-input" value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} required /></label>
        <label className="form-group"><span className="form-label">WhatsApp</span><input className="form-input" value={editing.whatsapp || ''} onChange={(event) => setEditing({ ...editing, whatsapp: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Opening time</span><input className="form-input" type="time" value={editing.openingTime || ''} onChange={(event) => setEditing({ ...editing, openingTime: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Closing time</span><input className="form-input" type="time" value={editing.closingTime || ''} onChange={(event) => setEditing({ ...editing, closingTime: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Delivery radius (km)</span><input className="form-input" type="number" min="0" step="0.1" value={editing.deliveryRadiusKm} onChange={(event) => setEditing({ ...editing, deliveryRadiusKm: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Minimum order</span><input className="form-input" type="number" min="0" step="0.01" value={editing.minimumOrderAmount} onChange={(event) => setEditing({ ...editing, minimumOrderAmount: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Delivery fee</span><input className="form-input" type="number" min="0" step="0.01" value={editing.deliveryFee} onChange={(event) => setEditing({ ...editing, deliveryFee: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Logo URL</span><input className="form-input" value={editing.logoUrl || ''} onChange={(event) => setEditing({ ...editing, logoUrl: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Cover image URL</span><input className="form-input" value={editing.coverImageUrl || ''} onChange={(event) => setEditing({ ...editing, coverImageUrl: event.target.value })} /></label>
      </div>
      <label className="form-group"><span className="form-label">Address</span><input className="form-input" value={editing.address} onChange={(event) => setEditing({ ...editing, address: event.target.value })} required /></label>
      <label className="form-group"><span className="form-label">Description</span><textarea className="form-input" value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}><label><input type="checkbox" checked={editing.isOpen} onChange={(event) => setEditing({ ...editing, isOpen: event.target.checked })} /> Open</label><label><input type="checkbox" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> Active</label></div>
      <button className="btn btn-primary">Save restaurant</button>
    </form></div></div>}
  </DashboardLayout>;
}
