'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
      router.push('/dashboard');
      router.refresh();
    } catch (loginError: any) {
      setError(loginError.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page"><section className="auth-card"><h1 className="auth-title">Super Admin</h1><p className="auth-subtitle">Door2Door MVP management access</p>{error && <div className="auth-error">{error}</div>}<form onSubmit={submit}><div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div><div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></div><button className="btn btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></section></main>;
}
