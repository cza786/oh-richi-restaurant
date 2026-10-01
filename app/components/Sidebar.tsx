'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

const modules = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Restaurants', path: '/dashboard/restaurants' },
  { name: 'Orders', path: '/dashboard/orders' },
  { name: 'Kitchen KDS', path: '/dashboard/kds' },
  { name: 'Menu Management', path: '/dashboard/menu' },
  { name: 'Delivery & Zones', path: '/dashboard/delivery' },
  { name: 'Payments', path: '/dashboard/payments' },
  { name: 'Settings', path: '/dashboard/settings' },
];

export default function Sidebar({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/me', { method: 'POST' }).catch(() => undefined);
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header"><Link href="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none' }}>DOOR2DOOR<span className="sidebar-logo-dot">.</span></Link></div>
      <nav className="sidebar-menu">
        {modules.map((module) => <Link key={module.path} href={module.path} className={`sidebar-link ${pathname === module.path ? 'active' : ''}`}><span>{module.name}</span></Link>)}
      </nav>
      <div className="sidebar-footer">
        <div style={{ overflow: 'hidden' }}><strong style={{ display: 'block', fontSize: '0.82rem' }}>{user.firstName} {user.lastName}</strong><small style={{ color: 'var(--text-muted)' }}>Super Admin</small></div>
        <button type="button" onClick={logout} title="Sign out" style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--accent-red)', cursor: 'pointer' }}>Sign out</button>
      </div>
    </aside>
  );
}
