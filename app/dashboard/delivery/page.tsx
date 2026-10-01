'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function DeliveryPage() {
  const [settings, setSettings] = useState<any | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [zone, setZone] = useState({ zoneName: '', deliveryFee: 0, polygon: '' });
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/delivery');
    const data = await response.json();
    if (response.ok) { setSettings(data.settings); setZones(data.zones); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/delivery', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_settings', ...settings }) });
    setMessage(response.ok ? 'Delivery settings saved.' : 'Unable to save delivery settings.');
  };
  const addZone = async (event: FormEvent) => {
    event.preventDefault();
    let polygon: unknown = undefined;
    if (zone.polygon.trim()) {
      try { polygon = JSON.parse(zone.polygon); } catch { return setMessage('Zone polygon must be valid JSON.'); }
    }
    const response = await fetch('/api/delivery', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_zone', restaurantId: settings.restaurantId, zoneName: zone.zoneName, deliveryFee: Number(zone.deliveryFee), polygon }) });
    if (response.ok) { setZone({ zoneName: '', deliveryFee: 0, polygon: '' }); await load(); }
    else setMessage('Unable to add zone.');
  };
  const removeZone = async (zoneId: string) => {
    if (!window.confirm('Delete this delivery zone?')) return;
    await fetch('/api/delivery', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_zone', zoneId }) });
    await load();
  };
  if (!settings) return <DashboardLayout><div style={{ padding: '40px' }}>Loading delivery settings…</div></DashboardLayout>;

  return <DashboardLayout>
    <h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Delivery &amp; Zones</h1>
    {message && <div className="auth-success" style={{ margin: '12px 0' }}>{message}</div>}
    <div className="grid-2">
      <form className="dashboard-card" onSubmit={saveSettings}><h2>Restaurant delivery</h2>
        <label className="form-group"><span className="form-label">Radius (km)</span><input className="form-input" type="number" min="0" step="0.1" value={settings.deliveryRadius} onChange={(event) => setSettings({ ...settings, deliveryRadius: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Minimum order</span><input className="form-input" type="number" min="0" step="0.01" value={settings.minimumOrderAmount} onChange={(event) => setSettings({ ...settings, minimumOrderAmount: event.target.value })} /></label>
        <label className="form-group"><span className="form-label">Delivery fee</span><input className="form-input" type="number" min="0" step="0.01" value={settings.baseDeliveryFee} onChange={(event) => setSettings({ ...settings, baseDeliveryFee: event.target.value })} /></label>
        <button className="btn btn-primary">Save</button>
      </form>
      <form className="dashboard-card" onSubmit={addZone}><h2>Add delivery zone</h2>
        <label className="form-group"><span className="form-label">Name</span><input className="form-input" value={zone.zoneName} onChange={(event) => setZone({ ...zone, zoneName: event.target.value })} required /></label>
        <label className="form-group"><span className="form-label">Delivery fee</span><input className="form-input" type="number" min="0" step="0.01" value={zone.deliveryFee} onChange={(event) => setZone({ ...zone, deliveryFee: Number(event.target.value) })} /></label>
        <label className="form-group"><span className="form-label">Polygon JSON (optional)</span><textarea className="form-input" value={zone.polygon} onChange={(event) => setZone({ ...zone, polygon: event.target.value })} placeholder='{"type":"Polygon","coordinates":[]}' /></label>
        <button className="btn btn-primary">Add zone</button>
      </form>
    </div>
    <div className="dashboard-card" style={{ marginTop: '20px' }}><h2>Delivery zones</h2><div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Name</th><th>Fee</th><th>Active</th><th>Action</th></tr></thead><tbody>{zones.map((item) => <tr key={item.id}><td>{item.name}</td><td>€{Number(item.deliveryFee).toFixed(2)}</td><td>{item.isActive ? 'Yes' : 'No'}</td><td><button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => removeZone(item.id)}>Delete</button></td></tr>)}</tbody></table></div></div>
  </DashboardLayout>;
}
