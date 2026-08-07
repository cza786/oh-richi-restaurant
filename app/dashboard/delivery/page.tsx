'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function DeliveryPage() {
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  
  // Settings DB states
  const [settingsId, setSettingsId] = useState('');
  const [radius, setRadius] = useState(6.0);
  const [minOrder, setMinOrder] = useState(20.00);
  const [baseFee, setBaseFee] = useState(3.00);
  const [feePerKm, setFeePerKm] = useState(0.50);
  const [freeOver, setFreeOver] = useState(50.00);

  // Delivery Zones DB state
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from database
  const fetchDelivery = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/delivery');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettingsId(data.settings.id);
          setRadius(data.settings.deliveryRadius);
          setMinOrder(data.settings.minimumOrderAmount);
          setBaseFee(data.settings.baseDeliveryFee);
          setFeePerKm(data.settings.feePerKm);
          setFreeOver(data.settings.freeDeliveryOver || 0);
        }
        if (data.zones) {
          const formatted = data.zones.map((z: any) => ({
            ...z,
            isActive: true, // DB active indicator fallback
            city: z.postalCode === '36396' ? 'Steinau an der Straße' : z.postalCode === '00054' ? 'Fiumicino' : 'Rome North',
          }));
          setZones(formatted);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, []);

  // Save Settings to Database
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          settingsId,
          deliveryRadius: radius,
          minimumOrderAmount: minOrder,
          baseDeliveryFee: baseFee,
          feePerKm,
          freeDeliveryOver: freeOver,
        }),
      });
      if (res.ok) {
        alert('Delivery configurations updated in database successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create custom postal code zone exception in database
  const handleAddZone = async () => {
    const name = prompt('Enter Zone Exception Name (e.g. Steinau Outer):');
    const postalCode = prompt('Enter Target Postal Code (e.g. 36396):');
    const zoneMinOrder = parseFloat(prompt('Minimum Order (€):') || '20.00');
    const fixedFee = parseFloat(prompt('Courier Fixed Surcharge Fee (€):') || '4.00');

    if (!name || !postalCode) return;

    try {
      const res = await fetch('/api/delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_zone',
          zoneName: name,
          postalCode,
          zoneMinOrder,
          fixedFee,
        }),
      });
      if (res.ok) {
        alert('Special Delivery Zone exception added to database!');
        fetchDelivery();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete exception zone from database
  const handleDeleteZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery zone exception from the database?')) {
      return;
    }

    try {
      const res = await fetch('/api/delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_zone',
          zoneId: id,
        }),
      });
      if (res.ok) {
        alert('Delivery zone exception deleted.');
        setZones(prev => prev.filter(z => z.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Delivery & Zones
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Manage local courier logistics, dynamic per-kilometer fees, and allowed postal code exceptions.
        </p>
      </div>

      <div className="grid-2">
        {/* Screen 14: Delivery Settings */}
        <div className="dashboard-card">
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 className="card-title-text">Default Branch Settings</h3>
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={deliveryEnabled} 
                onChange={() => setDeliveryEnabled(!deliveryEnabled)} 
              />
              <span className="checkmark"></span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{deliveryEnabled ? 'DELIVERY ACTIVE' : 'DELIVERY DISABLED'}</span>
            </label>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading delivery settings...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: deliveryEnabled ? 1 : 0.4 }}>
              {/* Radius Slider */}
              <div>
                <div className="flex-between" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  <span>Delivery Radius Limit</span>
                  <span style={{ color: 'var(--accent-red-bright)' }}>{radius} KM</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="25" 
                  step="0.5" 
                  value={radius} 
                  onChange={(e) => setRadius(parseFloat(e.target.value))} 
                  disabled={!deliveryEnabled}
                  style={{ width: '100%', accentColor: 'var(--accent-red)' }}
                />
              </div>

              {/* Minimum Order */}
              <div className="form-group">
                <label className="form-label">Minimum Order Value (€)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={minOrder} 
                  onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)} 
                  disabled={!deliveryEnabled}
                />
              </div>

              {/* Pricing split row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Base Courier Fee (€)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={baseFee} 
                    onChange={(e) => setBaseFee(parseFloat(e.target.value) || 0)} 
                    disabled={!deliveryEnabled}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fee per KM (€)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={feePerKm} 
                    onChange={(e) => setFeePerKm(parseFloat(e.target.value) || 0)} 
                    disabled={!deliveryEnabled}
                  />
                </div>
              </div>

              {/* Free Delivery threshold */}
              <div className="form-group">
                <label className="form-label">Free Delivery threshold (€)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={freeOver} 
                  onChange={(e) => setFreeOver(parseFloat(e.target.value) || 0)} 
                  disabled={!deliveryEnabled}
                />
              </div>

              <button 
                className="btn btn-primary" 
                disabled={!deliveryEnabled}
                onClick={handleSaveSettings}
              >
                Save Configuration
              </button>
            </div>
          )}
        </div>

        {/* Visual Map radius preview */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 className="card-title-text" style={{ alignSelf: 'flex-start', marginBottom: '20px' }}>Coverage Radar</h3>
          
          <div 
            style={{ 
              width: '240px', 
              height: '240px', 
              borderRadius: '50%', 
              border: '1px solid var(--border)',
              position: 'relative',
              background: '#0d0d0d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Background grid lines */}
            <div style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: '#181818' }}></div>
            <div style={{ position: 'absolute', height: '100%', width: '1px', backgroundColor: '#181818' }}></div>

            {/* Coverage Circle based on state slider */}
            <div 
              style={{
                width: `${(radius / 25) * 240}px`,
                height: `${(radius / 25) * 240}px`,
                borderRadius: '50%',
                backgroundColor: 'rgba(215, 25, 32, 0.08)',
                border: '2px dashed var(--accent-red)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '0.65rem', color: 'var(--text-primary)', fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px' }}>
                {radius} KM RADAR
              </span>
            </div>

            {/* Central Pin */}
            <div 
              style={{ 
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: 'var(--accent-gold)',
                borderRadius: '50%',
                boxShadow: '0 0 10px var(--accent-gold)'
              }}
              title="Main Location"
            ></div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            Radar map centers around 123 Via Roma, Rome, Italy
          </span>
        </div>
      </div>

      {/* Screen 15: Delivery Zones Exceptions Table */}
      <div className="dashboard-card" style={{ marginTop: '24px' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 className="card-title-text">Special Zone Exceptions</h3>
          <button 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }}
            onClick={handleAddZone}
          >
            + Add Zone Exception
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading delivery zones from database...
          </div>
        ) : (
          <div className="pos-table-wrapper">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Target City</th>
                  <th>Postal Code</th>
                  <th>Fixed Fee</th>
                  <th>Min Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{z.name}</td>
                    <td>{z.city}</td>
                    <td style={{ fontWeight: 500 }}>{z.postalCode || 'N/A'}</td>
                    <td>€{z.deliveryFee.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>€{z.minimumOrder.toFixed(2)}</td>
                    <td>
                      <span className="status-badge status-badge-ready" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Active
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', display: 'inline-block' }}
                        onClick={() => handleDeleteZone(z.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
