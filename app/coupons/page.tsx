'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minimumOrderAmount: number;
  endDate: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
}

export default function CouponsPage() {
  const router = useRouter();
  const { applyCouponCode } = useCart();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'happy_hour'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const couponsRes = await fetch('/api/coupons');
        if (couponsRes.ok) {
          const couponsData = await couponsRes.json();
          setCoupons(couponsData);
        }

        const promosRes = await fetch('/api/promotions');
        if (promosRes.ok) {
          const promosData = await promosRes.json();
          setPromotions(promosData);
        }
      } catch (err) {
        console.error('Error fetching coupon data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApplyCoupon = async (code: string) => {
    const result = await applyCouponCode(code);
    if (result.success) {
      alert(`Coupon code ${code} successfully applied to your cart!`);
      router.push('/');
    } else {
      alert(result.error || 'Failed to apply coupon. Check order subtotal limits.');
    }
  };

  const isPromotionActiveNow = (promo: Promotion) => {
    // Simple mock active logic: check if today is in dayOfWeek, and time is inside range
    const now = new Date();
    const days = promo.daysOfWeek.toLowerCase();
    const todayName = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (!days.includes(todayName)) return false;

    const timeString = now.toTimeString().substring(0, 5); // "HH:MM"
    return timeString >= promo.startTime && timeString <= promo.endTime;
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
        
        {/* Banner Header */}
        <div className="cust-hero" style={{ padding: '60px 24px', borderRadius: '16px', backgroundPosition: 'center 40%', marginBottom: '40px' }}>
          <p className="hero-tag">EXCLUSIVE CLUB OFFERS</p>
          <h1 className="hero-title heading-bebas" style={{ fontSize: '3rem' }}>Coupons & Promotions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>Save big on your gourmet burger cravings with active discount schemes</p>
        </div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
          <button
            className={`cust-nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{ fontSize: '1.1rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '12px', marginRight: '32px' }}
          >
            All Coupons ({coupons.length})
          </button>
          <button
            className={`cust-nav-link ${activeTab === 'happy_hour' ? 'active' : ''}`}
            onClick={() => setActiveTab('happy_hour')}
            style={{ fontSize: '1.1rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '12px' }}
          >
            Happy Hour Deals ({promotions.length})
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading offers...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* TABS CONTENT: ALL COUPONS */}
            {activeTab === 'all' && (
              <div className="grid-2 fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {coupons.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', gridColumn: 'span 2' }}>No coupons available right now.</p>
                ) : (
                  coupons.map((coupon) => (
                    <div className="auth-card" key={coupon.id} style={{ maxWidth: '100%', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-gold)' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                            {coupon.discountType === 'percentage_discount' ? `${Number(coupon.discountValue)}% OFF` : `€${Number(coupon.discountValue)} OFF`}
                          </span>
                          <span className="status-badge" style={{ backgroundColor: 'rgba(214, 168, 79, 0.1)', color: 'var(--accent-gold)', borderColor: 'rgba(214, 168, 79, 0.2)' }}>
                            CODE: {coupon.code}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{coupon.name}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>{coupon.description}</p>
                        
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                          <span>• Min order: €{Number(coupon.minimumOrderAmount).toFixed(2)}</span>
                          <span>• Valid until: {new Date(coupon.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button className="btn btn-primary" onClick={() => handleApplyCoupon(coupon.code)}>
                        Apply to Order
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TABS CONTENT: HAPPY HOUR DEALS */}
            {activeTab === 'happy_hour' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {promotions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No happy hour deals scheduled.</p>
                ) : (
                  promotions.map((promo) => {
                    const isActive = isPromotionActiveNow(promo);
                    return (
                      <div className="auth-card" key={promo.id} style={{ maxWidth: '100%', padding: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', borderLeft: '4px solid var(--accent-red)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{promo.name}</h4>
                            <span className="status-badge" style={{
                              backgroundColor: isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                              color: isActive ? 'var(--success)' : 'var(--text-muted)',
                              borderColor: isActive ? 'rgba(34, 197, 94, 0.2)' : 'var(--border)'
                            }}>
                              {isActive ? '● Active Now' : 'Scheduled'}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>{promo.description}</p>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                            <span>⏰ Timing: <strong>{promo.startTime} - {promo.endTime} UTC</strong></span>
                            <span>📅 Days: <strong>{promo.daysOfWeek}</strong></span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-red-bright)', display: 'block' }}>
                            {Number(promo.discountValue)}% OFF
                          </span>
                          <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ marginTop: '12px', width: 'auto', padding: '0 20px', height: '36px', fontSize: '0.8rem' }}>
                            Order Now
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </CustomerLayout>
  );
}
