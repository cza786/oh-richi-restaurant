'use client';

import React, { useState, useEffect, useRef } from 'react';

interface UserDetail {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  avatarUrl?: string;
}

interface MyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetail | null;
  onSaveUser?: (updatedUser: UserDetail) => void;
}

export default function MyDetailModal({ isOpen, onClose, user, onSaveUser }: MyDetailModalProps) {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('3098441238');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('2003-12-16');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePasswordSection, setShowChangePasswordSection] = useState(false);

  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || user.email?.split('@')[0] || 'chand_zaib');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      if (user.phone) setPhone(user.phone);
      if (user.gender) setGender(user.gender);
      if (user.dob) setDob(user.dob);
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Password validation if changing password
    if (showChangePasswordSection || newPassword || confirmPassword) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password to confirm changes.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirm password do not match.');
        return;
      }
    }

    setSaving(true);
    
    const updated = {
      ...user,
      username,
      firstName,
      lastName,
      email,
      phone,
      gender,
      dob,
      avatarUrl,
    };

    if (onSaveUser) {
      onSaveUser(updated);
    }

    setToast('Profile & Account Details updated successfully!');
    setTimeout(() => {
      setSaving(false);
      setToast('');
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }, 1200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99990,
        }}
      />

      {/* "My Detail" Popup Modal Window */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: '820px',
          maxHeight: '92vh',
          backgroundColor: '#f5f5f7',
          color: '#1a1a1a',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          zIndex: 99991,
          overflowY: 'auto',
          padding: '36px 40px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Top Header Row with Back Arrow */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            style={{
              position: 'absolute',
              left: 0,
              top: '2px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#ef4444',
              fontSize: '1.2rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            ‹
          </button>

          <h2 style={{
            margin: '0 0 4px 0',
            fontSize: '2rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: '#000000',
            letterSpacing: '0.5px',
          }}>
            My Detail
          </h2>
          
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280' }}>
            To update your details, username or password, edit the information below:
          </p>
        </div>

        {/* Avatar Photo & Upload Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            backgroundColor: '#000000',
            border: '3px solid #e5e7eb',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '3rem', color: '#ffffff' }}>👤</span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={handleAvatarUploadClick}
            style={{
              padding: '8px 24px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            }}
          >
            UPLOAD
          </button>
        </div>

        {/* 2-Column Editable Details Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            
            {/* FIRST NAME */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                FIRST NAME *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #9ca3af',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* LAST NAME */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                LAST NAME *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #9ca3af',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* USERNAME */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                USERNAME *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username / handle"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #9ca3af',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* EMAIL */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                EMAIL *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #9ca3af',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* PHONE NUMBER (+92) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                PHONE NUMBER (3XXXXXXXXX) *
              </label>
              <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid #9ca3af', backgroundColor: '#e5e7eb' }}>
                <span style={{
                  padding: '14px 14px',
                  backgroundColor: '#d1d5db',
                  color: '#111827',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  borderRight: '1px solid #9ca3af',
                }}>
                  +92
                </span>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="3098441238"
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    backgroundColor: '#e5e7eb',
                    border: 'none',
                    color: '#111827',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* GENDER */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                GENDER *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #9ca3af',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* DATE OF BIRTH */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                DATE OF BIRTH
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #9ca3af',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

          </div>

          {/* CHANGE PASSWORD ACCORDION / TOGGLE */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '14px',
            padding: '18px 20px',
            marginBottom: '28px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}>
            <div
              onClick={() => setShowChangePasswordSection(!showChangePasswordSection)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 800, textTransform: 'uppercase' }}>
                  🔑 CHANGE PASSWORD
                </strong>
                <small style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem', marginTop: '2px' }}>
                  Update your account login password for enhanced security
                </small>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ef4444' }}>
                {showChangePasswordSection ? '▲ Hide' : '▼ Change'}
              </span>
            </div>

            {showChangePasswordSection && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                {/* CURRENT PASSWORD */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    CURRENT PASSWORD *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: '#e5e7eb',
                        border: '1px solid #9ca3af',
                        color: '#111827',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: '1rem',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* NEW PASSWORD & CONFIRM PASSWORD GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                      NEW PASSWORD *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: '#e5e7eb',
                        border: '1px solid #9ca3af',
                        color: '#111827',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                      CONFIRM NEW PASSWORD *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: '#e5e7eb',
                        border: '1px solid #9ca3af',
                        color: '#111827',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validation Error Message */}
          {errorMsg && (
            <p style={{ color: '#ef4444', fontWeight: 800, textAlign: 'center', margin: '0 0 16px 0', fontSize: '0.88rem' }}>
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Success Toast */}
          {toast && (
            <p style={{ color: '#16a34a', fontWeight: 800, textAlign: 'center', margin: '0 0 16px 0', fontSize: '0.9rem' }}>
              ✓ {toast}
            </p>
          )}

          {/* Save Submit Button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1rem',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
              letterSpacing: '1px',
            }}
          >
            {saving ? 'SAVING CHANGES...' : 'SAVE DETAILS & PASSWORD'}
          </button>
        </form>
      </div>
    </>
  );
}
