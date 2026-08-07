'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  dateFilter?: string;
  setDateFilter?: (filter: string) => void;
}

export default function DashboardLayout({ children, dateFilter, setDateFilter }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          gap: '16px',
        }}
      >
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(215, 25, 32, 0.1)',
            borderTop: '3px solid var(--accent-red)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.05em' }}>
          VERIFYING OH RICHI CREDENTIALS...
        </div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-container">
      <Sidebar user={user} />
      <div className="main-content">
        <TopBar 
          user={user} 
          dateFilter={dateFilter} 
          setDateFilter={setDateFilter} 
        />
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
