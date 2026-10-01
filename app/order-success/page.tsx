'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shortId = searchParams.get('shortId') || searchParams.get('orderId') || 'OR-XXXXX';
  const total = searchParams.get('total');

  return (
    <div style={{ maxWidth: '620px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div className="bounce-in" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '2px solid var(--success)', color: 'var(--success)', fontSize: '3rem', marginBottom: '24px' }}>✓</div>
      <h1 className="heading-bebas" style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Order placed successfully</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>Keep your guest order number to track its progress.</p>
      <section className="auth-card" style={{ maxWidth: '100%', padding: '24px', marginBottom: '28px' }}>
        <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Order number</span>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px' }}>{shortId}</p>
        {total && <p style={{ marginTop: '12px' }}>Total: €{total}</p>}
      </section>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="btn btn-primary" onClick={() => router.push(`/track-order?shortId=${encodeURIComponent(shortId)}`)}>Track order</button>
        <button className="btn btn-secondary" onClick={() => router.push('/stores')}>Continue browsing</button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <CustomerLayout>
      <Suspense fallback={<div style={{ padding: '80px 24px', textAlign: 'center' }}>Loading order…</div>}>
        <SuccessContent />
      </Suspense>
    </CustomerLayout>
  );
}
