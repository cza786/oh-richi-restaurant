'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // CAPTCHA State
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');

  const fetchCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaToken(data.captchaToken);
        setCaptchaSvg(data.svgDataUrl);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Failed to fetch captcha challenge:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (requiresCaptcha && !captchaAnswer) {
      setError('Please solve the CAPTCHA challenge.');
      setLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          captchaToken,
          captchaAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials.');
        if (data.requiresCaptcha) {
          setRequiresCaptcha(true);
          await fetchCaptcha();
        }
        setLoading(false);
        return;
      }

      setSuccess('Logged in successfully! Redirecting...');
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
      <div className="auth-card" style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '2.5rem', display: 'inline-block', marginBottom: '8px' }}>🍔</div>
          <h1 className="auth-logo-text">OH RICHI<span style={{ color: 'var(--accent-red)' }}>.</span></h1>
          <p className="auth-logo-sub">Customer Club</p>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to check rewards & place orders faster</p>

        {error && <div className="alert alert-error" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>{success}</div>}

        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="e.g. alex@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {requiresCaptcha && (
            <div className="form-group" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <label className="form-label" htmlFor="captcha-input" style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                Security Check (CAPTCHA Required)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                {captchaSvg ? (
                  <img src={captchaSvg} alt="CAPTCHA Challenge" style={{ borderRadius: '6px', border: '1px solid #334155' }} />
                ) : (
                  <div style={{ width: '160px', height: '45px', background: '#1e1e2d', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>Loading...</div>
                )}
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="btn"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}
                  title="Refresh Challenge"
                  id="btn-refresh-captcha"
                >
                  🔄 Refresh
                </button>
              </div>
              <input
                id="captcha-input"
                type="text"
                className="form-input"
                placeholder="Enter answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have a rewards account?
          <Link href="/customer/signup" style={{ color: 'var(--accent-gold)', marginLeft: '6px', fontWeight: 600, textDecoration: 'none' }}>
            Register Now
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

