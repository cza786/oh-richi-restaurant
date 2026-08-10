'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'payments'>('overview');
  const [user, setUser] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Address inputs
  const [addresses, setAddresses] = useState([
    { id: '1', name: 'Home', address: '123 Via Roma, Rome, RM 00100' },
    { id: '2', name: 'Work', address: '456 Via Nazionale, Rome, RM 00120' }
  ]);

  // Payment mock cards
  const [cards, setCards] = useState([
    { id: '1', brand: 'Visa', last4: '4242', exp: '12/28' }
  ]);

  useEffect(() => {
    // Authenticate and fetch details
    const loadSessionData = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/customer/login');
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch loyalty point balance
        const loyaltyRes = await fetch('/api/loyalty/me');
        if (loyaltyRes.ok) {
          const loyaltyData = await loyaltyRes.json();
          setLoyalty(loyaltyData);
        }

        // Fetch past orders
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const allOrders = await ordersRes.json();
          // Filter orders for this customer
          const customerOrders = allOrders.filter((o: any) => o.customerId === userData.user.id);
          setOrders(customerOrders);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'status-badge-pending';
      case 'PREPARING': return 'status-badge-preparing';
      case 'READY': return 'status-badge-ready';
      case 'COMPLETED': return 'status-badge-completed';
      case 'CANCELLED': return 'status-badge-cancelled';
      default: return 'status-badge-pending';
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your profile...
        </div>
      </CustomerLayout>
    );
  }

  if (!user) return null;

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
        
        {/* Profile Summary Header */}
        <div className="auth-card" style={{ maxWidth: '100%', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="heading-bebas" style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>Member since July 2026 • {user.email}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loyalty Balance</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{loyalty?.currentPoints || 0} pts</p>
          </div>
        </div>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* SIDE TAB BAR */}
          <div className="auth-card" style={{ maxWidth: '100%', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className={`account-menu-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              📊 Overview
            </button>
            <button className={`account-menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              📦 My Orders
            </button>
            <button className={`account-menu-item ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              📍 Saved Addresses
            </button>
            <button className={`account-menu-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              💳 Payment Methods
            </button>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '8px 0' }} />
            <button className="account-menu-item" onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--accent-red)' }}>
              🚪 Sign Out
            </button>
          </div>

          {/* RIGHT COLUMN: CONTENTS */}
          <div className="auth-card" style={{ maxWidth: '100%', padding: '32px' }}>
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <h3 className="heading-bebas" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)', marginBottom: '20px' }}>Account Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points Balance</span>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{loyalty?.currentPoints || 0}</p>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Orders</span>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{orders.length}</p>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saved Locations</span>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{addresses.length}</p>
                  </div>
                </div>

                <h4 className="heading-bebas" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Recent Order Activity</h4>
                {orders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You haven't placed any orders yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Order #{order.shortId}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                            {new Date(order.createdAt).toLocaleDateString()} • {order.orderItems.length} items
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            €{Number(order.totalAmount).toFixed(2)}
                          </span>
                          <button className="btn btn-secondary" onClick={() => router.push(`/track-order?shortId=${order.shortId}`)} style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', height: '30px' }}>
                            Track
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="heading-bebas" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}>My Orders ({orders.length})</h3>
                  <button className="btn btn-primary" onClick={() => router.push('/orders')} style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}>
                    View Full Order History Screen →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You have no orders yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        onClick={() => router.push('/orders')}
                        style={{ 
                          backgroundColor: 'var(--bg-primary)', 
                          padding: '20px', 
                          borderRadius: '10px', 
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>Order #{order.shortId}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                              Placed on {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge ${getStatusClass(order.status)}`} style={{ display: 'inline-block' }}>
                              {order.status}
                            </span>
                            <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '4px', color: 'var(--accent-gold)' }}>
                              €{Number(order.totalAmount).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                          {order.orderItems.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <span>{item.quantity}x {item.menuItem?.name || 'Menu Item'}</span>
                              <span>€{Number(item.subtotal).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>👉 Tap to see full itemized receipt & breakdown</span>
                          <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); router.push(`/track-order?shortId=${order.shortId}`); }} style={{ width: 'auto', padding: '8px 20px', fontSize: '0.8rem', height: '36px' }}>
                            Track Status
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="heading-bebas" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}>Saved Addresses</h3>
                  <button className="btn btn-primary" onClick={() => alert('New address creation is mock in this preview.')} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem', height: '34px' }}>
                    + Add New
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {addresses.map((addr) => (
                    <div key={addr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{addr.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{addr.address}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="remove-item-btn" onClick={() => alert('Address modification is simulated.')} style={{ margin: 0 }}>Edit</button>
                        <button className="remove-item-btn" onClick={() => setAddresses(addresses.filter(a => a.id !== addr.id))} style={{ margin: 0, color: 'var(--accent-red)' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="heading-bebas" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}>Payment Methods</h3>
                  <button className="btn btn-primary" onClick={() => alert('New card linkage is mock in this preview.')} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem', height: '34px' }}>
                    + Add New
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cards.map((card) => (
                    <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '1.8rem' }}>💳</span>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{card.brand} ending in •••• {card.last4}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>Expires {card.exp}</p>
                        </div>
                      </div>
                      <button className="remove-item-btn" onClick={() => setCards(cards.filter(c => c.id !== card.id))} style={{ margin: 0, color: 'var(--accent-red)' }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </CustomerLayout>
  );
}
