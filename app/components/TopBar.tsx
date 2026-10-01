'use client';

import React from 'react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface TopBarProps {
  user: UserProfile;
  dateFilter?: string;
  setDateFilter?: (filter: string) => void;
}

export default function TopBar({ user, dateFilter, setDateFilter }: TopBarProps) {
  const formattedRole = 'SUPER ADMIN';

  const dateFilters = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'This Month', value: 'month' },
  ];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <input 
          type="text" 
          className="topbar-search" 
          placeholder="Search orders and menu items..."
        />
      </div>

      <div className="topbar-right">
        {/* Date Filter Selector if controls are provided */}
        {setDateFilter && dateFilter && (
          <div className="filter-tabs">
            {dateFilters.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDateFilter(tab.value)}
                className={`filter-tab ${dateFilter === tab.value ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Notifications Icon */}
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--accent-red)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
            }}
          ></span>
        </div>

        {/* Divider */}
        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border)' }}></div>

        {/* User Badge Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-owner">
            {formattedRole}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            System Live
          </span>
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
              display: 'inline-block',
            }}
          ></span>
        </div>
      </div>
    </header>
  );
}
