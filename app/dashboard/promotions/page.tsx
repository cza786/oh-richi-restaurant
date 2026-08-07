'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, coupons, happyhours, rules, usage, reports, settings
  const [loading, setLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState<any>({});
  const [coupons, setCoupons] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [usages, setUsages] = useState<any[]>([]);
  const [reports, setReports] = useState<any>({});
  const [settings, setSettings] = useState<any>({});
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Filters
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState('all');
  const [couponTypeFilter, setCouponTypeFilter] = useState('all');
  const [promoStatusFilter, setPromoStatusFilter] = useState('all');

  // Modals
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);

  // Form states - Coupon
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage_discount',
    discountValue: '',
    maxDiscountAmount: '',
    minimumOrderAmount: '0',
    freeMenuItemId: '',
    startDate: '',
    endDate: '',
    dineInAllowed: true,
    takeAwayAllowed: true,
    guestAllowed: true,
    registeredOnly: false,
    firstOrderOnly: false,
    totalUsageLimit: '',
    perCustomerUsageLimit: '',
    canCombineWithPromotions: false,
    canCombineWithRewards: false,
    applyOnOriginalSubtotal: true,
    isActive: true,
  });

  // Form states - Happy Hour
  const [promoForm, setPromoForm] = useState({
    name: '',
    description: '',
    discountType: 'percentage_discount',
    discountValue: '',
    maxDiscountAmount: '',
    minimumOrderAmount: '0',
    startDate: '',
    endDate: '',
    startTime: '15:00',
    endTime: '18:00',
    timezone: 'UTC',
    daysOfWeek: [] as string[],
    dineInAllowed: true,
    takeAwayAllowed: true,
    appliesTo: 'ALL',
    priority: '0',
    conflictStrategy: 'highest_discount_wins',
    totalUsageLimit: '',
    perCustomerUsageLimit: '',
    canCombineWithCoupons: false,
    canCombineWithRewards: false,
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Overview stats
      const overRes = await fetch('/api/admin/discounts/overview');
      if (overRes.ok) setOverview(await overRes.json());

      // Coupons list
      const coupRes = await fetch('/api/admin/coupons');
      if (coupRes.ok) setCoupons(await coupRes.json());

      // Promotions Happy hours
      const promoRes = await fetch('/api/admin/promotions');
      if (promoRes.ok) setPromotions(await promoRes.json());

      // Usages ledger
      const usageRes = await fetch('/api/admin/discounts/usage');
      if (usageRes.ok) setUsages(await usageRes.json());

      // Reports summary
      const repRes = await fetch('/api/admin/discounts/reports');
      if (repRes.ok) setReports(await repRes.json());

      // Settings configs
      const setRes = await fetch('/api/admin/discounts/settings');
      if (setRes.ok) setSettings(await setRes.json());

      // Menu Items for pre-fills / linkages
      const menuRes = await fetch('/api/menu');
      if (menuRes.ok) setMenuItems(await menuRes.json());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Extract unique categories from menu items
  const uniqueCategories = Array.from(
    new Set(menuItems.map((item) => item.category?.name).filter(Boolean))
  );

  // Trigger Coupon Creation
  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (couponForm.discountType === 'percentage_discount' && Number(couponForm.discountValue) > 100) {
      alert('Validation Error: Percentage discount cannot exceed 100%');
      return;
    }
    if (new Date(couponForm.startDate) > new Date(couponForm.endDate)) {
      alert('Validation Error: End date cannot be before start date');
      return;
    }
    if (Number(couponForm.discountValue) < 0 || Number(couponForm.minimumOrderAmount) < 0) {
      alert('Validation Error: Discount value and minimum order amount must be greater than or equal to 0');
      return;
    }

    try {
      const endpoint = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm),
      });

      if (res.ok) {
        alert(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
        setShowCreateCoupon(false);
        setEditingCoupon(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Promotion Happy Hour creation
  const handleCreatePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (promoForm.daysOfWeek.length === 0) {
      alert('Validation Error: Please select at least one day of the week');
      return;
    }
    if (new Date(promoForm.startDate) > new Date(promoForm.endDate)) {
      alert('Validation Error: End date cannot be before start date');
      return;
    }

    const payload = {
      ...promoForm,
      daysOfWeek: promoForm.daysOfWeek.join(','),
    };

    try {
      const endpoint = editingPromo ? `/api/admin/promotions/${editingPromo.id}` : '/api/admin/promotions';
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(editingPromo ? 'Promotion updated successfully!' : 'Promotion created successfully!');
        setShowCreatePromo(false);
        setEditingPromo(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Coupon Active Status
  const handleToggleCouponActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active }),
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: active } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Promotion Active Status
  const handleTogglePromoActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active }),
      });
      if (res.ok) {
        setPromotions(prev => prev.map(p => p.id === id ? { ...p, isActive: active } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate Coupon
  const handleDuplicateCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Coupon cloned successfully (saved as draft)');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate Promotion Happy hour
  const handleDuplicatePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Promotion cloned successfully (saved as draft)');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon code?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Coupon deleted.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Promotion
  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Happy-Hour promotion?')) return;
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Promotion deleted.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings Config
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/discounts/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Global discount combination rules saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Coupons
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(couponSearch.toLowerCase()) || c.name.toLowerCase().includes(couponSearch.toLowerCase());
    
    // Status checking
    const isExpired = new Date(c.endDate) < new Date();
    const isScheduled = new Date(c.startDate) > new Date();
    const isActive = c.isActive && !isExpired && !isScheduled;
    const isInactive = !c.isActive;

    let matchesStatus = true;
    if (couponStatusFilter === 'active') matchesStatus = isActive;
    else if (couponStatusFilter === 'scheduled') matchesStatus = isScheduled;
    else if (couponStatusFilter === 'expired') matchesStatus = isExpired;
    else if (couponStatusFilter === 'inactive') matchesStatus = isInactive;

    // Type checking
    let matchesType = true;
    if (couponTypeFilter !== 'all') matchesType = c.discountType === couponTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <DashboardLayout>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Promotions & Discounts
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Create and monitor coupon codes, schedule Happy-Hour rules, and manage combination exclusion policies.
        </p>
      </div>

      {/* Tabs list */}
      <div className="dashboard-card" style={{ padding: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { label: 'Overview', value: 'overview' },
            { label: 'Coupon Codes', value: 'coupons' },
            { label: 'Happy Hours', value: 'happyhours' },
            { label: 'Discount Rules Flow', value: 'rules' },
            { label: 'Redemptions Logs', value: 'usage' },
            { label: 'Reports', value: 'reports' },
            { label: 'Module Settings', value: 'settings' },
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
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && Object.keys(overview).length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading promotion dashboards...
        </div>
      ) : (
        <div>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-title">Active Coupons</div>
                  <div className="stat-value" style={{ color: 'var(--success)' }}>{overview.activeCoupons}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Scheduled Coupons</div>
                  <div className="stat-value" style={{ color: 'var(--warning)' }}>{overview.scheduledCoupons}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Expired Coupons</div>
                  <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{overview.expiredCoupons}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Active Happy Hours</div>
                  <div className="stat-value" style={{ color: 'var(--success)' }}>{overview.activeHappyHourDeals}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Discounts (Month)</div>
                  <div className="stat-value">€{Number(overview.totalDiscountsThisMonth).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Orders with Discount</div>
                  <div className="stat-value">{overview.ordersUsingDiscounts}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">AOV (With Discount)</div>
                  <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>€{Number(overview.avgOrderValWithDiscount).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">AOV (No Discount)</div>
                  <div className="stat-value">€{Number(overview.avgOrderValWithoutDiscount).toFixed(2)}</div>
                </div>
              </div>

              {/* Graphical Overview Block */}
              <div className="grid-2" style={{ gap: '20px' }}>
                <div className="dashboard-card" style={{ padding: '20px' }}>
                  <h4 className="card-title-text" style={{ marginBottom: '14px' }}>Top Coupons Performance</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>RICHI20 (20% Off)</span>
                      <span style={{ color: 'var(--success)' }}>32 orders applied</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px' }}>
                      <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--accent-red)' }}></div>
                    </div>
                    
                    <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>FREEBURGER (Free Item)</span>
                      <span style={{ color: 'var(--success)' }}>15 orders applied</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px' }}>
                      <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--accent-red)' }}></div>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card" style={{ padding: '20px' }}>
                  <h4 className="card-title-text" style={{ marginBottom: '14px' }}>Happy Hours Sales Impact</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div className="flex-between" style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                      <span>Best Happy Hour Promotion:</span>
                      <span style={{ color: 'white', fontWeight: 'bold' }}>{overview.topPerformingHappyHour}</span>
                    </div>
                    <div className="flex-between" style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                      <span>Hours Interval Peak:</span>
                      <span style={{ color: 'white' }}>15:00 - 18:00</span>
                    </div>
                    <div className="flex-between">
                      <span>Conversion Boost:</span>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>+14.5% volume</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COUPON CODES */}
          {activeTab === 'coupons' && (
            <div>
              <div className="flex-between" style={{ marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search coupon code or name..." 
                    value={couponSearch} 
                    onChange={(e) => setCouponSearch(e.target.value)} 
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                  />
                  <select 
                    className="form-select" 
                    value={couponStatusFilter} 
                    onChange={(e) => setCouponStatusFilter(e.target.value)}
                    style={{ fontSize: '0.8rem', width: '130px' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="expired">Expired</option>
                    <option value="inactive">Inactive Drafts</option>
                  </select>
                  <select 
                    className="form-select" 
                    value={couponTypeFilter} 
                    onChange={(e) => setCouponTypeFilter(e.target.value)}
                    style={{ fontSize: '0.8rem', width: '150px' }}
                  >
                    <option value="all">All Types</option>
                    <option value="percentage_discount">Percentage %</option>
                    <option value="fixed_amount_discount">Fixed €</option>
                    <option value="free_item">Free Item</option>
                  </select>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: 'auto' }}
                  onClick={() => {
                    setEditingCoupon(null);
                    setCouponForm({
                      code: '',
                      name: '',
                      description: '',
                      discountType: 'percentage_discount',
                      discountValue: '',
                      maxDiscountAmount: '',
                      minimumOrderAmount: '0',
                      freeMenuItemId: '',
                      startDate: '',
                      endDate: '',
                      dineInAllowed: true,
                      takeAwayAllowed: true,
                      guestAllowed: true,
                      registeredOnly: false,
                      firstOrderOnly: false,
                      totalUsageLimit: '',
                      perCustomerUsageLimit: '',
                      canCombineWithPromotions: false,
                      canCombineWithRewards: false,
                      applyOnOriginalSubtotal: true,
                      isActive: true,
                    });
                    setShowCreateCoupon(true);
                  }}
                >
                  + Create Coupon
                </button>
              </div>

              <div className="dashboard-card" style={{ padding: '24px' }}>
                <div className="pos-table-wrapper">
                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Coupon Name</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Min Order</th>
                        <th>Status</th>
                        <th>Usage Log</th>
                        <th>Validity Period</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoupons.map((c) => {
                        const isExpired = new Date(c.endDate) < new Date();
                        const isScheduled = new Date(c.startDate) > new Date();
                        
                        let badgeColor = 'status-badge-inactive';
                        let statusText = 'Inactive';

                        if (isExpired) {
                          badgeColor = 'status-badge-cancelled';
                          statusText = 'Expired';
                        } else if (isScheduled) {
                          badgeColor = 'status-badge-pending';
                          statusText = 'Scheduled';
                        } else if (c.isActive) {
                          badgeColor = 'status-badge-ready';
                          statusText = 'Active';
                        }

                        return (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{c.code}</td>
                            <td>{c.name}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.discountType.replace('_', ' ')}</td>
                            <td style={{ fontWeight: 600 }}>
                              {c.discountType === 'percentage_discount' ? `${Number(c.discountValue)}%` : `€${Number(c.discountValue).toFixed(2)}`}
                            </td>
                            <td>€{Number(c.minimumOrderAmount).toFixed(2)}</td>
                            <td>
                              <span className={`status-badge ${badgeColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td>{c.currentUsageCount} / {c.totalUsageLimit || '∞'}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}
                                  onClick={() => {
                                    setEditingCoupon(c);
                                    setCouponForm({
                                      code: c.code,
                                      name: c.name,
                                      description: c.description || '',
                                      discountType: c.discountType,
                                      discountValue: c.discountValue.toString(),
                                      maxDiscountAmount: c.maxDiscountAmount ? c.maxDiscountAmount.toString() : '',
                                      minimumOrderAmount: c.minimumOrderAmount.toString(),
                                      freeMenuItemId: c.freeMenuItemId || '',
                                      startDate: new Date(c.startDate).toISOString().split('T')[0],
                                      endDate: new Date(c.endDate).toISOString().split('T')[0],
                                      dineInAllowed: c.dineInAllowed,
                                      takeAwayAllowed: c.takeAwayAllowed,
                                      guestAllowed: c.guestAllowed,
                                      registeredOnly: c.registeredOnly,
                                      firstOrderOnly: c.firstOrderOnly,
                                      totalUsageLimit: c.totalUsageLimit ? c.totalUsageLimit.toString() : '',
                                      perCustomerUsageLimit: c.perCustomerUsageLimit ? c.perCustomerUsageLimit.toString() : '',
                                      canCombineWithPromotions: c.canCombineWithPromotions,
                                      canCombineWithRewards: c.canCombineWithRewards,
                                      applyOnOriginalSubtotal: c.applyOnOriginalSubtotal,
                                      isActive: c.isActive,
                                    });
                                    setShowCreateCoupon(true);
                                  }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}
                                  onClick={() => handleDuplicateCoupon(c.id)}
                                >
                                  Clone
                                </button>
                                <button 
                                  className="btn" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto', backgroundColor: c.isActive ? '#d71920' : 'var(--success)', color: 'white' }}
                                  onClick={() => handleToggleCouponActive(c.id, !c.isActive)}
                                >
                                  {c.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto', color: 'var(--accent-red)' }}
                                  onClick={() => handleDeleteCoupon(c.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HAPPY HOURS */}
          {activeTab === 'happyhours' && (
            <div>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 className="card-title-text">Happy-Hour Time Specific Discounts</h3>
                <button 
                  className="btn btn-primary" 
                  style={{ width: 'auto' }}
                  onClick={() => {
                    setEditingPromo(null);
                    setPromoForm({
                      name: '',
                      description: '',
                      discountType: 'percentage_discount',
                      discountValue: '',
                      maxDiscountAmount: '',
                      minimumOrderAmount: '0',
                      startDate: '',
                      endDate: '',
                      startTime: '15:00',
                      endTime: '18:00',
                      timezone: 'UTC',
                      daysOfWeek: [],
                      dineInAllowed: true,
                      takeAwayAllowed: true,
                      appliesTo: 'ALL',
                      priority: '0',
                      conflictStrategy: 'highest_discount_wins',
                      totalUsageLimit: '',
                      perCustomerUsageLimit: '',
                      canCombineWithCoupons: false,
                      canCombineWithRewards: false,
                      isActive: true,
                    });
                    setShowCreatePromo(true);
                  }}
                >
                  + Add Happy Hour Rules
                </button>
              </div>

              <div className="dashboard-card" style={{ padding: '24px' }}>
                <div className="pos-table-wrapper">
                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>Promotion Name</th>
                        <th>Discount Value</th>
                        <th>Time Range</th>
                        <th>Scheduled Days</th>
                        <th>Date Validity</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promotions.map((p) => {
                        const isExpired = new Date(p.endDate) < new Date();
                        const isScheduled = new Date(p.startDate) > new Date();

                        let statusText = 'Paused';
                        let badgeColor = 'status-badge-inactive';

                        if (isExpired) {
                          statusText = 'Expired';
                          badgeColor = 'status-badge-cancelled';
                        } else if (isScheduled) {
                          statusText = 'Scheduled';
                          badgeColor = 'status-badge-pending';
                        } else if (p.isActive) {
                          statusText = 'Active';
                          badgeColor = 'status-badge-ready';
                        }

                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600, color: 'white' }}>{p.name}</td>
                            <td style={{ fontWeight: 600 }}>
                              {p.discountType === 'percentage_discount' ? `${Number(p.discountValue)}%` : `€${Number(p.discountValue).toFixed(2)}`}
                            </td>
                            <td>{p.startTime} - {p.endTime}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.daysOfWeek}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                            </td>
                            <td>P-{p.priority}</td>
                            <td>
                              <span className={`status-badge ${badgeColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}
                                  onClick={() => {
                                    setEditingPromo(p);
                                    setPromoForm({
                                      name: p.name,
                                      description: p.description || '',
                                      discountType: p.discountType,
                                      discountValue: p.discountValue.toString(),
                                      maxDiscountAmount: p.maxDiscountAmount ? p.maxDiscountAmount.toString() : '',
                                      minimumOrderAmount: p.minimumOrderAmount.toString(),
                                      startDate: new Date(p.startDate).toISOString().split('T')[0],
                                      endDate: new Date(p.endDate).toISOString().split('T')[0],
                                      startTime: p.startTime,
                                      endTime: p.endTime,
                                      timezone: p.timezone,
                                      daysOfWeek: p.daysOfWeek.split(','),
                                      dineInAllowed: p.dineInAllowed,
                                      takeAwayAllowed: p.takeAwayAllowed,
                                      appliesTo: p.appliesTo,
                                      priority: p.priority.toString(),
                                      conflictStrategy: p.conflictStrategy,
                                      totalUsageLimit: p.totalUsageLimit ? p.totalUsageLimit.toString() : '',
                                      perCustomerUsageLimit: p.perCustomerUsageLimit ? p.perCustomerUsageLimit.toString() : '',
                                      canCombineWithCoupons: p.canCombineWithCoupons,
                                      canCombineWithRewards: p.canCombineWithRewards,
                                      isActive: p.isActive,
                                    });
                                    setShowCreatePromo(true);
                                  }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}
                                  onClick={() => handleDuplicatePromo(p.id)}
                                >
                                  Clone
                                </button>
                                <button 
                                  className="btn" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto', backgroundColor: p.isActive ? '#d71920' : 'var(--success)', color: 'white' }}
                                  onClick={() => handleTogglePromoActive(p.id, !p.isActive)}
                                >
                                  {p.isActive ? 'Pause' : 'Activate'}
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto', color: 'var(--accent-red)' }}
                                  onClick={() => handleDeletePromo(p.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISCOUNT RULES */}
          {activeTab === 'rules' && settings.id && (
            <div className="grid-3" style={{ gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
              <div className="dashboard-card" style={{ padding: '24px' }}>
                <form onSubmit={handleSaveSettings}>
                  <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Global Discount Applicability Settings</h3>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <label className="checkbox-container">
                      <input type="checkbox" checked={settings.enableCoupons} onChange={(e) => setSettings({ ...settings, enableCoupons: e.target.checked })} />
                      <span className="checkmark"></span> Enable Coupon System
                    </label>
                    <label className="checkbox-container">
                      <input type="checkbox" checked={settings.enableHappyHour} onChange={(e) => setSettings({ ...settings, enableHappyHour: e.target.checked })} />
                      <span className="checkmark"></span> Enable Happy-Hour System
                    </label>
                    <label className="checkbox-container">
                      <input type="checkbox" checked={settings.allowOneCouponPerOrder} onChange={(e) => setSettings({ ...settings, allowOneCouponPerOrder: e.target.checked })} />
                      <span className="checkmark"></span> Limit to Single Coupon Per Order
                    </label>
                  </div>

                  <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', borderBottom: '1px solid #222', paddingBottom: '6px' }}>Combination Permissions</h4>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <label className="checkbox-container">
                      <input type="checkbox" checked={settings.allowCouponHappyHourTogether} onChange={(e) => setSettings({ ...settings, allowCouponHappyHourTogether: e.target.checked })} />
                      <span className="checkmark"></span> Allow Coupon + Happy-Hour Combined
                    </label>
                    <label className="checkbox-container">
                      <input type="checkbox" checked={settings.allowCouponRewardsTogether} onChange={(e) => setSettings({ ...settings, allowCouponRewardsTogether: e.target.checked })} />
                      <span className="checkmark"></span> Allow Coupon + Reward points Combined
                    </label>
                    <label className="checkbox-container">
                      <input type="checkbox" checked={settings.allowHappyHourRewardsTogether} onChange={(e) => setSettings({ ...settings, allowHappyHourRewardsTogether: e.target.checked })} />
                      <span className="checkmark"></span> Allow Happy-Hour + Reward points Combined
                    </label>
                  </div>

                  <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', borderBottom: '1px solid #222', paddingBottom: '6px' }}>Limits & Approval Overrides</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Max Discount Cap Per Order (%)</label>
                      <input type="number" className="form-input" value={settings.maxTotalDiscountPercentage} onChange={(e) => setSettings({ ...settings, maxTotalDiscountPercentage: parseFloat(e.target.value) || 50 })} />
                    </div>
                    <div className="form-group">
                      <label className="checkbox-container" style={{ marginTop: '30px' }}>
                        <input type="checkbox" checked={settings.preventFinalTotalBelowZero} onChange={(e) => setSettings({ ...settings, preventFinalTotalBelowZero: e.target.checked })} />
                        <span className="checkmark"></span> Prevent Total below €0.00
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div className="form-group">
                      <label className="form-label">Manager Approval Threshold (€)</label>
                      <input type="number" className="form-input" value={settings.requireApprovalThresholdAmount} onChange={(e) => setSettings({ ...settings, requireApprovalThresholdAmount: parseFloat(e.target.value) || 50 })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Manager Approval Threshold (%)</label>
                      <input type="number" className="form-input" value={settings.requireApprovalThresholdPercent} onChange={(e) => setSettings({ ...settings, requireApprovalThresholdPercent: parseFloat(e.target.value) || 30 })} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Save Config Rules</button>
                </form>
              </div>

              {/* Visual flowchart */}
              <div className="dashboard-card" style={{ padding: '24px' }}>
                <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Discount Process Flowchart</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  
                  <div style={{ width: '100%', padding: '12px', backgroundColor: '#111', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INITIAL START</div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>SUBTOTAL</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--accent-red)' }}>↓</div>

                  <div style={{ width: '100%', padding: '12px', backgroundColor: '#111', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>STAGE 1</div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>HAPPY-HOUR DISCOUNTS</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--accent-red)' }}>↓</div>

                  <div style={{ width: '100%', padding: '12px', backgroundColor: '#111', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>STAGE 2</div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>COUPON CODES</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--accent-red)' }}>↓</div>

                  <div style={{ width: '100%', padding: '12px', backgroundColor: '#111', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>STAGE 3</div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>REWARD POINTS</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--accent-red)' }}>↓</div>

                  <div style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(215, 25, 32, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>FINAL BILLING</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--accent-gold)' }}>FINAL PAYABLE TOTAL</div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REDEMPTIONS LOG */}
          {activeTab === 'usage' && (
            <div className="dashboard-card" style={{ padding: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 className="card-title-text">Redemptions & Usage Ledger</h3>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}
                  onClick={() => alert('Exporting promotions usage history as CSV...')}
                >
                  📥 Export CSV
                </button>
              </div>

              <div className="pos-table-wrapper">
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Source Type</th>
                      <th>Promo/Coupon Code</th>
                      <th>Discount Type</th>
                      <th>Amount Given</th>
                      <th>Type</th>
                      <th>Total Before</th>
                      <th>Total After</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usages.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No discount redemptions registered yet.
                        </td>
                      </tr>
                    ) : (
                      usages.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>#{u.orderNumber}</td>
                          <td>{u.customerName}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#111', border: '1px solid var(--border)' }}>
                              {u.discountSource}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'white' }}>{u.codeOrPromoName}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.discountType.replace('_', ' ')}</td>
                          <td style={{ fontWeight: 600, color: 'var(--accent-red-bright)' }}>-€{Number(u.discountAmount).toFixed(2)}</td>
                          <td>{u.orderType}</td>
                          <td>€{Number(u.orderTotalBefore).toFixed(2)}</td>
                          <td style={{ fontWeight: 600, color: 'white' }}>€{Number(u.orderTotalAfter).toFixed(2)}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.usedDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: REPORTS */}
          {activeTab === 'reports' && reports.bestPerformingCoupon && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-title">Total Promotional Sales</div>
                  <div className="stat-value">€{reports.revenueGeneratedByDiscountedOrders.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Coupons Revenue</div>
                  <div className="stat-value">€1,820.00</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Happy-Hour Revenue</div>
                  <div className="stat-value">€1,630.00</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Average Promotion Discount</div>
                  <div className="stat-value">€{reports.avgDiscountPerOrder.toFixed(2)}</div>
                </div>
              </div>

              <div className="dashboard-card" style={{ padding: '24px' }}>
                <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Campaign Performance Ledger</h3>
                <div className="pos-table-wrapper">
                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>Campaign Name</th>
                        <th>Orders Count</th>
                        <th>Discounts Issued</th>
                        <th>Sales Revenue</th>
                        <th>Avg Ticket Value</th>
                        <th>Performance Indicator</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'white' }}>RICHI20 (Coupon)</td>
                        <td>32</td>
                        <td>€184.20</td>
                        <td>€1,450.00</td>
                        <td>€45.31</td>
                        <td><span style={{ color: 'var(--success)' }}>⚡ High (Best Seller)</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'white' }}>Afternoon Chill Hours (Happy Hour)</td>
                        <td>31</td>
                        <td>€142.50</td>
                        <td>€1,630.00</td>
                        <td>€52.58</td>
                        <td><span style={{ color: 'var(--success)' }}>⚡ High</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'white' }}>FREEBURGER (Coupon)</td>
                        <td>15</td>
                        <td>€187.50</td>
                        <td>€820.00</td>
                        <td>€54.66</td>
                        <td><span style={{ color: 'var(--warning)' }}>⚡ Moderate</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && settings.id && (
            <div className="dashboard-card" style={{ padding: '24px' }}>
              <form onSubmit={handleSaveSettings}>
                <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Promotions Module Operations</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Default Coupon Duration (Days)</label>
                    <input type="number" className="form-input" value={settings.defaultCouponDurationDays} onChange={(e) => setSettings({ ...settings, defaultCouponDurationDays: parseInt(e.target.value) || 30 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Happy-Hour Timezone</label>
                    <input type="text" className="form-input" value={settings.defaultHappyHourTimezone} onChange={(e) => setSettings({ ...settings, defaultHappyHourTimezone: e.target.value })} />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={settings.autoExpireOldCoupons} onChange={(e) => setSettings({ ...settings, autoExpireOldCoupons: e.target.checked })} />
                    <span className="checkmark"></span> Auto-expire Old Coupon Codes
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={settings.autoPauseExpiredPromotions} onChange={(e) => setSettings({ ...settings, autoPauseExpiredPromotions: e.target.checked })} />
                    <span className="checkmark"></span> Auto-pause Expired Happy Hour Promotions
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={settings.showReportsToManager} onChange={(e) => setSettings({ ...settings, showReportsToManager: e.target.checked })} />
                    <span className="checkmark"></span> Show Performance Reports to Managers
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={settings.showReportsToCashier} onChange={(e) => setSettings({ ...settings, showReportsToCashier: e.target.checked })} />
                    <span className="checkmark"></span> Show Performance Reports to Cashiers
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Update Settings</button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* CREATE/EDIT COUPON MODAL */}
      {showCreateCoupon && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="dashboard-card" style={{ maxWidth: '600px', width: '90%', padding: '28px', border: '2px solid var(--accent-red)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="heading-bebas" style={{ fontSize: '1.6rem', marginBottom: '16px' }}>
              {editingCoupon ? 'Modify Coupon Code' : 'Add Coupon Code'}
            </h3>

            <form onSubmit={handleCreateCouponSubmit}>
              
              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px' }}>Basic Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Coupon Code (e.g. RICHI50)</label>
                  <input type="text" className="form-input" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} required disabled={!!editingCoupon} />
                </div>
                <div className="form-group">
                  <label className="form-label">Coupon Name</label>
                  <input type="text" className="form-input" value={couponForm.name} onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} />
              </div>

              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', marginTop: '20px' }}>Discount Settings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Discount Benefit Type</label>
                  <select className="form-select" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                    <option value="percentage_discount">Percentage Discount (%)</option>
                    <option value="fixed_amount_discount">Fixed Cash Discount (€)</option>
                    <option value="free_item">Free Menu Item</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value (€ or %)</label>
                  <input type="number" step="0.01" className="form-input" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Min Spend Value (€)</label>
                  <input type="number" step="0.01" className="form-input" value={couponForm.minimumOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minimumOrderAmount: e.target.value })} />
                </div>
                {couponForm.discountType === 'free_item' && (
                  <div className="form-group">
                    <label className="form-label">Link to Free Menu Item</label>
                    <select className="form-select" value={couponForm.freeMenuItemId} onChange={(e) => setCouponForm({ ...couponForm, freeMenuItemId: e.target.value })}>
                      <option value="">-- Pick Product --</option>
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', marginTop: '20px' }}>Date Validity</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={couponForm.startDate} onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={couponForm.endDate} onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })} required />
                </div>
              </div>

              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', marginTop: '20px' }}>Eligibility & Combination Rules</h4>
              <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <label className="checkbox-container">
                  <input type="checkbox" checked={couponForm.dineInAllowed} onChange={(e) => setCouponForm({ ...couponForm, dineInAllowed: e.target.checked })} />
                  <span className="checkmark"></span> Dine-in
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={couponForm.takeAwayAllowed} onChange={(e) => setCouponForm({ ...couponForm, takeAwayAllowed: e.target.checked })} />
                  <span className="checkmark"></span> Takeaway
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={couponForm.guestAllowed} onChange={(e) => setCouponForm({ ...couponForm, guestAllowed: e.target.checked })} />
                  <span className="checkmark"></span> Allow Guest checkouts
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={couponForm.registeredOnly} onChange={(e) => setCouponForm({ ...couponForm, registeredOnly: e.target.checked })} />
                  <span className="checkmark"></span> Registered only
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={couponForm.canCombineWithPromotions} onChange={(e) => setCouponForm({ ...couponForm, canCombineWithPromotions: e.target.checked })} />
                  <span className="checkmark"></span> Can combine with Happy Hour
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={couponForm.canCombineWithRewards} onChange={(e) => setCouponForm({ ...couponForm, canCombineWithRewards: e.target.checked })} />
                  <span className="checkmark"></span> Can combine with Reward Points
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => { setShowCreateCoupon(false); setEditingCoupon(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE/EDIT HAPPY HOUR PROMOTION MODAL */}
      {showCreatePromo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="dashboard-card" style={{ maxWidth: '600px', width: '90%', padding: '28px', border: '2px solid var(--accent-red)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="heading-bebas" style={{ fontSize: '1.6rem', marginBottom: '16px' }}>
              {editingPromo ? 'Modify Happy Hour Rule' : 'Add Happy Hour Rule'}
            </h3>

            <form onSubmit={handleCreatePromoSubmit}>
              
              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px' }}>Basic Info</h4>
              <div className="form-group">
                <label className="form-label">Promotion Name</label>
                <input type="text" className="form-input" value={promoForm.name} onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} />
              </div>

              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', marginTop: '20px' }}>Discount Settings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={promoForm.discountType} onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}>
                    <option value="percentage_discount">Percentage Discount (%)</option>
                    <option value="fixed_amount_discount">Fixed Cash Discount (€)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value (€ or %)</label>
                  <input type="number" step="0.01" className="form-input" value={promoForm.discountValue} onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })} required />
                </div>
              </div>

              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', marginTop: '20px' }}>Schedule Interval</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={promoForm.startDate} onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={promoForm.endDate} onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time (HH:MM)</label>
                  <input type="text" placeholder="15:00" className="form-input" value={promoForm.startTime} onChange={(e) => setPromoForm({ ...promoForm, startTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time (HH:MM)</label>
                  <input type="text" placeholder="18:00" className="form-input" value={promoForm.endTime} onChange={(e) => setPromoForm({ ...promoForm, endTime: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Days of Week Selector</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isChecked = promoForm.daysOfWeek.includes(day);
                    return (
                      <label key={day} className="checkbox-container" style={{ fontSize: '0.8rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPromoForm({ ...promoForm, daysOfWeek: [...promoForm.daysOfWeek, day] });
                            } else {
                              setPromoForm({ ...promoForm, daysOfWeek: promoForm.daysOfWeek.filter(d => d !== day) });
                            }
                          }}
                        />
                        <span className="checkmark"></span>
                        {day.substring(0, 3)}
                      </label>
                    );
                  })}
                </div>
              </div>

              <h4 className="heading-bebas" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '12px', marginTop: '20px' }}>Conflict Resolution Rules</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Conflict Strategy Choice</label>
                  <select className="form-select" value={promoForm.conflictStrategy} onChange={(e) => setPromoForm({ ...promoForm, conflictStrategy: e.target.value })}>
                    <option value="highest_discount_wins">Highest Discount Value Wins</option>
                    <option value="priority_wins">Priority Number Wins</option>
                    <option value="first_created_wins">First Created Wins</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority Number (Higher wins)</label>
                  <input type="number" className="form-input" value={promoForm.priority} onChange={(e) => setPromoForm({ ...promoForm, priority: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => { setShowCreatePromo(false); setEditingPromo(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  {editingPromo ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
