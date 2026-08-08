'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('today');

  // Orders from database
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Drawer state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Fetch orders from database
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        // Sync selected order details if open
        if (selectedOrder) {
          const fresh = data.find((o: any) => o.id === selectedOrder.id);
          if (fresh) setSelectedOrder(fresh);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handler to update order status in DB
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev: any[]) => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === id) {
          setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
        // If status completed, refetch to sync dynamic points balance
        if (newStatus === 'COMPLETED') fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler to mark paid in DB
  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus: 'PAID' }),
      });
      if (res.ok) {
        setOrders((prev: any[]) => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID' } : o));
        if (selectedOrder?.id === id) {
          setSelectedOrder((prev: any) => prev ? { ...prev, paymentStatus: 'PAID' } : null);
        }
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler to apply reward voucher
  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !voucherCodeInput) return;

    try {
      setApplyingVoucher(true);
      const res = await fetch('/api/rewards/apply-to-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          redemptionCode: voucherCodeInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Success! Discount of €${data.discountApplied.toFixed(2)} applied.`);
        setVoucherCodeInput('');
        fetchOrders();
      } else {
        alert(data.error || 'Invalid or expired code.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Handler to remove applied reward voucher
  const handleCancelVoucher = async () => {
    if (!selectedOrder || !selectedOrder.rewardRedemptionId) return;

    try {
      setApplyingVoucher(true);
      const res = await fetch('/api/rewards/cancel-redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redemptionId: selectedOrder.rewardRedemptionId,
        }),
      });

      if (res.ok) {
        alert('Reward voucher removed and points returned to customer.');
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || 'Removal failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Get filtered orders
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ALL') return true;
    if (['DELIVERY', 'TAKEAWAY'].includes(activeTab)) return order.orderType === activeTab;
    return order.status === activeTab;
  });

  // Count summaries
  const totalCount = orders.length;
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const acceptedCount = orders.filter(o => o.status === 'ACCEPTED').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;
  const payPendingCount = orders.filter(o => o.paymentStatus === 'PENDING').length;

  return (
    <DashboardLayout dateFilter={dateFilter} setDateFilter={setDateFilter}>
      {/* Title Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Orders Management
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          View live client receipts, dispatch kitchen preparations, and apply customer loyalty rewards.
        </p>
      </div>

      {/* Summary Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-title" style={{ fontSize: '0.65rem' }}>Total Orders</div>
          <div className="stat-value" style={{ fontSize: '1.6rem' }}>{totalCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-title" style={{ fontSize: '0.65rem' }}>Pending</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--warning)' }}>{pendingCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-title" style={{ fontSize: '0.65rem' }}>Accepted</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--info)' }}>{acceptedCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-title" style={{ fontSize: '0.65rem' }}>Preparing</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--accent-red-bright)' }}>{preparingCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-title" style={{ fontSize: '0.65rem' }}>Ready</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--success)' }}>{readyCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-title" style={{ fontSize: '0.65rem' }}>Completed</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--success)' }}>{completedCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-title" style={{ fontSize: '0.65rem' }}>Pay Pending</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--warning)' }}>{payPendingCount}</div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="dashboard-card" style={{ padding: '12px', marginBottom: '20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', minWidth: '850px' }}>
          {[
            { label: 'All Orders', value: 'ALL' },
            { label: 'Delivery', value: 'DELIVERY' },
            { label: 'Take-away', value: 'TAKEAWAY' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Accepted', value: 'ACCEPTED' },
            { label: 'Preparing', value: 'PREPARING' },
            { label: 'Ready', value: 'READY' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                backgroundColor: activeTab === tab.value ? 'var(--accent-red)' : '#111',
                color: activeTab === tab.value ? 'var(--text-primary)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: selectedOrder ? '2fr 1.2fr' : '1fr', alignItems: 'start', transition: 'all 0.3s ease' }}>
        
        {/* Orders Table Card */}
        <div className="dashboard-card" style={{ padding: '24px', marginBottom: '0' }}>
          {loading && orders.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading live orders from PostgreSQL...
            </div>
          ) : (
            <div className="pos-table-wrapper">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer Name</th>
                    <th>Order Type</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Order Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No orders matching this filter tab.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const itemsCount = order.orderItems?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                      return (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          style={{ cursor: 'pointer', backgroundColor: selectedOrder?.id === order.id ? '#1a1a1a' : 'transparent' }}
                        >
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{order.shortId}</td>
                          <td style={{ fontWeight: 500 }}>{order.customerName || 'Walk-in Customer'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.orderType}</td>
                          <td>{itemsCount} items</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>€{order.totalAmount.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${
                              order.paymentStatus === 'PAID' ? 'status-badge-ready' : 
                              order.paymentStatus === 'PENDING' ? 'status-badge-pending' : 'status-badge-cancelled'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-badge-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {order.status === 'PENDING' && (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}
                                  onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                                >
                                  Accept
                                </button>
                              )}
                              {order.status === 'ACCEPTED' && (
                                <button 
                                  className="btn" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: '#e53e3e', color: 'white' }}
                                  onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                >
                                  Prepare
                                </button>
                              )}
                              {order.status === 'PREPARING' && (
                                <button 
                                  className="btn" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'var(--success)', color: 'white' }}
                                  onClick={() => handleUpdateStatus(order.id, 'READY')}
                                >
                                  Ready
                                </button>
                              )}
                              {order.status === 'READY' && (
                                <button 
                                  className="btn" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'var(--accent-gold)', color: 'black' }}
                                  onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                                >
                                  Complete
                                </button>
                              )}
                              {order.paymentStatus === 'PENDING' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}
                                  onClick={() => handleMarkPaid(order.id)}
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* POS Detail Panel Drawer */}
        {selectedOrder && (
          <div className="dashboard-card" style={{ padding: '24px', borderLeft: '2px solid var(--accent-red)', marginBottom: '0' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 className="heading-bebas" style={{ fontSize: '1.4rem' }}>Receipt Detail: #{selectedOrder.shortId}</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Customer & Location Info Box */}
            <div style={{
              backgroundColor: '#111116',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📍 {selectedOrder.orderType} ORDER
                </span>
                {selectedOrder.table ? (
                  <span className="status-badge status-badge-ready">Table {selectedOrder.table.tableNumber}</span>
                ) : null}
              </div>

              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                👤 {selectedOrder.customerName || 'Walk-in Customer'}
                {selectedOrder.customerPhone && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '8px' }}>({selectedOrder.customerPhone})</span>}
              </div>

              {selectedOrder.customerEmail && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  ✉️ {selectedOrder.customerEmail}
                </div>
              )}

              {selectedOrder.orderType === 'DELIVERY' && selectedOrder.deliveryAddress && (
                <div style={{
                  marginTop: '4px',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border)',
                  color: 'var(--accent-gold)',
                  fontWeight: 500,
                }}>
                  <div>🏠 <strong>Delivery Address:</strong></div>
                  <div style={{ color: '#fff', marginTop: '2px' }}>{selectedOrder.deliveryAddress}</div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.deliveryAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      color: 'var(--info)',
                      fontSize: '0.75rem',
                      textDecoration: 'underline'
                    }}
                  >
                    🗺️ Open in Google Maps ↗
                  </a>
                </div>
              )}

              {selectedOrder.orderType === 'TAKEAWAY' && (
                <div style={{ color: 'var(--info)', marginTop: '4px', fontSize: '0.75rem' }}>
                  🛍️ {selectedOrder.deliveryAddress ? `Branch: ${selectedOrder.deliveryAddress}` : 'Pickup Order'}
                </div>
              )}
            </div>

            {/* Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px dashed var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
              {selectedOrder.orderItems?.map((item: any, idx: number) => (
                <div key={idx} className="flex-between" style={{ fontSize: '0.85rem' }}>
                  <span>{item.quantity}x {item.menuItem?.name}</span>
                  <span style={{ fontWeight: 600 }}>€{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Loyalty point calculator status */}
            {selectedOrder.customerId && (
              <div 
                style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(215, 25, 32, 0.05)', 
                  border: '1px solid rgba(215, 25, 32, 0.2)', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>⭐</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Customer Loyalty Registered
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                    Will earn **+{Math.floor(selectedOrder.subtotal - selectedOrder.discountAmount)} points** on completion.
                  </div>
                </div>
              </div>
            )}

            {/* Loyalty Rewards voucher verification */}
            {selectedOrder.paymentStatus === 'PENDING' && (
              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 className="heading-bebas" style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Apply Reward Voucher</h4>
                
                {selectedOrder.rewardRedemptionId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold' }}>
                      ✓ Reward Applied (-€{selectedOrder.rewardDiscountAmount.toFixed(2)})
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-red)' }} 
                      disabled={applyingVoucher}
                      onClick={handleCancelVoucher}
                    >
                      Remove Reward
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyVoucher} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. RWD-1048" 
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value)}
                      required
                      style={{ padding: '8px', fontSize: '0.8rem' }}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ width: 'auto', padding: '0 16px', fontSize: '0.75rem' }}
                      disabled={applyingVoucher}
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Totals Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>€{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex-between" style={{ color: 'var(--success)' }}>
                  <span>Reward Discount</span>
                  <span>-€{selectedOrder.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)' }}>Tax Amount</span>
                <span>€{selectedOrder.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex-between" style={{ fontWeight: 'bold', fontSize: '1.05rem', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                <span>TOTAL</span>
                <span style={{ color: 'var(--accent-gold)' }}>€{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
