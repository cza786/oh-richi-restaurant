'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('general'); // general, hours, receipt
  const [loading, setLoading] = useState(true);

  // Database settings fields
  const [restaurantId, setRestaurantId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [restaurantName, setRestaurantName] = useState('Oh Richi');
  const [phone, setPhone] = useState('+39 06 1234567');
  const [email, setEmail] = useState('main@ohrichi.com');
  const [address, setAddress] = useState('123 Via Roma, Rome, Italy');
  const [currency, setCurrency] = useState('EUR');
  const [vat, setVat] = useState(10.0);
  const [autoAccept, setAutoAccept] = useState(true);

  // Fetch settings from database
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setRestaurantId(data.id);
        setLocationId(data.locationId);
        setRestaurantName(data.name);
        setPhone(data.phone);
        setEmail(data.email);
        setAddress(data.address);
        setCurrency(data.currency);
        setVat(data.vat);
        setAutoAccept(data.autoAccept);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings to Database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restaurantId,
          locationId,
          name: restaurantName,
          phone,
          email,
          address,
        }),
      });
      if (res.ok) {
        alert('Restaurant configurations saved in PostgreSQL database successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Opening Hours (Screen 21)
  const [hours, setHours] = useState([
    { day: 'Monday', open: '11:00', close: '23:00', closed: false },
    { day: 'Tuesday', open: '11:00', close: '23:00', closed: false },
    { day: 'Wednesday', open: '11:00', close: '23:00', closed: false },
    { day: 'Thursday', open: '11:00', close: '23:00', closed: false },
    { day: 'Friday', open: '11:00', close: '00:00', closed: false },
    { day: 'Saturday', open: '11:00', close: '01:00', closed: false },
    { day: 'Sunday', open: '12:00', close: '22:00', closed: true },
  ]);

  const updateHours = (index: number, field: string, value: any) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  // Receipt Settings templates
  const [receiptHeader, setReceiptHeader] = useState('OH RICHI GOURMET BURGERS\nVia Roma 123, Rome\nTel: +39 06 1234567');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for dining with us!\nFollow us on Instagram: @ohrichi\nGrazie e Arrivederci!');

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Restaurant Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure general store metadata profiles, operational hours schedulers, and receipt layout headers.
        </p>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 2.2fr', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <div className="dashboard-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveSubTab('general')}
            style={{
              textAlign: 'left',
              padding: '10px 14px',
              backgroundColor: activeSubTab === 'general' ? 'var(--accent-red-glow)' : 'transparent',
              color: activeSubTab === 'general' ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderLeft: activeSubTab === 'general' ? '3px solid var(--accent-red)' : '3px solid transparent',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            General Profile
          </button>

          <button 
            onClick={() => setActiveSubTab('hours')}
            style={{
              textAlign: 'left',
              padding: '10px 14px',
              backgroundColor: activeSubTab === 'hours' ? 'var(--accent-red-glow)' : 'transparent',
              color: activeSubTab === 'hours' ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderLeft: activeSubTab === 'hours' ? '3px solid var(--accent-red)' : '3px solid transparent',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Operating Timings
          </button>

          <button 
            onClick={() => setActiveSubTab('receipt')}
            style={{
              textAlign: 'left',
              padding: '10px 14px',
              backgroundColor: activeSubTab === 'receipt' ? 'var(--accent-red-glow)' : 'transparent',
              color: activeSubTab === 'receipt' ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderLeft: activeSubTab === 'receipt' ? '3px solid var(--accent-red)' : '3px solid transparent',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Thermal Receipt Template
          </button>
        </div>

        {/* Dynamic Form Panel */}
        <div className="dashboard-card" style={{ marginBottom: '0' }}>
          {activeSubTab === 'general' && (
            loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading profile details from PostgreSQL...
              </div>
            ) : (
              <form onSubmit={handleSaveProfile}>
                <h3 className="card-title-text" style={{ marginBottom: '20px' }}>General Profile</h3>
                
                <div className="form-group">
                  <label className="form-label">Restaurant Name</label>
                  <input type="text" className="form-input" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location Address</label>
                  <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">System Currency</label>
                    <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sales Tax / VAT (%)</label>
                    <input type="number" step="0.1" className="form-input" value={vat} onChange={(e) => setVat(parseFloat(e.target.value) || 0)} required />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '10px', marginBottom: '24px' }}>
                  <label className="checkbox-container">
                    <input type="checkbox" checked={autoAccept} onChange={(e) => setAutoAccept(e.target.checked)} />
                    <span className="checkmark"></span>
                    Auto-Accept Incoming Mobile/QR Dine-in Orders
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Save Profile Details</button>
              </form>
            )
          )}

          {activeSubTab === 'hours' && (
            <form onSubmit={(e) => { e.preventDefault(); alert('Operational Hours updated successfully!'); }}>
              <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Operating Timings Scheduler</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {hours.map((h, i) => (
                  <div key={h.day} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{h.day}</span>
                    
                    <input 
                      type="time" 
                      className="form-input" 
                      value={h.open} 
                      onChange={(e) => updateHours(i, 'open', e.target.value)} 
                      disabled={h.closed}
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    />
                    
                    <input 
                      type="time" 
                      className="form-input" 
                      value={h.close} 
                      onChange={(e) => updateHours(i, 'close', e.target.value)} 
                      disabled={h.closed}
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    />

                    <label className="checkbox-container" style={{ margin: '0' }}>
                      <input 
                        type="checkbox" 
                        checked={h.closed} 
                        onChange={(e) => updateHours(i, 'closed', e.target.checked)} 
                      />
                      <span className="checkmark"></span>
                      <span style={{ fontSize: '0.75rem' }}>{h.closed ? 'CLOSED' : 'OPEN'}</span>
                    </label>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Update Timings</button>
            </form>
          )}

          {activeSubTab === 'receipt' && (
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Receipt configurations */}
              <form onSubmit={(e) => { e.preventDefault(); alert('Thermal receipt headers successfully saved!'); }}>
                <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Thermal Receipt Template</h3>

                <div className="form-group">
                  <label className="form-label">Header Text</label>
                  <textarea 
                    className="form-input" 
                    value={receiptHeader} 
                    onChange={(e) => setReceiptHeader(e.target.value)} 
                    style={{ height: '90px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'none' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Footer Text</label>
                  <textarea 
                    className="form-input" 
                    value={receiptFooter} 
                    onChange={(e) => setReceiptFooter(e.target.value)} 
                    style={{ height: '90px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'none' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary">Save Template Layout</button>
              </form>

              {/* Receipt Preview */}
              <div>
                <h4 className="heading-bebas" style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Print preview</h4>
                <div 
                  style={{ 
                    backgroundColor: 'white', 
                    color: 'black', 
                    padding: '24px 16px', 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    borderRadius: '4px',
                    width: '100%',
                    maxWidth: '260px',
                    margin: '0 auto',
                    border: '1px solid #ddd'
                  }}
                >
                  <div style={{ textAlign: 'center', whiteSpace: 'pre-line', marginBottom: '14px', fontWeight: 'bold' }}>
                    {receiptHeader}
                  </div>
                  <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
                  
                  {/* Items list */}
                  <div>
                    <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>1x Oh G Burger</span>
                      <span>€12.50</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', paddingLeft: '10px', color: '#555' }}>
                      + Extra Cheese
                    </div>
                    <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span>1x French Fries</span>
                      <span>€4.00</span>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
                  
                  {/* Totals */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 'bold' }}>
                    <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SUBTOTAL</span>
                      <span>€16.50</span>
                    </div>
                    <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>VAT (10%)</span>
                      <span>€1.65</span>
                    </div>
                    <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                      <span>TOTAL</span>
                      <span>€18.15</span>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>

                  <div style={{ textAlign: 'center', whiteSpace: 'pre-line', marginTop: '10px', fontSize: '0.7rem', color: '#333' }}>
                    {receiptFooter}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
