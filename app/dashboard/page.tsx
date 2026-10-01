'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/orders'), fetch('/api/menu')])
      .then(async ([ordersResponse, menuResponse]) => {
        if (ordersResponse.ok) setOrders(await ordersResponse.json());
        if (menuResponse.ok) setProducts(await menuResponse.json());
      })
      .finally(() => setLoading(false));
  }, []);

  const revenue = useMemo(() => orders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + Number(order.totalAmount), 0), [orders]);
  const active = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length;

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}><h1 className="heading-bebas" style={{ fontSize: '2.4rem', marginBottom: '4px' }}>Dashboard</h1><p style={{ color: 'var(--text-muted)' }}>Live operational data from the current database.</p></div>
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card"><div className="stat-title">Orders</div><div className="stat-value">{loading ? '…' : orders.length}</div></div>
        <div className="stat-card"><div className="stat-title">Active orders</div><div className="stat-value">{loading ? '…' : active}</div></div>
        <div className="stat-card"><div className="stat-title">Paid revenue</div><div className="stat-value">€{revenue.toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-title">Products</div><div className="stat-value">{loading ? '…' : products.length}</div></div>
      </div>
      <div className="dashboard-card">
        <div className="flex-between" style={{ marginBottom: '16px' }}><h2 className="card-title-text">Recent orders</h2><Link href="/dashboard/orders" className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px' }}>Manage orders</Link></div>
        <div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Order</th><th>Guest</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
          {orders.slice(0, 8).map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.customer?.name || 'Guest'}</td><td>€{Number(order.totalAmount).toFixed(2)}</td><td>{order.paymentStatus}</td><td>{String(order.status).replaceAll('_', ' ')}</td></tr>)}
          {!loading && orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '28px' }}>No orders yet.</td></tr>}
        </tbody></table></div>
      </div>
    </DashboardLayout>
  );
}
