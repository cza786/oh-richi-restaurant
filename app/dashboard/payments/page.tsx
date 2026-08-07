'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function PaymentsPage() {
  const [dateFilter, setDateFilter] = useState('today');

  // Payments from database
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch payments from database
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPaymentsList(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Sum dynamic statistics based on dynamic data
  const totalVolume = paymentsList.reduce((acc, p) => p.status === 'paid' ? acc + p.amount : acc, 0);
  const cardVolume = paymentsList.reduce((acc, p) => (p.status === 'paid' && p.method.includes('CARD')) ? acc + p.amount : acc, 0);
  const cashVolume = paymentsList.reduce((acc, p) => (p.status === 'paid' && p.method.includes('CASH')) ? acc + p.amount : acc, 0);
  const deliveryVolume = paymentsList.reduce((acc, p) => (p.status === 'paid' && p.method.includes('DELIVERY')) ? acc + p.amount : acc, 0);
  const tableVolume = totalVolume - cardVolume - cashVolume - deliveryVolume;

  // Mock Automated Reports List (Screen 20)
  const [reports, setReports] = useState([
    { id: '1', name: 'Daily Sales Digest', type: 'Daily Sales Report', frequency: 'DAILY', recipients: 'owner@ohrichi.com, manager@ohrichi.com', sendTime: '23:00', active: true },
    { id: '2', name: 'Weekly Menu Performance', type: 'Menu Popularity Report', frequency: 'WEEKLY', recipients: 'owner@ohrichi.com', sendTime: '09:00 Mon', active: true },
    { id: '3', name: 'Monthly Staff Performance', type: 'Staff Performance Report', frequency: 'MONTHLY', recipients: 'hr@ohrichi.com', sendTime: '01:00 1st', active: false },
  ]);

  const toggleReportStatus = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Delete this automated report schedule?')) {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <DashboardLayout dateFilter={dateFilter} setDateFilter={setDateFilter}>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Payments & Reports
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Track daily transaction logs, monitor terminal methods, and configure scheduled reporting.
        </p>
      </div>

      {/* Screen 18: Payments Summary Metrics */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-title">Total Payments</div>
          <div className="stat-value">€{totalVolume.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '8px', fontWeight: 600 }}>✓ Reconciled</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Cash Vol.</div>
          <div className="stat-value">€{cashVolume.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {totalVolume > 0 ? Math.round((cashVolume / totalVolume) * 100) : 0}% of total
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Card Vol.</div>
          <div className="stat-value">€{cardVolume.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {totalVolume > 0 ? Math.round((cardVolume / totalVolume) * 100) : 0}% of total
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Pay on Delivery</div>
          <div className="stat-value">€{deliveryVolume.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {totalVolume > 0 ? Math.round((deliveryVolume / totalVolume) * 100) : 0}% of total
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Dine-in / Table</div>
          <div className="stat-value">€{tableVolume.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {totalVolume > 0 ? Math.round((tableVolume / totalVolume) * 100) : 0}% of total
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1.2fr', alignItems: 'start' }}>
        {/* Payments Transaction Table */}
        <div className="dashboard-card" style={{ marginBottom: '0' }}>
          <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Terminal Transaction Ledger</h3>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading payments from PostgreSQL...
            </div>
          ) : (
            <div className="pos-table-wrapper">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Paid By</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((pay) => (
                    <tr key={pay.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{pay.orderId}</td>
                      <td>{pay.method}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>€{pay.amount.toFixed(2)}</td>
                      <td>{pay.paidBy}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{pay.time}</td>
                      <td>
                        <span className={`status-badge ${
                          pay.status === 'paid' ? 'status-badge-ready' : 'status-badge-pending'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Screen 20: Reports Automation Schedulers */}
        <div className="dashboard-card" style={{ marginBottom: '0' }}>
          <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Automated Reports</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {reports.map((rep) => (
              <div 
                key={rep.id} 
                style={{ 
                  padding: '12px', 
                  backgroundColor: '#111', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px',
                  opacity: rep.active ? 1 : 0.5
                }}
              >
                <div className="flex-between" style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{rep.name}</span>
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={rep.active} 
                      onChange={() => toggleReportStatus(rep.id)} 
                    />
                    <span className="checkmark"></span>
                  </label>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Type: {rep.type} | Freq: {rep.frequency}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ✉ {rep.recipients}
                </div>
                <div className="flex-between" style={{ borderTop: '1px solid #222', paddingTop: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🕒 Every day at {rep.sendTime}</span>
                  <button 
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                    onClick={() => handleDeleteReport(rep.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create new scheduler */}
          <h4 className="heading-bebas" style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Configure Automated Report</h4>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as any;
            const name = form.repName.value;
            const type = form.repType.value;
            const freq = form.repFreq.value;
            const emails = form.repEmails.value;
            setReports(prev => [...prev, {
              id: Date.now().toString(),
              name,
              type,
              frequency: freq,
              recipients: emails,
              sendTime: '00:00',
              active: true
            }]);
            form.reset();
            alert('Report scheduler successfully configured!');
          }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.65rem' }}>Report Custom Name</label>
              <input type="text" name="repName" className="form-input" placeholder="e.g. Finance Summary" required />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.65rem' }}>Classification</label>
              <select name="repType" className="form-select">
                <option value="Daily Sales Report">Daily Sales Digest</option>
                <option value="Menu Popularity Report">Menu Popularity Report</option>
                <option value="Staff Performance Report">Staff Performance Report</option>
                <option value="Payment Report">Payments Reconcile Audit</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.65rem' }}>Trigger Frequency</label>
              <select name="repFreq" className="form-select">
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.65rem' }}>Recipient Emails (Comma separated)</label>
              <input type="text" name="repEmails" className="form-input" placeholder="e.g. boss@ohrichi.com" required />
            </div>

            <button type="submit" className="btn btn-primary">Schedule Report</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
