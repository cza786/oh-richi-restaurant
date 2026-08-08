'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialShortId = searchParams.get('shortId') || '';

  const [searchQuery, setSearchQuery] = useState(initialShortId);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Simulated status logic for demo
  const [simulatedStatus, setSimulatedStatus] = useState<string>('');

  const fetchOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      // Find orders. Since we GET all orders from /api/orders, we filter by shortId on client for simplicity,
      // or we could query the database. Searching all orders is very simple and guarantees we find it!
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders.');
      const data: any[] = await res.json();
      
      const targetOrder = data.find(o => o.shortId.toUpperCase() === id.trim().toUpperCase());
      if (targetOrder) {
        setOrder(targetOrder);
        setSimulatedStatus(targetOrder.status);
      } else {
        setError('Order not found. Please verify the code.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialShortId) {
      fetchOrder(initialShortId);
    }
  }, [initialShortId]);

  // Simulate active preparing progress for freshly placed orders
  useEffect(() => {
    if (!order) return;
    
    // Only simulate progression if status is PENDING or PREPARING
    if (order.status === 'PENDING' || order.status === 'PREPARING') {
      const interval = setInterval(() => {
        setSimulatedStatus((current) => {
          if (current === 'PENDING') {
            return 'ACCEPTED';
          } else if (current === 'ACCEPTED') {
            return 'PREPARING';
          } else if (current === 'PREPARING') {
            return 'READY';
          } else if (current === 'READY') {
            return 'ON_THE_WAY'; // Custom status for visual tracking
          } else if (current === 'ON_THE_WAY') {
            return 'DELIVERED';
          }
          return current;
        });
      }, 8000); // Progress every 8 seconds for demo speeds!
      
      return () => clearInterval(interval);
    }
  }, [order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/track-order?shortId=${searchQuery.trim().toUpperCase()}`);
    }
  };

  // Convert status to node states
  const getStatusIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'ON_THE_WAY': return 4;
      case 'DELIVERED':
      case 'COMPLETED': return 5;
      default: return 0;
    }
  };

  const statusIndex = getStatusIndex(simulatedStatus || order?.status || 'PENDING');
  const mobileStage = statusIndex <= 2 ? 1 : statusIndex <= 4 ? 2 : 3;

  const steps = [
    { label: 'Placed', icon: '📝' },
    { label: 'Accepted', icon: '🤝' },
    { label: 'Preparing', icon: '🍳' },
    { label: 'Ready', icon: '📦' },
    { label: 'On Way', icon: '🛵' },
    { label: 'Delivered', icon: '🏠' },
  ];

  return (
    <>
      <div className="richi-track-mobile">
        <header className="richi-flow-header">
          <button type="button" onClick={() => router.push('/')} aria-label="Back to menu">&larr;</button>
          <h1>Order Tracking</h1>
          <span aria-hidden="true" />
        </header>

        {!order ? (
          <main className="richi-track-lookup">
            <div className="richi-track-search-icon" aria-hidden="true">&#8981;</div>
            <h2>Track your order</h2>
            <p>Enter the order number from your confirmation screen.</p>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Order number"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Track Order'}</button>
            </form>
            {error && <div className="richi-track-error" role="alert">{error}</div>}
          </main>
        ) : (
          <main className="richi-track-mobile-body">
            <div className="richi-success-ring" aria-hidden="true">&#10003;</div>
            <h2>{mobileStage === 3 ? 'Your order has arrived!' : 'Your order is confirmed!'}</h2>
            <strong className="richi-success-order-number">Order #{order.shortId}</strong>
            <p>{mobileStage >= 2 ? 'Your food is on the way.' : "We're preparing your delicious food."}</p>

            <div className="richi-mobile-progress" aria-label="Order progress">
              <div className={mobileStage > 0 ? 'completed' : 'active'}><i>&#10003;</i><span>Confirmed</span></div>
              <div className={mobileStage > 1 ? 'completed' : mobileStage === 1 ? 'active' : ''}><i>+</i><span>Preparing</span></div>
              <div className={mobileStage > 2 ? 'completed' : mobileStage === 2 ? 'active' : ''}><i /><span>On the way</span></div>
              <div className={mobileStage === 3 ? 'active' : ''}><i /><span>Delivered</span></div>
            </div>

            <section className="richi-success-eta-card">
              <div><span>Estimated Delivery Time</span><strong>{mobileStage === 3 ? 'Delivered' : '20-30 min'}</strong></div>
              <b aria-hidden="true">&#128757;</b>
            </section>

            <section className="richi-track-order-summary">
              <h3>Order Summary</h3>
              {order.orderItems?.map((item: any) => (
                <div key={item.id}>
                  <span>{item.quantity}x {item.menuItem?.name || 'Menu item'}</span>
                  <strong>{'\u20ac'}{Number(item.subtotal).toFixed(2)}</strong>
                </div>
              ))}
              <div className="total"><span>Total</span><strong>{'\u20ac'}{Number(order.totalAmount).toFixed(2)}</strong></div>
            </section>

            <button className="richi-track-another" type="button" onClick={() => { setOrder(null); setSearchQuery(''); }}>Track another order</button>
          </main>
        )}

        {order && (
          <footer className="richi-track-refresh">
            <button type="button" onClick={() => fetchOrder(order.shortId)} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Status'}</button>
          </footer>
        )}
      </div>

      <div className="richi-track-desktop" style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{ color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
          LIVE TRACKING
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#ffffff', margin: '8px 0', textTransform: 'uppercase' }}>
          TRACK YOUR ORDER
        </h1>
      </div>

      {/* Lookup search bar */}
      <div style={{
        background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
        border: '1px solid #282838',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Enter Order Code (e.g. OR-9204)"
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: '#0a0a0f',
              border: '1px solid #282838',
              color: '#ffffff',
              fontSize: '0.95rem',
              outline: 'none',
              textTransform: 'uppercase',
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            style={{
              padding: '0 32px',
              background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
            }}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
        {error && <p style={{ color: 'var(--accent-red, #ff3b30)', fontSize: '0.85rem', marginTop: '12px', fontWeight: 700 }}>{error}</p>}
      </div>

      {order && (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '32px', alignItems: 'start' }}>
          
          {/* LEFT: STATUS AND MAP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Status Timeline */}
            <div style={{
              backgroundColor: '#121218',
              border: '1px solid #282838',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#ff9500', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Order: {order.shortId}</span>
                <span className="status-badge status-badge-preparing" style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#ff9500', borderColor: '#ff9500', backgroundColor: 'rgba(255, 149, 0, 0.15)', padding: '4px 10px', borderRadius: '12px', fontWeight: 800 }}>
                  {simulatedStatus.replace('_', ' ')}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
                {statusIndex === 5 ? 'Your food has arrived!' : statusIndex >= 4 ? 'Out for delivery!' : 'Preparing your delicious meal'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Estimated delivery: <strong style={{ color: 'var(--text-primary)' }}>30 - 40 mins</strong>
              </p>

              {/* Steps Graphic */}
              <div className="tracking-steps">
                <div className="tracking-bar-fill" style={{ width: `${(statusIndex / 5) * 100}%` }}></div>
                {steps.map((step, idx) => {
                  const isActive = idx === statusIndex;
                  const isCompleted = idx < statusIndex;
                  return (
                    <div key={idx} className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                      <div className="step-dot">
                        {isCompleted ? '✓' : step.icon}
                      </div>
                      <span className="step-label">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Map */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '0', overflow: 'hidden', height: '280px', position: 'relative', border: '1px solid var(--border)' }}>
              
              {/* Mock Map graphics with CSS grids */}
              <div style={{ width: '100%', height: '100%', backgroundColor: '#181818', backgroundImage: 'radial-gradient(#333333 1px, transparent 1px)', backgroundSize: '20px 20px', position: 'absolute', top: 0, left: 0 }}></div>
              
              {/* Streets layout lines */}
              <div style={{ position: 'absolute', width: '100%', height: '4px', backgroundColor: '#222222', top: '100px' }}></div>
              <div style={{ position: 'absolute', width: '100%', height: '4px', backgroundColor: '#222222', top: '200px' }}></div>
              <div style={{ position: 'absolute', width: '4px', height: '100%', backgroundColor: '#222222', left: '120px' }}></div>
              <div style={{ position: 'absolute', width: '4px', height: '100%', backgroundColor: '#222222', left: '300px' }}></div>
              
              {/* Restaurant Node */}
              <div style={{ position: 'absolute', left: '80px', top: '75px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-red)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>🍔</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '4px', marginTop: '4px' }}>Oh Richi</span>
              </div>

              {/* Destination Flag */}
              <div style={{ position: 'absolute', right: '100px', bottom: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--success)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>🚩</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '4px', marginTop: '4px' }}>You</span>
              </div>

              {/* Animated Rider icon on path */}
              {statusIndex >= 4 && statusIndex < 5 && (
                <div style={{
                  position: 'absolute',
                  fontSize: '2rem',
                  transition: 'left 8s linear, top 8s linear',
                  // animate left/top coordinates
                  left: statusIndex === 4 ? '120px' : '360px',
                  top: statusIndex === 4 ? '90px' : '170px',
                  transform: 'translate(-50%, -50%)'
                }}>
                  🛵
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: DRIVER INFO AND SUMMARY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Rider details */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '24px' }}>
              <h3 className="heading-bebas" style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', marginBottom: '16px' }}>Your Rider</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                  👨‍✈️
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>John D.</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>⭐ 4.9 Rating • Rider ID #302</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                <a href="tel:+12345" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.85rem', textDecoration: 'none', height: '36px' }}>
                  📞 Call
                </a>
                <button className="btn btn-secondary" onClick={() => alert('Support chat is initializing...')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.85rem', height: '36px' }}>
                  💬 Chat
                </button>
              </div>
            </div>

            {/* Order Items recap */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '24px' }}>
              <h3 className="heading-bebas" style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', marginBottom: '16px' }}>Items Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.orderItems?.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                    <span style={{ fontWeight: 600 }}>€{Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
                <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--accent-gold)' }}>€{Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {!order && !loading && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          🔍 Please enter an order ID to start live tracking.
        </div>
      )}
      </div>
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <CustomerLayout>
      <Suspense fallback={
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading tracking screen...
        </div>
      }>
        <TrackOrderContent />
      </Suspense>
    </CustomerLayout>
  );
}
