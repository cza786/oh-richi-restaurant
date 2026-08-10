'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerLoginPage() {
  const router = useRouter();
  
  // Auth Mode: 'otp' (Gmail or Phone via OTP) or 'password'
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');

  // Identifier state (Gmail address or Phone number)
  const [identifier, setIdentifier] = useState('');
  
  // OTP Flow States
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Password Flow States
  const [password, setPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // CAPTCHA State
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  // STEP 1: Send OTP to Gmail or Phone Number
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier.trim()) {
      setError('Please enter your Gmail address or mobile phone number.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP code.');
        setLoading(false);
        return;
      }

      setSuccess(data.message || 'OTP code sent successfully!');
      if (data.demoOtp) {
        setDemoOtp(data.demoOtp);
      }
      setOtpStep('verify');
      setResendTimer(30); // 30 seconds resend timer
    } catch (err) {
      console.error(err);
      setError('Network error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-digit OTP Code & Log In
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the full 6-digit security OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otpCode: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid OTP code.');
        setLoading(false);
        return;
      }

      setSuccess('OTP verified successfully! Redirecting to your account...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 900);
    } catch (err) {
      console.error(err);
      setError('Network error verifying OTP. Please try again.');
      setLoading(false);
    }
  };

  // Password-based Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!identifier || !password) {
      setError('Please fill in both identifier and password.');
      setLoading(false);
      return;
    }

    if (requiresCaptcha && !captchaAnswer) {
      setError('Please solve the CAPTCHA challenge.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier.trim(),
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
      }, 900);
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // Instant Gmail / Google 1-Click Login Simulation
  const handleGoogleSignIn = async () => {
    setError('');
    const promptGmail = prompt('Enter your Gmail address for instant 1-click Google authentication:', identifier || 'alex@gmail.com');
    if (!promptGmail) return;

    try {
      setLoading(true);
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: promptGmail }),
      });
      const data = await res.json();
      if (res.ok && data.demoOtp) {
        // Auto-verify Google login via instant token
        const verifyRes = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: promptGmail,
            otpCode: data.demoOtp,
          }),
        });
        if (verifyRes.ok) {
          setSuccess('Authenticated with Google (Gmail)! Logged in...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 800);
        }
      }
    } catch {
      setError('Google sign-in error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '2.5rem', display: 'inline-block', marginBottom: '4px' }}>🍔</div>
          <h1 className="auth-logo-text">OH RICHI<span style={{ color: 'var(--accent-red)' }}>.</span></h1>
          <p className="auth-logo-sub">Customer Club & Rewards</p>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in via Gmail or Phone Number with OTP verification</p>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '20px',
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              backgroundColor: authMode === 'otp' ? 'var(--accent-red)' : 'transparent',
              color: authMode === 'otp' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            💬 OTP Code (Gmail / Phone)
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              backgroundColor: authMode === 'password' ? 'var(--accent-red)' : 'transparent',
              color: authMode === 'password' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🔑 Password
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            {success}
          </div>
        )}

        {/* --- MODE A: OTP LOGIN (GMAIL OR PHONE) --- */}
        {authMode === 'otp' && (
          <div>
            {/* Step 1: Input Gmail or Phone Number */}
            {otpStep === 'request' && (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label" htmlFor="identifier-input">
                    Gmail Address or Mobile Phone Number
                  </label>
                  <input
                    id="identifier-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. alex@gmail.com  OR  +39 333 1234567"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    We'll send a 6-digit security OTP code to verify your identity.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? 'Sending Security OTP...' : 'Send Security OTP Code 📩'}
                </button>
              </form>
            )}

            {/* Step 2: Enter 6-digit OTP Code */}
            {otpStep === 'verify' && (
              <form onSubmit={handleVerifyOtp}>
                {demoOtp && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 149, 0, 0.15)',
                    border: '1px dashed #ff9500',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, letterSpacing: '0.05em' }}>
                      💬 DEMO SMS / GMAIL NOTIFICATION:
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.2em', marginTop: '4px' }}>
                      {demoOtp}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#ccc', marginTop: '2px' }}>
                      Enter this 6-digit OTP code below to sign in instantly.
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="otp-input" style={{ margin: 0 }}>
                      Enter 6-Digit Security OTP Code
                    </label>
                    <button
                      type="button"
                      onClick={() => { setOtpStep('request'); setOtpCode(''); setError(''); setSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Edit Gmail/Phone
                    </button>
                  </div>
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    className="form-input"
                    placeholder="Enter 6-digit code (e.g. 849201)"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={loading}
                    style={{
                      fontSize: '1.3rem',
                      letterSpacing: '0.3em',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || otpCode.length < 6}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP & Sign In 🔓'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Resend code in <strong style={{ color: 'white' }}>{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      🔄 Didn't get code? Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Google / Gmail 1-Click Button */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Gmail / Google
              </button>
            </div>
          </div>
        )}

        {/* --- MODE B: PASSWORD LOGIN --- */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="pwd-identifier-input">Gmail or Phone Number</label>
              <input
                id="pwd-identifier-input"
                type="text"
                className="form-input"
                placeholder="e.g. alex@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
              {loading ? 'Signing In...' : 'Sign In with Password'}
            </button>
          </form>
        )}

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
