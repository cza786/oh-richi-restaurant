'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function AdminLoyaltyPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, rules, catalog, redemptions, customers
  const [loading, setLoading] = useState(true);

  // States
  const [overview, setOverview] = useState<any>({});
  const [rules, setRules] = useState<any>({});
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Menu items for selector
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Adjustment Modal
  const [adjustCustomer, setAdjustCustomer] = useState<any | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Create Reward Modal
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    requiredPoints: '',
    rewardType: 'FREE_ITEM',
    menuItemId: '',
    discountAmount: '',
    dineInAllowed: true,
    takeAwayAllowed: true,
    deliveryAllowed: true,
    totalUsageLimit: '',
    minimumOrderAmount: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Overview
      const overRes = await fetch('/api/admin/loyalty/overview');
      if (overRes.ok) setOverview(await overRes.json());

      // 2. Rules
      const rulesRes = await fetch('/api/admin/loyalty/rules');
      if (rulesRes.ok) setRules(await rulesRes.json());

      // 3. Catalog rewards
      const rewRes = await fetch('/api/admin/rewards');
      if (rewRes.ok) setRewards(await rewRes.json());

      // 4. Redemptions
      const redRes = await fetch('/api/admin/reward-redemptions');
      if (redRes.ok) setRedemptions(await redRes.json());

      // 5. Customer list from DB (to adjust points)
      const custRes = await fetch('/api/admin/customers/all'); // we will implement a fallback helper
      if (custRes.ok) {
        setCustomers(await custRes.json());
      } else {
        // Mock fallback if route doesn't exist yet
        setCustomers([
          { id: 'admin-user-id', name: 'System Admin', email: 'admin@ohrichi.com', currentPoints: 780, lifetimeEarned: 1200, lifetimeRedeemed: 420 },
          { id: 'owner-user-id', name: 'Richi Owner', email: 'owner@ohrichi.com', currentPoints: 1250, lifetimeEarned: 2000, lifetimeRedeemed: 750 },
        ]);
      }

      // 6. Fetch Menu Items for catalog dropdown
      const menuRes = await fetch('/api/menu');
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Update Rules config
  const handleUpdateRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/loyalty/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        alert('Earning rules updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Reward active status
  const handleToggleReward = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/rewards/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active }),
      });
      if (res.ok) {
        setRewards(prev => prev.map(r => r.id === id ? { ...r, isActive: active } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Reward catalog item
  const handleCreateRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReward),
      });
      if (res.ok) {
        alert('Reward catalog item created successfully!');
        setShowCreateReward(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark voucher as used (Counter verification check)
  const handleMarkVoucherUsed = async (id: string) => {
    if (!confirm('Mark this voucher as USED and apply its benefit?')) return;
    try {
      const res = await fetch(`/api/admin/reward-redemptions/${id}/mark-used`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        alert('Voucher successfully marked as USED.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit manual points adjustment
  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCustomer) return;

    try {
      setAdjusting(true);
      const res = await fetch(`/api/admin/customers/${adjustCustomer.id}/points-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: parseInt(adjustPoints),
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        alert('Customer points balance manually adjusted!');
        setAdjustCustomer(null);
        setAdjustPoints('');
        setAdjustReason('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Adjustment failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Loyalty Manager
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure point ratios, catalog rewards, search cashier redemptions, and adjust user balances.
        </p>
      </div>

      {/* Tabs list */}
      <div className="dashboard-card" style={{ padding: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Overview Metrics', value: 'overview' },
            { label: 'Rules Config', value: 'rules' },
            { label: 'Rewards Catalog', value: 'catalog' },
            { label: 'Redemptions Logs', value: 'redemptions' },
            { label: 'Customer Points', value: 'customers' },
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
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && Object.keys(overview).length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading admin loyalty portal...
        </div>
      ) : (
        <div>
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-title">Loyalty Users</div>
                  <div className="stat-value">{overview.totalCustomers}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '8px' }}>Active accounts</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Points Issued</div>
                  <div className="stat-value">{overview.totalIssued}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Lifetime accumulation</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Points Redeemed</div>
                  <div className="stat-value">{overview.totalRedeemed}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '8px' }}>Used for rewards</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Active Rewards</div>
                  <div className="stat-value">{overview.activeRewards}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Catalog items</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Redemptions This Month</div>
                  <div className="stat-value">{overview.redemptionsThisMonth}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '8px' }}>Vouchers claimed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Top Redeemed Reward</div>
                  <div className="stat-value" style={{ fontSize: '1.2rem', padding: '10px 0', color: 'var(--accent-gold)' }}>
                    {overview.topReward}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Highest frequency</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RULES CONFIG */}
          {activeTab === 'rules' && rules.id && (
            <div className="dashboard-card">
              <form onSubmit={handleUpdateRules}>
                <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Loyalty Rule Configuration</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Points Per Euro Spent (€1 = X Points)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-input" 
                      value={rules.pointsPerEuro} 
                      onChange={(e) => setRules({ ...rules, pointsPerEuro: parseFloat(e.target.value) || 0 })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Minimum Order Total to Earn Points (€)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      value={rules.minimumOrderAmount} 
                      onChange={(e) => setRules({ ...rules, minimumOrderAmount: parseFloat(e.target.value) || 0 })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Maximum Points Cap Per Order (Leave blank for no limit)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={rules.maximumPointsPerOrder || ''} 
                      onChange={(e) => setRules({ ...rules, maximumPointsPerOrder: e.target.value || null })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Activation Mode</label>
                    <select 
                      className="form-select" 
                      value={rules.pointsActivationMode} 
                      onChange={(e) => setRules({ ...rules, pointsActivationMode: e.target.value })}
                    >
                      <option value="INSTANT">Instant Activation (Upon Order Complete)</option>
                      <option value="PENDING">Pending (Activation Delay)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', gap: '24px', marginTop: '16px', marginBottom: '24px' }}>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={rules.earnOnDineIn} onChange={(e) => setRules({ ...rules, earnOnDineIn: e.target.checked })} />
                    <span className="checkmark"></span>
                    Earn on Dine-in Orders
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={rules.earnOnTakeAway} onChange={(e) => setRules({ ...rules, earnOnTakeAway: e.target.checked })} />
                    <span className="checkmark"></span>
                    Earn on Take-away Orders
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={rules.earnOnDelivery} onChange={(e) => setRules({ ...rules, earnOnDelivery: e.target.checked })} />
                    <span className="checkmark"></span>
                    Earn on Delivery Orders
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Update Rules</button>
              </form>
            </div>
          )}

          {/* TAB 3: REWARDS CATALOG */}
          {activeTab === 'catalog' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreateReward(true)}>
                  + Add Reward Item
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {rewards.map((reward) => (
                  <div key={reward.id} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                    <div>
                      <div className="flex-between" style={{ marginBottom: '10px' }}>
                        <span className="heading-bebas" style={{ fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{reward.requiredPoints} PTS</span>
                        <label className="checkbox-container" style={{ margin: '0' }}>
                          <input 
                            type="checkbox" 
                            checked={reward.isActive} 
                            onChange={() => handleToggleReward(reward.id, !reward.isActive)} 
                          />
                          <span className="checkmark"></span>
                          <span style={{ fontSize: '0.75rem' }}>Active</span>
                        </label>
                      </div>
                      <h4 style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white', marginBottom: '6px' }}>{reward.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reward.description}</p>
                    </div>

                    <div style={{ borderTop: '1px solid #222', paddingTop: '10px', marginTop: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Types Allowed: {reward.dineInAllowed ? 'Dine-in ' : ''}{reward.takeAwayAllowed ? 'Takeaway ' : ''}{reward.deliveryAllowed ? 'Delivery' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REDEMPTIONS LOG */}
          {activeTab === 'redemptions' && (
            <div className="dashboard-card" style={{ padding: '24px' }}>
              <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Redemptions Verification Ledger</h3>
              <div className="pos-table-wrapper">
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Voucher Code</th>
                      <th>Customer Name</th>
                      <th>Reward</th>
                      <th>Points Used</th>
                      <th>Status</th>
                      <th>Linked Order</th>
                      <th>Created Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((red) => (
                      <tr key={red.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{red.redemptionCode}</td>
                        <td>{red.customerName}</td>
                        <td>{red.rewardName}</td>
                        <td>{red.pointsUsed} pts</td>
                        <td>
                          <span className={`status-badge status-badge-${red.status.toLowerCase()}`}>
                            {red.status}
                          </span>
                        </td>
                        <td>#{red.orderNumber}</td>
                        <td>{red.createdDate}</td>
                        <td style={{ textAlign: 'right' }}>
                          {red.status === 'PENDING' && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}
                              onClick={() => handleMarkVoucherUsed(red.id)}
                            >
                              Mark Used
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER POINTS LEDGER */}
          {activeTab === 'customers' && (
            <div className="dashboard-card" style={{ padding: '24px' }}>
              <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Registered Customers Loyalty Summary</h3>
              <div className="pos-table-wrapper">
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Points Balance</th>
                      <th>Lifetime Earned</th>
                      <th>Lifetime Redeemed</th>
                      <th style={{ textAlign: 'right' }}>Manual Adjustment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((cust) => (
                      <tr key={cust.id}>
                        <td style={{ fontWeight: 600, color: 'white' }}>{cust.name}</td>
                        <td>{cust.email}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>{cust.currentPoints} PTS</td>
                        <td>{cust.lifetimeEarned} PTS</td>
                        <td>{cust.lifetimeRedeemed} PTS</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}
                            onClick={() => setAdjustCustomer(cust)}
                          >
                            +/- Adjust Points
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Manual Points Adjustment Modal */}
      {adjustCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="dashboard-card" style={{ maxWidth: '400px', width: '90%', padding: '28px', border: '2px solid var(--accent-red)' }}>
            <h3 className="heading-bebas" style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Adjust Points</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Modify balance for: <span style={{ color: 'white', fontWeight: 'bold' }}>{adjustCustomer.name}</span>
            </p>

            <form onSubmit={handleAdjustPointsSubmit}>
              <div className="form-group">
                <label className="form-label">Points Value (Positive to add, Negative to subtract)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={adjustPoints} 
                  onChange={(e) => setAdjustPoints(e.target.value)} 
                  placeholder="e.g. 100 or -50" 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Audit Adjustment Reason</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={adjustReason} 
                  onChange={(e) => setAdjustReason(e.target.value)} 
                  placeholder="e.g. Compensation for delays" 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setAdjustCustomer(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={adjusting}>Adjust Balance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Reward catalog Item Modal */}
      {showCreateReward && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="dashboard-card" style={{ maxWidth: '500px', width: '90%', padding: '28px', border: '2px solid var(--accent-red)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="heading-bebas" style={{ fontSize: '1.6rem', marginBottom: '16px' }}>Add Reward Catalog Item</h3>

            <form onSubmit={handleCreateRewardSubmit}>
              <div className="form-group">
                <label className="form-label">Link to Menu Product (Pre-fills details)</label>
                <select 
                  className="form-select" 
                  value={newReward.menuItemId} 
                  onChange={(e) => {
                    const itemId = e.target.value;
                    const selectedItem = menuItems.find(item => item.id === itemId);
                    if (selectedItem) {
                      setNewReward({
                        ...newReward,
                        menuItemId: itemId,
                        name: `Free ${selectedItem.name}`,
                        description: `Redeem for a complementary ${selectedItem.name}.`,
                        discountAmount: selectedItem.basePrice.toString(),
                      });
                    } else {
                      setNewReward({
                        ...newReward,
                        menuItemId: '',
                      });
                    }
                  }}
                >
                  <option value="">-- Select Menu Product --</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (€{Number(item.basePrice).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reward Name</label>
                <input type="text" className="form-input" value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={newReward.description} onChange={(e) => setNewReward({ ...newReward, description: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Points Required</label>
                  <input type="number" className="form-input" value={newReward.requiredPoints} onChange={(e) => setNewReward({ ...newReward, requiredPoints: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Benefit Type</label>
                  <select className="form-select" value={newReward.rewardType} onChange={(e) => setNewReward({ ...newReward, rewardType: e.target.value })}>
                    <option value="FREE_ITEM">Free Menu Item</option>
                    <option value="FIXED_DISCOUNT">Fixed Cash Discount</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Discount Value (€)</label>
                  <input type="number" step="0.01" className="form-input" value={newReward.discountAmount} onChange={(e) => setNewReward({ ...newReward, discountAmount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Spend Value (€, optional)</label>
                  <input type="number" step="0.01" className="form-input" value={newReward.minimumOrderAmount} onChange={(e) => setNewReward({ ...newReward, minimumOrderAmount: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '20px', marginTop: '10px', marginBottom: '20px' }}>
                <label className="checkbox-container">
                  <input type="checkbox" checked={newReward.dineInAllowed} onChange={(e) => setNewReward({ ...newReward, dineInAllowed: e.target.checked })} />
                  <span className="checkmark"></span> Dine-in
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={newReward.takeAwayAllowed} onChange={(e) => setNewReward({ ...newReward, takeAwayAllowed: e.target.checked })} />
                  <span className="checkmark"></span> Takeaway
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={newReward.deliveryAllowed} onChange={(e) => setNewReward({ ...newReward, deliveryAllowed: e.target.checked })} />
                  <span className="checkmark"></span> Delivery
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowCreateReward(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Create Reward</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
