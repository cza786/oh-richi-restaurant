'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments')
      .then(async (response) => { if (response.ok) setPayments(await response.json()); })
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(() => payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount), 0), [payments]);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}><h1 className="heading-bebas" style={{ fontSize: '2.4rem', marginBottom: '4px' }}>Payments</h1><p style={{ color: 'var(--text-muted)' }}>Recorded payment transactions.</p></div>
      <div className="stats-grid" style={{ marginBottom: '24px' }}><div className="stat-card"><div className="stat-title">Paid volume</div><div className="stat-value">€{total.toFixed(2)}</div></div><div className="stat-card"><div className="stat-title">Transactions</div><div className="stat-value">{payments.length}</div></div></div>
      <div className="dashboard-card"><div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Order</th><th>Restaurant</th><th>Method</th><th>Amount</th><th>Guest</th><th>Status</th><th>Transaction</th><th>Time</th></tr></thead><tbody>
        {payments.map((payment) => <tr key={payment.id}><td>{payment.orderId}</td><td>{payment.restaurant}</td><td>{payment.method}</td><td>€{Number(payment.amount).toFixed(2)}</td><td>{payment.paidBy}</td><td>{payment.status}</td><td>{payment.transactionId || '—'}</td><td>{new Date(payment.time).toLocaleString()}</td></tr>)}
        {!loading && payments.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '28px' }}>No payment records found.</td></tr>}
      </tbody></table></div></div>
    </DashboardLayout>
  );
}
