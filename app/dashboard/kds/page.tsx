'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const columns = [
  { status: 'pending', label: 'New orders', next: 'confirmed', action: 'Confirm' },
  { status: 'confirmed', label: 'Confirmed', next: 'preparing', action: 'Prepare' },
  { status: 'preparing', label: 'Preparing', next: 'ready', action: 'Mark ready' },
  { status: 'ready', label: 'Ready', next: 'out_for_delivery', action: 'Dispatch' },
  { status: 'out_for_delivery', label: 'Out for delivery', next: 'delivered', action: 'Delivered' },
];

export default function KdsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const response = await fetch('/api/orders');
    if (response.ok) setTickets(await response.json());
    setLoading(false);
  }, []);
  useEffect(() => { void load(); const interval = window.setInterval(() => void load(), 10000); return () => window.clearInterval(interval); }, [load]);
  const transition = async (id: string, status: string) => {
    const response = await fetch('/api/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (response.ok) setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, status } : ticket));
  };

  return <DashboardLayout>
    <div style={{ marginBottom: '28px' }}><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Kitchen Display System</h1><p style={{ color: 'var(--text-muted)' }}>Live database-backed preparation and delivery queue.</p></div>
    {loading ? <div style={{ padding: '40px' }}>Loading orders…</div> : <div className="kds-board">{columns.map((column) => {
      const columnTickets = tickets.filter((ticket) => ticket.status === column.status);
      return <section className="kds-column" key={column.status}><div className="kds-column-header"><span>{column.label}</span><span className="kds-column-count">{columnTickets.length}</span></div><div className="kds-cards-list">{columnTickets.map((ticket) => <article className="kds-card" key={ticket.id}><div className="kds-card-header"><span className="kds-card-order-num">#{ticket.orderNumber}</span><span>{ticket.customer?.name}</span></div><div className="kds-card-items">{ticket.items.map((item: any) => <div key={item.id} className="kds-card-item"><span>{item.quantity}× {item.productName}{item.options.length ? ` (${item.options.map((option: any) => option.name).join(', ')})` : ''}</span></div>)}</div>{ticket.customerNote && <small>{ticket.customerNote}</small>}<div className="kds-card-footer"><button className="btn btn-primary" onClick={() => transition(ticket.id, column.next)}>{column.action}</button></div></article>)}</div></section>;
    })}</div>}
  </DashboardLayout>;
}
