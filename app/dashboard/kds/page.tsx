'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function KdsPage() {
  const [dateFilter, setDateFilter] = useState('today');

  // Orders queue from database
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from database
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Setup simple 10-second automatic polling for live order tickets sync
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  // Transition ticket status in DB
  const handleTransition = async (id: string, nextStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      }
    } catch (err) {
      console.error('Status transition error:', err);
    }
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(t => t.status === status);
  };

  return (
    <DashboardLayout dateFilter={dateFilter} setDateFilter={setDateFilter}>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Kitchen Display System
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Live food preparation queue. Update cooking state in real-time. (Auto-refreshing every 10s)
        </p>
      </div>

      {loading && tickets.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading kitchen preparation tickets...
        </div>
      ) : (
        /* KDS Kanban Board */
        <div className="kds-board">
          {/* Column 1: New Orders */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span>New Orders</span>
              <span className="kds-column-count">{getTicketsByStatus('PENDING').length}</span>
            </div>
            <div className="kds-cards-list">
              {getTicketsByStatus('PENDING').map((ticket) => (
                <div key={ticket.id} className="kds-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                  <div className="kds-card-header">
                    <span className="kds-card-order-num">#{ticket.shortId}</span>
                    <span className="kds-card-time">New</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {ticket.orderType} {ticket.table ? `- Table ${ticket.table.tableNumber}` : ''}
                  </div>
                  <div className="kds-card-items">
                    {ticket.orderItems?.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="kds-card-item">
                          <span>{item.quantity}x {item.menuItem?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="kds-card-footer">
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      onClick={() => handleTransition(ticket.id, 'ACCEPTED')}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Accepted */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span>Accepted</span>
              <span className="kds-column-count">{getTicketsByStatus('ACCEPTED').length}</span>
            </div>
            <div className="kds-cards-list">
              {getTicketsByStatus('ACCEPTED').map((ticket) => (
                <div key={ticket.id} className="kds-card" style={{ borderLeft: '4px solid var(--info)' }}>
                  <div className="kds-card-header">
                    <span className="kds-card-order-num">#{ticket.shortId}</span>
                    <span className="kds-card-time">Queue</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {ticket.orderType} {ticket.table ? `- Table ${ticket.table.tableNumber}` : ''}
                  </div>
                  <div className="kds-card-items">
                    {ticket.orderItems?.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="kds-card-item">
                          <span>{item.quantity}x {item.menuItem?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="kds-card-footer">
                    <button 
                      className="btn" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#e53e3e', color: 'white' }}
                      onClick={() => handleTransition(ticket.id, 'PREPARING')}
                    >
                      Prepare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Preparing */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span>Preparing</span>
              <span className="kds-column-count">{getTicketsByStatus('PREPARING').length}</span>
            </div>
            <div className="kds-cards-list">
              {getTicketsByStatus('PREPARING').map((ticket) => (
                <div key={ticket.id} className="kds-card" style={{ borderLeft: '4px solid var(--accent-red-bright)' }}>
                  <div className="kds-card-header">
                    <span className="kds-card-order-num">#{ticket.shortId}</span>
                    <span className="kds-card-time">Active</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {ticket.orderType} {ticket.table ? `- Table ${ticket.table.tableNumber}` : ''}
                  </div>
                  <div className="kds-card-items">
                    {ticket.orderItems?.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="kds-card-item">
                          <span>{item.quantity}x {item.menuItem?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="kds-card-footer">
                    <button 
                      className="btn" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: 'var(--success)', color: 'white' }}
                      onClick={() => handleTransition(ticket.id, 'READY')}
                    >
                      Ready
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Ready */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span>Ready</span>
              <span className="kds-column-count">{getTicketsByStatus('READY').length}</span>
            </div>
            <div className="kds-cards-list">
              {getTicketsByStatus('READY').map((ticket) => (
                <div key={ticket.id} className="kds-card" style={{ borderLeft: '4px solid var(--success)' }}>
                  <div className="kds-card-header">
                    <span className="kds-card-order-num">#{ticket.shortId}</span>
                    <span className="kds-card-time">Done</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {ticket.orderType} {ticket.table ? `- Table ${ticket.table.tableNumber}` : ''}
                  </div>
                  <div className="kds-card-items">
                    {ticket.orderItems?.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="kds-card-item">
                          <span>{item.quantity}x {item.menuItem?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="kds-card-footer">
                    <button 
                      className="btn" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: 'var(--accent-gold)', color: 'black' }}
                      onClick={() => handleTransition(ticket.id, 'COMPLETED')}
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 5: Completed */}
          <div className="kds-column">
            <div className="kds-column-header">
              <span>Completed</span>
              <span className="kds-column-count">{getTicketsByStatus('COMPLETED').length}</span>
            </div>
            <div className="kds-cards-list">
              {getTicketsByStatus('COMPLETED').map((ticket) => (
                <div key={ticket.id} className="kds-card" style={{ borderLeft: '4px solid var(--text-muted)' }}>
                  <div className="kds-card-header">
                    <span className="kds-card-order-num">#{ticket.shortId}</span>
                    <span className="kds-card-time">Served</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {ticket.orderType} {ticket.table ? `- Table ${ticket.table.tableNumber}` : ''}
                  </div>
                  <div className="kds-card-items">
                    {ticket.orderItems?.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="kds-card-item">
                          <span>{item.quantity}x {item.menuItem?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
