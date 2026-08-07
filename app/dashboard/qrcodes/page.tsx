'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function QrCodesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock Active Orders database for Pickup Scan validation (Screen 17)
  const [ordersDatabase, setOrdersDatabase] = useState<Record<string, any>>({
    'OR-9202': { customer: 'Marco Rossi', items: '1x Oh Philly, 1x French Fries', total: 18.20, paid: 0.00, remaining: 18.20, status: 'accepted' },
    'OR-9200': { customer: 'David Miller', items: '1x Sloppy Oh, 1x Dips', total: 14.50, paid: 14.50, remaining: 0.00, status: 'completed' },
    'OR-9199': { customer: 'Emma Watson', items: '1x Buffalo', total: 9.50, paid: 5.00, remaining: 4.50, status: 'placed' },
  });

  // Scanner States
  const [pickupInput, setPickupInput] = useState('');
  const [scannedOrderCode, setScannedOrderCode] = useState<string | null>(null);
  const [cashCollected, setCashCollected] = useState('');
  const [scanError, setScanError] = useState('');

  // Fetch tables from Database
  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tables');
      if (res.ok) {
        const data = await res.json();
        // Standardize qrActive status on client side
        const mapped = data.map((t: any) => ({
          ...t,
          qrActive: true,
        }));
        setTables(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Update status in Database
  const toggleTableStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setTables(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleQrState = (id: string) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, qrActive: !t.qrActive } : t));
  };

  // Add new table to Database
  const handleAddTable = async () => {
    const tableNumber = prompt('Enter Table Number (e.g. T6):');
    const capacityVal = parseInt(prompt('Enter Seating Capacity:') || '2');
    if (!tableNumber) return;

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, seatingCapacity: capacityVal }),
      });
      if (res.ok) {
        alert('Table successfully registered in database!');
        fetchTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pickup scan verification functions
  const handleVerifyPickupCode = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    setScannedOrderCode(null);
    setCashCollected('');

    // Clean code formatting
    const cleanedCode = pickupInput.replace('#', '').trim().toUpperCase();
    if (ordersDatabase[cleanedCode]) {
      setScannedOrderCode(cleanedCode);
    } else {
      setScanError('Invalid Pickup Code. Order not found.');
    }
  };

  // Reconcile and pay order remaining balance
  const handleCollectPayment = () => {
    if (!scannedOrderCode) return;
    const order = ordersDatabase[scannedOrderCode];
    const amount = parseFloat(cashCollected) || 0;

    if (amount <= 0) {
      alert('Please enter a valid cash amount to collect.');
      return;
    }

    if (amount > order.remaining) {
      alert(`Collected amount exceeds remaining balance by €${(amount - order.remaining).toFixed(2)}. Change due!`);
    }

    const updatedPaid = order.paid + Math.min(amount, order.remaining);
    const updatedRemaining = Math.max(0, order.remaining - amount);

    setOrdersDatabase(prev => ({
      ...prev,
      [scannedOrderCode]: {
        ...order,
        paid: updatedPaid,
        remaining: updatedRemaining,
        status: updatedRemaining === 0 ? 'completed' : order.status
      }
    }));

    setCashCollected('');
    alert('Payment transaction approved!');
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          QR Code & Table System
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Deploy dine-in digital self-checkout tables or verify customer takeaway pickup passcodes.
        </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        {/* Screen 16: Dine-In Tables & QR Codes */}
        <div className="dashboard-card" style={{ marginBottom: '0' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 className="card-title-text">Table QR Codes</h3>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={handleAddTable}
            >
              + Create Table
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading tables from PostgreSQL...
            </div>
          ) : (
            <div className="pos-table-wrapper">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Capacity</th>
                    <th>QR Ordering</th>
                    <th>Live Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{t.tableNumber}</td>
                      <td>{t.seatingCapacity} Seats</td>
                      <td>
                        <label className="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={t.qrActive} 
                            onChange={() => toggleQrState(t.id)} 
                          />
                          <span className="checkmark"></span>
                          <span style={{ fontSize: '0.75rem' }}>{t.qrActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </label>
                      </td>
                      <td>
                        <select 
                          className="form-select" 
                          value={t.status}
                          onChange={(e) => toggleTableStatus(t.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', width: '110px' }}
                        >
                          <option value="AVAILABLE">🟢 Available</option>
                          <option value="OCCUPIED">🔴 Occupied</option>
                          <option value="RESERVED">🟡 Reserved</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}
                            onClick={() => alert(`Printing QR Code sign for ${t.tableNumber}...`)}
                          >
                            Print QR
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}
                            onClick={() => alert(`Simulating mobile customer scan on ${t.tableNumber}. Link: https://ohrichi.com/order?table=${t.tableNumber}`)}
                          >
                            Scan link
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Screen 17: Take-away Verification Panel */}
        <div className="dashboard-card" style={{ marginBottom: '0' }}>
          <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Takeaway Pass Verification</h3>
          
          <form onSubmit={handleVerifyPickupCode} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Pickup Code (e.g. #OR-9202)" 
              value={pickupInput}
              onChange={(e) => setPickupInput(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Verify</button>
          </form>

          {/* Validation Outputs */}
          {scanError && <div className="alert alert-error">{scanError}</div>}

          {scannedOrderCode && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', backgroundColor: '#0c0c0c' }}>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Order #{scannedOrderCode}</span>
                <span className={`status-badge status-badge-${ordersDatabase[scannedOrderCode].status}`}>
                  {ordersDatabase[scannedOrderCode].status}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ordersDatabase[scannedOrderCode].customer}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Items:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{ordersDatabase[scannedOrderCode].items}</span>
                </div>
                <div className="flex-between" style={{ borderTop: '1px dashed var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Order Total:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>€{ordersDatabase[scannedOrderCode].total.toFixed(2)}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--success)' }}>Paid Amount:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>€{ordersDatabase[scannedOrderCode].paid.toFixed(2)}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: ordersDatabase[scannedOrderCode].remaining > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>Remaining Balance:</span>
                  <span style={{ color: ordersDatabase[scannedOrderCode].remaining > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                    €{ordersDatabase[scannedOrderCode].remaining.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Cashier Payment Rule Validation */}
              {ordersDatabase[scannedOrderCode].remaining > 0 ? (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '0.75rem', marginBottom: '12px' }}>
                    ⚠️ CANNOT MARK AS DISPATCHED. FULL PAYMENT REQUIRED.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      placeholder="Enter Paid Cash (€)" 
                      value={cashCollected}
                      onChange={(e) => setCashCollected(e.target.value)}
                    />
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'auto', whiteSpace: 'nowrap' }}
                      onClick={handleCollectPayment}
                    >
                      Process Cash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: '0' }}>
                  ✓ ORDER FULLY PAID. READY FOR CUSTOMER HANDOVER.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
