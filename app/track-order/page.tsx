'use client';

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

function Tracker() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get('shortId') || '');
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState('');

  const lookup = useCallback(async (shortId: string) => {
    if (!shortId.trim()) return;
    const response = await fetch(`/api/orders?shortId=${encodeURIComponent(shortId.trim())}`);
    const data = await response.json();
    if (!response.ok || !data) {
      setOrder(null);
      setError(data.error || 'Order not found.');
      return;
    }
    setOrder(data);
    setError('');
  }, []);

  useEffect(() => {
    const initial = searchParams.get('shortId');
    if (initial) void lookup(initial);
  }, [lookup, searchParams]);

  useEffect(() => {
    if (!order || ['delivered', 'cancelled'].includes(order.status)) return;
    const timer = window.setInterval(() => void lookup(order.shortId), 10000);
    return () => window.clearInterval(timer);
  }, [lookup, order]);

  const submit = (event: FormEvent) => { event.preventDefault(); void lookup(code); };
  const currentIndex = order ? STEPS.indexOf(order.status) : -1;

  return <div style={{ maxWidth: '760px', margin: '40px auto', padding: '24px' }}><h1>Track your guest order</h1><p style={{ color: 'var(--text-muted)', margin: '8px 0 24px' }}>Enter the order number shown after checkout.</p><form onSubmit={submit} style={{ display: 'flex', gap: '10px' }}><input className="form-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="D2D-20261001-ABC12345" required /><button className="btn btn-primary" style={{ width: 'auto' }}>Track</button></form>{error && <div className="auth-error" style={{ marginTop: '16px' }}>{error}</div>}{order && <section className="dashboard-card" style={{ marginTop: '24px' }}><div className="flex-between"><div><small>Order</small><h2>{order.orderNumber || order.shortId}</h2></div><span className={`status-badge status-badge-${String(order.status).toLowerCase()}`}>{String(order.status).replaceAll('_', ' ')}</span></div>{order.status === 'cancelled' ? <p style={{ marginTop: '20px', color: 'var(--danger)' }}>This order was cancelled.</p> : <div style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>{STEPS.map((step, index) => <div key={step} style={{ display: 'flex', gap: '12px', opacity: index <= currentIndex ? 1 : 0.4 }}><strong>{index < currentIndex ? '✓' : index === currentIndex ? '●' : '○'}</strong><span>{step.replaceAll('_', ' ')}</span></div>)}</div>}<div className="flex-between" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}><span>Total</span><strong>€{Number(order.totalAmount).toFixed(2)}</strong></div></section>}</div>;
}

export default function TrackOrderPage() {
  return <CustomerLayout><Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading tracker…</div>}><Tracker /></Suspense></CustomerLayout>;
}
