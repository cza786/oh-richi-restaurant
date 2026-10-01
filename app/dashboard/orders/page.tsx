'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    const response = await fetch('/api/orders');
    const data = await response.json();
    if (response.ok) { setOrders(data); setNotes(Object.fromEntries(data.map((order: any) => [order.id, order.adminNote || '']))); }
    else setError(data.error || 'Unable to load orders.');
  }, []);
  useEffect(() => { void load(); }, [load]);

  const updateOrder = async (id: string, update: { status?: string; paymentStatus?: string; adminNote?: string | null }) => {
    const response = await fetch('/api/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...update }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Unable to update order.');
    await load();
  };
  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  return <DashboardLayout>
    <div style={{ marginBottom: '24px' }}><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Orders</h1><p style={{ color: 'var(--text-muted)' }}>Guest orders, payment state, notes and complete status history.</p></div>
    {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
    <div className="filter-tabs" style={{ marginBottom: '18px' }}>{['all', ...STATUS_FLOW, 'cancelled'].map((status) => <button key={status} className={`filter-tab ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>{status.replaceAll('_', ' ')}</button>)}</div>
    <div style={{ display: 'grid', gap: '16px' }}>{visible.map((order) => {
      const currentIndex = STATUS_FLOW.indexOf(order.status);
      const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;
      return <article className="dashboard-card" key={order.id}>
        <div className="flex-between"><div><small>{order.restaurant?.name}</small><h2>{order.orderNumber}</h2></div><span className={`status-badge status-badge-${order.status}`}>{order.status.replaceAll('_', ' ')}</span></div>
        <div className="grid-2" style={{ marginTop: '14px' }}><div><strong>{order.customer.name}</strong><br /><span>{order.customer.phone}</span><br /><small>{order.address}</small></div><div><div>Subtotal: €{Number(order.subTotal).toFixed(2)}</div><div>Delivery: €{Number(order.deliveryFee).toFixed(2)}</div><strong>Total: €{Number(order.totalAmount).toFixed(2)}</strong><div>{order.paymentMethod} · {order.paymentStatus}</div></div></div>
        <div style={{ marginTop: '14px' }}>{order.items.map((item: any) => <div key={item.id}>{item.quantity} × {item.productName} — €{Number(item.totalPrice).toFixed(2)}{item.options.length > 0 && <small> ({item.options.map((option: any) => option.name).join(', ')})</small>}</div>)}</div>
        {order.customerNote && <p><strong>Customer note:</strong> {order.customerNote}</p>}
        <label className="form-group" style={{ marginTop: '14px' }}><span className="form-label">Admin note</span><textarea className="form-input" value={notes[order.id] || ''} onChange={(event) => setNotes({ ...notes, [order.id]: event.target.value })} /></label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => updateOrder(order.id, { adminNote: notes[order.id] || null })}>Save note</button>{nextStatus && <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => updateOrder(order.id, { status: nextStatus, adminNote: notes[order.id] || null })}>Move to {nextStatus.replaceAll('_', ' ')}</button>}{!['delivered', 'cancelled'].includes(order.status) && <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => updateOrder(order.id, { status: 'cancelled', adminNote: notes[order.id] || null })}>Cancel</button>}{order.paymentStatus !== 'paid' && <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => updateOrder(order.id, { paymentStatus: 'paid' })}>Mark paid</button>}</div>
        <details style={{ marginTop: '16px' }}><summary>Status history</summary><ol>{order.statusHistory.map((entry: any) => <li key={entry.id}>{entry.status.replaceAll('_', ' ')} · {new Date(entry.createdAt).toLocaleString()}{entry.note ? ` — ${entry.note}` : ''}{entry.createdBy ? ` (${entry.createdBy.firstName} ${entry.createdBy.lastName})` : ''}</li>)}</ol></details>
      </article>;
    })}</div>
  </DashboardLayout>;
}
