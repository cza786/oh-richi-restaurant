'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shortId = searchParams.get('shortId') || 'OR-XXXXX';
  const total = searchParams.get('total') || '0.00';
  const points = searchParams.get('points') || '0';
  const payment = searchParams.get('payment') || 'CARD';

  const [displayPoints, setDisplayPoints] = useState(false);

  useEffect(() => {
    // Show points reward message after a brief delay for a nice staggered entrance
    const timer = setTimeout(() => {
      setDisplayPoints(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const getPaymentName = (method: string) => {
    switch (method) {
      case 'CARD': return 'Visa •••• 4242';
      case 'APPLE_PAY': return 'Apple Pay';
      case 'PAYPAL': return 'PayPal';
      case 'GOOGLE_PAY': return 'Google Pay';
      default: return 'Online Payment';
    }
  };

  return (
    <>
      <div className="richi-success-mobile">
        <header className="richi-flow-header">
          <button type="button" onClick={() => router.push('/')} aria-label="Back to menu">&larr;</button>
          <h1>Order Tracking</h1>
          <span aria-hidden="true" />
        </header>

        <main className="richi-success-mobile-body">
          <div className="richi-success-ring" aria-hidden="true">&#10003;</div>
          <h2>Your order is confirmed!</h2>
          <strong className="richi-success-order-number">Order #{shortId}</strong>
          <p>We&apos;re preparing your delicious food.</p>

          <div className="richi-mobile-progress" aria-label="Order progress">
            <div className="completed"><i>&#10003;</i><span>Confirmed</span></div>
            <div className="active"><i>+</i><span>Preparing</span></div>
            <div><i /><span>On the way</span></div>
            <div><i /><span>Delivered</span></div>
          </div>

          <section className="richi-success-eta-card">
            <div><span>Estimated Delivery Time</span><strong>20-30 min</strong></div>
            <b aria-hidden="true">&#128757;</b>
          </section>

          <section className="richi-success-details">
            <div><span>Total</span><strong>{'\u20ac'}{total}</strong></div>
            <div><span>Payment</span><strong>{getPaymentName(payment)}</strong></div>
            {Number(points) > 0 && displayPoints && <div><span>Rewards earned</span><strong>+{points} points</strong></div>}
          </section>
        </main>

        <footer className="richi-success-mobile-actions">
          <button type="button" onClick={() => router.push('/track-order?shortId=' + shortId)}>Track Order</button>
          <button type="button" onClick={() => router.push('/')}>Back to Menu</button>
        </footer>
      </div>

      <div className="richi-success-desktop" style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      
      {/* Animated Success Checkmark */}
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '2px solid var(--success)', color: 'var(--success)', fontSize: '3rem', marginBottom: '24px' }} className="bounce-in">
        ✓
      </div>

      <h1 className="heading-bebas" style={{ fontSize: '2.8rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
        Order Placed Successfully!
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>
        Thank you! Your order is being prepared and will be ready shortly.
      </p>

      {/* Order Info Card */}
      <div className="auth-card" style={{ maxWidth: '100%', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Number</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{shortId}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Time</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '4px' }}>30 - 40 min</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</span>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>{getPaymentName(payment)}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</span>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>€{total}</p>
          </div>
        </div>
      </div>

      {/* Points Alert */}
      {Number(points) > 0 && displayPoints && (
        <div className="bounce-in" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px dashed rgba(34, 197, 94, 0.25)', padding: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '1.6rem' }}>🏆</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
            Awesome! You've earned <strong>{points} loyalty points</strong> on this order.
          </span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          className="btn btn-primary"
          onClick={() => router.push(`/track-order?shortId=${shortId}`)}
          style={{ height: '46px', fontSize: '0.95rem', fontWeight: 600 }}
        >
          Track Your Order
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => router.push('/')}
          style={{ height: '46px', fontSize: '0.95rem', fontWeight: 600 }}
        >
          Back to Menu
        </button>
      </div>

      </div>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <CustomerLayout>
      <Suspense fallback={
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading success screen...
        </div>
      }>
        <SuccessPageContent />
      </Suspense>
    </CustomerLayout>
  );
}
