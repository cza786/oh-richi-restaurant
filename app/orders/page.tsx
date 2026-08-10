'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';
import Link from 'next/link';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [user, setUser] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Selected Order for Full Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCustomerOrders = async () => {
      try {
        setLoading(true);
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/customer/login');
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const allOrders = await ordersRes.json();
          // Filter orders belonging to this customer
          const customerOrders = allOrders.filter(
            (o: any) => o.customerId === userData.user.id || o.customerEmail === userData.user.email
          );
          setOrders(customerOrders);
        }
      } catch (err) {
        console.error('Error loading order history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerOrders();
  }, [router]);

  const handleOpenOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleReorder = (order: any) => {
    if (!order.orderItems || order.orderItems.length === 0) return;
    
    order.orderItems.forEach((item: any) => {
      if (item.menuItem) {
        addToCart(item.menuItem, item.quantity, {
          variation: item.variation || undefined,
          spiceLevel: item.spiceLevel || undefined,
          addons: item.orderItemAddons?.map((a: any) => a.addon).filter(Boolean) || [],
        });
      }
    });

    alert('Items from this order have been added to your cart! 🛒');
    handleCloseModal();
    router.push('/menu');
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    let bg = 'rgba(255, 149, 0, 0.15)';
    let color = '#ff9500';
    let label = status;

    if (s === 'PENDING') {
      bg = 'rgba(245, 158, 11, 0.15)';
      color = '#f59e0b';
      label = '⏳ Pending Kitchen';
    } else if (s === 'PREPARING') {
      bg = 'rgba(59, 130, 246, 0.15)';
      color = '#3b82f6';
      label = '🍳 Cooking in Kitchen';
    } else if (s === 'READY') {
      bg = 'rgba(16, 185, 129, 0.15)';
      color = '#10b981';
      label = '🔔 Ready for Pickup/Delivery';
    } else if (s === 'COMPLETED') {
      bg = 'rgba(34, 197, 94, 0.15)';
      color = '#22c55e';
      label = '✅ Completed';
    } else if (s === 'CANCELLED') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#ef4444';
      label = '❌ Cancelled';
    }

    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '20px',
        backgroundColor: bg,
        color: color,
        fontWeight: 600,
        fontSize: '0.75rem',
        display: 'inline-block',
      }}>
        {label}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return ['PENDING', 'PREPARING', 'READY'].includes(order.status);
    if (filterStatus === 'COMPLETED') return order.status === 'COMPLETED';
    if (filterStatus === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px', minHeight: '70vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 className="heading-bebas" style={{ fontSize: '2.2rem', color: 'var(--text-primary)', margin: 0 }}>
              Order History
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Tap on any order to view itemized breakdown, receipts, and track live order status.
            </p>
          </div>

          <Link href="/menu" className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem' }}>
            + Place New Order
          </Link>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'ACTIVE', label: '⚡ Live / Active' },
            { id: 'COMPLETED', label: '✅ Completed' },
            { id: 'CANCELLED', label: '❌ Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: filterStatus === tab.id ? '1px solid var(--accent-red)' : '1px solid var(--border)',
                backgroundColor: filterStatus === tab.id ? 'var(--accent-red)' : 'rgba(255,255,255,0.03)',
                color: filterStatus === tab.id ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🍔</div>
            Loading your order history...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="auth-card" style={{ maxWidth: '100%', textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No orders found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              {filterStatus === 'ALL' ? "You haven't placed any food orders yet." : `No ${filterStatus.toLowerCase()} orders.`}
            </p>
            <Link href="/menu" className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
              Browse Food Menu
            </Link>
          </div>
        ) : (
          /* ORDERS LIST - TAPPING OPENS DETAILS MODAL */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleOpenOrderDetails(order)}
                className="order-card-row"
                style={{
                  backgroundColor: 'var(--bg-primary, #121218)',
                  border: '1px solid var(--border, #2a2a38)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        Order #{order.shortId}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                      📅 {new Date(order.createdAt).toLocaleString()} • {order.orderType === 'DELIVERY' ? '🛵 Delivery' : '🛍️ Takeaway'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold, #ff9500)' }}>
                      €{Number(order.totalAmount).toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {order.orderItems?.map((item: any) => (
                      <span key={item.id} style={{ marginRight: '14px', display: 'inline-block' }}>
                        <strong style={{ color: 'white' }}>{item.quantity}x</strong> {item.menuItem?.name || 'Dish'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tap Prompt Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                  <span>👉 Tap anywhere to view full itemized receipt & order details</span>
                  <span style={{ textDecoration: 'underline', fontWeight: 600 }}>View Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- FULL ORDER DETAILS MODAL --- */}
        {isModalOpen && selectedOrder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }} onClick={handleCloseModal}>
            
            <div style={{
              backgroundColor: '#161622',
              borderRadius: '16px',
              border: '1px solid #2e2e42',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              position: 'relative',
            }} onClick={(e) => e.stopPropagation()}>

              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>

              {/* Modal Header */}
              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #2e2e42' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Order Details Breakdown
                </div>
                <h2 className="heading-bebas" style={{ fontSize: '2rem', color: 'white', margin: '4px 0 8px 0' }}>
                  Order #{selectedOrder.shortId}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {getStatusBadge(selectedOrder.status)}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📅 {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '20px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.85rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Order Type</span>
                    <strong style={{ color: 'white' }}>{selectedOrder.orderType === 'DELIVERY' ? '🛵 Delivery to Door' : '🛍️ Takeaway Pickup'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Customer Name</span>
                    <strong style={{ color: 'white' }}>{selectedOrder.customerName || selectedOrder.customerEmail || 'Guest'}</strong>
                  </div>
                  {selectedOrder.deliveryAddress && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Delivery Address</span>
                      <strong style={{ color: 'white' }}>{selectedOrder.deliveryAddress}</strong>
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Contact Phone</span>
                      <strong style={{ color: 'white' }}>{selectedOrder.customerPhone}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Order Items List */}
              <h4 className="heading-bebas" style={{ fontSize: '1.2rem', color: 'white', marginBottom: '12px' }}>
                Itemized Dishes ({selectedOrder.orderItems?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {selectedOrder.orderItems?.map((item: any) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'start',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                        {item.quantity}x {item.menuItem?.name || 'Dish'}
                      </div>
                      
                      {/* Variations & Customizations */}
                      {item.variation && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginTop: '2px' }}>
                          Size/Variation: {item.variation.name}
                        </div>
                      )}
                      {item.spiceLevel && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                          🌶️ Spice Level: {item.spiceLevel.name}
                        </div>
                      )}
                      {item.orderItemAddons && item.orderItemAddons.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Addons: {item.orderItemAddons.map((a: any) => a.addon?.name || 'Extra').join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                          Note: "{item.notes}"
                        </div>
                      )}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                      €{Number(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Summary */}
              <div style={{
                borderTop: '1px dashed #2e2e42',
                paddingTop: '14px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>€{Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                {Number(selectedOrder.deliveryFee) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Delivery Fee</span>
                    <span>€{Number(selectedOrder.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                {Number(selectedOrder.taxAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>VAT / Sales Tax</span>
                    <span>€{Number(selectedOrder.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Discounts Applied</span>
                    <span>-€{Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2e2e42' }}>
                  <span>TOTAL PAID</span>
                  <span>€{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    handleCloseModal();
                    router.push(`/track-order?shortId=${selectedOrder.shortId}`);
                  }}
                  style={{ padding: '10px', fontSize: '0.85rem' }}
                >
                  📍 Track Live Order
                </button>
                
                <button
                  className="btn btn-primary"
                  onClick={() => handleReorder(selectedOrder)}
                  style={{ padding: '10px', fontSize: '0.85rem' }}
                >
                  🛒 Re-Order All Items
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  );
}
