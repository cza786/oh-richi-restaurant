'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/media');
    const data = await response.json();
    if (response.ok) setMedia(data); else setMessage(data.error || 'Unable to load media.');
  }, []);
  useEffect(() => { void load(); }, [load]);
  const remove = async (id: string) => {
    if (!window.confirm('Remove this media record? Existing catalog URLs are not changed.')) return;
    const response = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) return setMessage('Unable to remove media record.');
    await load();
  };
  return <DashboardLayout><div style={{ marginBottom: '24px' }}><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Media Library</h1><p style={{ color: 'var(--text-muted)' }}>Uploaded media records and their entity associations.</p></div>{message && <div className="auth-success" style={{ marginBottom: '16px' }}>{message}</div>}<div className="dashboard-card"><div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Preview</th><th>Type</th><th>Entity</th><th>URL</th><th>Created</th><th>Action</th></tr></thead><tbody>{media.map((item) => <tr key={item.id}><td>{item.type === 'image' ? <img src={item.url} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }} /> : '—'}</td><td>{item.type}</td><td>{item.entityType || 'general'}{item.entityId ? ` · ${item.entityId}` : ''}</td><td><a href={item.url} target="_blank" rel="noreferrer">{item.url}</a></td><td>{new Date(item.createdAt).toLocaleString()}</td><td><button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => remove(item.id)}>Remove record</button></td></tr>)}</tbody></table></div></div></DashboardLayout>;
}

