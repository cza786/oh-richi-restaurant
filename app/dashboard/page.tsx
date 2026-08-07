'use client';

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState('today');

  // Hover states for dashboard charts
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [hoveredStatusIndex, setHoveredStatusIndex] = useState<number | null>(null);

  const trendData = [
    { time: '08:00', sales: 240.00, cx: 0, cy: 140 },
    { time: '12:00', sales: 180.00, cx: 80, cy: 150 },
    { time: '16:00', sales: 420.00, cx: 160, cy: 110 },
    { time: '20:00', sales: 380.00, cx: 240, cy: 120 },
    { time: '00:00', sales: 740.00, cx: 320, cy: 60 },
    { time: '04:00', sales: 920.00, cx: 400, cy: 30 },
    { time: '08:00 (Next Day)', sales: 580.00, cx: 480, cy: 80 }
  ];

  const statusData = [
    { label: 'Preparing', percentage: 30, count: 55, color: 'var(--accent-red)', strokeDasharray: '30 70', strokeDashoffset: '0' },
    { label: 'Ready', percentage: 25, count: 46, color: 'var(--success)', strokeDasharray: '25 75', strokeDashoffset: '-30' },
    { label: 'Completed', percentage: 40, count: 74, color: 'var(--accent-gold)', strokeDasharray: '40 60', strokeDashoffset: '-55' },
    { label: 'Cancelled', percentage: 5, count: 9, color: 'var(--danger)', strokeDasharray: '5 95', strokeDashoffset: '-95' }
  ];

  // Mock data for recent orders
  const recentOrders = [
    { id: '#OR-9204', customer: 'Ahmed Khan', type: 'Delivery', items: '2x Oh G Burger, 1x Pepsi', total: '€23.80', payment: 'PAID', status: 'preparing', time: '5 mins ago' },
    { id: '#OR-9203', customer: 'Sarah Connor', type: 'Dine-In (Table 4)', items: '1x El Gaucho, 1x Sprite', total: '€28.50', payment: 'PAID', status: 'ready', time: '12 mins ago' },
    { id: '#OR-9202', customer: 'Marco Rossi', type: 'Takeaway', items: '1x Oh Philly, 1x French Fries', total: '€18.20', payment: 'PENDING', status: 'accepted', time: '18 mins ago' },
    { id: '#OR-9201', customer: 'Julia Roberts', type: 'Delivery', items: '3x Classic Smash, 1x Coca Cola', total: '€34.90', payment: 'PAID', status: 'completed', time: '45 mins ago' },
    { id: '#OR-9200', customer: 'David Miller', type: 'Takeaway', items: '1x Sloppy Oh, 1x Dips', total: '€14.50', payment: 'PAID', status: 'completed', time: '1 hour ago' },
  ];

  // Mock data for top items
  const topItems = [
    { name: 'Oh G Burger', category: 'Burgers', qty: 242, revenue: '€2,420.00', label: 'Bestseller' },
    { name: 'El Gaucho', category: 'Steak Specials', qty: 118, revenue: '€2,950.00', label: 'Special' },
    { name: 'Classic Smash', category: 'Burgers', qty: 95, revenue: '€855.00', label: 'Recommended' },
    { name: 'French Fries', category: 'Sides', qty: 180, revenue: '€720.00', label: 'Halal' },
  ];

  return (
    <DashboardLayout dateFilter={dateFilter} setDateFilter={setDateFilter}>
      {/* Title Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Real-time metrics, live order statuses, and performance insights for Oh Richi.
        </p>
      </div>

      {/* KPI Cards Grid (10 cards) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-title">Gross Sales</div>
          <div className="stat-value">€4,842.30</div>
          <div className="stat-footer">
            <span className="trend-up">+16.2%</span>
            <span style={{ color: 'var(--text-muted)' }}>vs yesterday</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Net Sales</div>
          <div className="stat-value">€4,210.80</div>
          <div className="stat-footer">
            <span className="trend-up">+12.4%</span>
            <span style={{ color: 'var(--text-muted)' }}>vs yesterday</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Orders</div>
          <div className="stat-value">184</div>
          <div className="stat-footer">
            <span className="trend-down">-2.1%</span>
            <span style={{ color: 'var(--text-muted)' }}>vs yesterday</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Avg Order Value</div>
          <div className="stat-value">€26.31</div>
          <div className="stat-footer">
            <span className="trend-up">+4.8%</span>
            <span style={{ color: 'var(--text-muted)' }}>vs yesterday</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Pending Orders</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>8</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Awaiting approval</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Completed Orders</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>162</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>88% dispatch rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Payment Pending</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>14</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Dine-in / Pay on Delivery</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Best Seller</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', height: '43px', display: 'flex', alignItems: 'center' }}>
            Oh G Burger
          </div>
          <div className="stat-footer">
            <span className="trend-up">+8.3%</span>
            <span style={{ color: 'var(--text-muted)' }}>this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Top Payment</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', height: '43px', display: 'flex', alignItems: 'center' }}>
            Cash
          </div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>42% of total volume</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Best Sales Hour</div>
          <div className="stat-value" style={{ fontSize: '1.6rem', height: '43px', display: 'flex', alignItems: 'center' }}>
            6PM - 7PM
          </div>
          <div className="stat-footer">
            <span style={{ color: 'var(--accent-gold)' }}>22% of daily revenue</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {/* Sales Trend Line Chart */}
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header-flex">
            <h3 className="card-title-text">Gross Sales Trend (24h)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Interval: 2 Hours</span>
          </div>
          <div style={{ height: '220px', width: '100%', position: 'relative' }}>
            {/* SVG line chart */}
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-red)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-red)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#1f1f1f" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#1f1f1f" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#1f1f1f" strokeWidth="1" strokeDasharray="4" />
              
              {/* Glow Fill */}
              <path 
                d="M0,200 L0,140 L80,150 L160,110 L240,120 L320,60 L400,30 L480,80 L500,80 L500,200 Z" 
                fill="url(#chartGlow)"
              />
              
              {/* Line */}
              <path 
                d="M0,140 L80,150 L160,110 L240,120 L320,60 L400,30 L480,80 L500,80" 
                fill="none" 
                stroke="var(--accent-red)" 
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Dots with Hover targets */}
              {trendData.map((data, index) => {
                const isHovered = hoveredTrendIndex === index;
                return (
                  <g key={index}>
                    <circle
                      cx={data.cx}
                      cy={data.cy}
                      r="12"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredTrendIndex(index)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                    />
                    <circle
                      cx={data.cx}
                      cy={data.cy}
                      r={isHovered ? 6 : 4}
                      fill="var(--bg-primary)"
                      stroke="var(--accent-red)"
                      strokeWidth={isHovered ? 3 : 2}
                      style={{ transition: 'all 0.15s ease', pointerEvents: 'none' }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Sales Trend Floating Tooltip */}
            {hoveredTrendIndex !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: `${trendData[hoveredTrendIndex].cy - 60}px`,
                  left: `${(trendData[hoveredTrendIndex].cx / 500) * 100}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor: '#151515',
                  border: '2px solid var(--accent-red)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
                  zIndex: 20,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease-out'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{trendData[hoveredTrendIndex].time}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>
                  Sales: €{trendData[hoveredTrendIndex].sales.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>00:00</span>
            <span>04:00</span>
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3 className="card-title-text">Order Statuses</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
            <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
              {/* Background circle */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#222" strokeWidth="4" />
              
              {/* Status Slices */}
              {statusData.map((data, index) => {
                const isHovered = hoveredStatusIndex === index;
                return (
                  <circle
                    key={data.label}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={data.color}
                    strokeWidth={isHovered ? 5.5 : 4}
                    strokeDasharray={data.strokeDasharray}
                    strokeDashoffset={data.strokeDashoffset}
                    style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredStatusIndex(index)}
                    onMouseLeave={() => setHoveredStatusIndex(null)}
                  />
                );
              })}

              {/* Central Text Details */}
              <text 
                x="18" 
                y="15.5" 
                textAnchor="middle" 
                fontSize="3" 
                fill="var(--text-muted)" 
                transform="rotate(90 18 18)"
              >
                {hoveredStatusIndex !== null ? statusData[hoveredStatusIndex].label : 'Total Orders'}
              </text>
              <text 
                x="18" 
                y="21.5" 
                textAnchor="middle" 
                fontSize="4.5" 
                fontWeight="bold" 
                fill="white" 
                transform="rotate(90 18 18)"
              >
                {hoveredStatusIndex !== null ? `${statusData[hoveredStatusIndex].percentage}% (${statusData[hoveredStatusIndex].count})` : '184'}
              </text>
            </svg>

            {/* Interactive Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {statusData.map((data, index) => {
                const isHovered = hoveredStatusIndex === index;
                return (
                  <div 
                    key={data.label}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      cursor: 'pointer',
                      color: isHovered ? 'white' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={() => setHoveredStatusIndex(index)}
                    onMouseLeave={() => setHoveredStatusIndex(null)}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data.color }}></span>
                    <span>{data.label} ({data.percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Top Items */}
      <div className="grid-3">
        {/* Recent Orders Table */}
        <div className="dashboard-card" style={{ gridColumn: 'span 2', marginBottom: '0' }}>
          <div className="card-header-flex">
            <h3 className="card-title-text">Recent Orders</h3>
            <button 
              onClick={() => window.location.href = '/dashboard/orders'}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              View All Orders
            </button>
          </div>
          <div className="pos-table-wrapper">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.id}</td>
                    <td>{order.customer}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.type}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.items}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.total}</td>
                    <td>
                      <span className={`status-badge ${order.payment === 'PAID' ? 'status-badge-ready' : 'status-badge-pending'}`}>
                        {order.payment}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="dashboard-card" style={{ marginBottom: '0' }}>
          <div className="card-header-flex">
            <h3 className="card-title-text">Top Items</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Today</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topItems.map((item, index) => (
              <div 
                key={item.name} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  paddingBottom: '12px', 
                  borderBottom: index < topItems.length - 1 ? '1px solid var(--border)' : 'none' 
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.revenue}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{item.qty} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
