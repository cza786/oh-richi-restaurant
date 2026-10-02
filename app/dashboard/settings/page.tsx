'use client';

import { FormEvent, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { fetch('/api/settings?includeGeneric=true').then(async (response) => { if (response.ok) setSettings(await response.json()); }); }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    const data = await response.json();
    setMessage(response.ok ? 'Settings saved.' : data.error || 'Unable to save settings.');
  };
  const updateGeneric = (index: number, field: string, value: string) => setSettings({ ...settings, platformSettings: settings.platformSettings.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, [field]: value } : item) });
  if (!settings) return <DashboardLayout><div style={{ padding: '40px' }}>Loading settings…</div></DashboardLayout>;

  return <DashboardLayout>
    <div style={{ marginBottom: '24px' }}><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Restaurant Settings</h1><p style={{ color: 'var(--text-muted)' }}>Restaurant profile, operating hours, delivery values and generic platform settings.</p></div>
    {message && <div className="auth-success" style={{ marginBottom: '16px' }}>{message}</div>}
    <form onSubmit={save} className="dashboard-card" style={{ maxWidth: '850px' }}>
      <div className="grid-2">
        {[
          ['name', 'Restaurant name', 'text'], ['phone', 'Phone', 'text'], ['whatsapp', 'WhatsApp', 'text'], ['openingTime', 'Opening time', 'time'], ['closingTime', 'Closing time', 'time'],
          ['deliveryRadiusKm', 'Delivery radius (km)', 'number'], ['minimumOrderAmount', 'Minimum order amount', 'number'], ['deliveryFee', 'Delivery fee', 'number'], ['logoUrl', 'Logo URL', 'text'], ['coverImageUrl', 'Cover image URL', 'text'],
        ].map(([field, label, type]) => <label className="form-group" key={field}><span className="form-label">{label}</span><input className="form-input" type={type} step={type === 'number' ? '0.01' : undefined} value={settings[field] ?? ''} onChange={(event) => setSettings({ ...settings, [field]: event.target.value })} required={['name', 'phone'].includes(field)} /></label>)}
      </div>
      <label className="form-group"><span className="form-label">Address</span><input className="form-input" value={settings.address || ''} onChange={(event) => setSettings({ ...settings, address: event.target.value })} required /></label>
      <label className="form-group"><span className="form-label">Description</span><textarea className="form-input" value={settings.description || ''} onChange={(event) => setSettings({ ...settings, description: event.target.value })} /></label>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}><label><input type="checkbox" checked={settings.isOpen} onChange={(event) => setSettings({ ...settings, isOpen: event.target.checked })} /> Open</label><label><input type="checkbox" checked={settings.isActive} onChange={(event) => setSettings({ ...settings, isActive: event.target.checked })} /> Active</label></div>
      <h2 style={{ margin: '20px 0 12px' }}>Generic settings</h2>
      {(settings.platformSettings || []).map((setting: any, index: number) => <div className="grid-2" key={`${setting.key}-${index}`}><input className="form-input" value={setting.key} onChange={(event) => updateGeneric(index, 'key', event.target.value)} placeholder="Key" /><input className="form-input" value={setting.value} onChange={(event) => updateGeneric(index, 'value', event.target.value)} placeholder="Value" /><input className="form-input" value={setting.description || ''} onChange={(event) => updateGeneric(index, 'description', event.target.value)} placeholder="Description" /><button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setSettings({ ...settings, platformSettings: settings.platformSettings.filter((_: any, itemIndex: number) => itemIndex !== index) })}>Remove</button></div>)}
      <button type="button" className="btn btn-secondary" style={{ width: 'auto', margin: '12px 0' }} onClick={() => setSettings({ ...settings, platformSettings: [...(settings.platformSettings || []), { key: '', value: '', description: '' }] })}>Add setting</button>
      <button className="btn btn-primary">Save settings</button>
    </form>
  </DashboardLayout>;
}
