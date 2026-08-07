'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerSignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to register account.');
        setLoading(false);
        return;
      }

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '2.5rem', display: 'inline-block', marginBottom: '8px' }}>🎁</div>
          <h1 className="auth-logo-text">OH RICHI<span style={{ color: 'var(--accent-red)' }}>.</span></h1>
          <p className="auth-logo-sub">Join Our Rewards Club</p>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Earn 1 loyalty point for every €1 spent!</p>

        {error && <div className="alert alert-error" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>{success}</div>}

        <form onSubmit={handleSubmit} id="signup-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="first-name">First Name *</label>
              <input
                id="first-name"
                type="text"
                className="form-input"
                placeholder="e.g. Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last-name">Last Name *</label>
              <input
                id="last-name"
                type="text"
                className="form-input"
                placeholder="e.g. Johnson"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address *</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="e.g. alex.johnson@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone-input">Phone Number (Optional)</label>
            <input
              id="phone-input"
              type="tel"
              className="form-input"
              placeholder="e.g. +123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password *</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?
          <Link href="/customer/login" style={{ color: 'var(--accent-gold)', marginLeft: '6px', fontWeight: 600, textDecoration: 'none' }}>
            Sign In Instead
          </Link>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
