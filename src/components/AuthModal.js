'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';

export default function AuthModal({ isOpen, onClose }) {
  const { user, isLoggedIn, login, register, resetPassword, logout } = useAuth();

  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await login(username, password);
    setSubmitting(false);
    if (res.success) {
      setMessage({ type: 'success', text: `✓ Welcome back, ${res.user.display_name}!` });
      setTimeout(() => onClose(), 800);
    } else {
      setMessage({ type: 'error', text: res.error });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await register({
      username,
      email,
      displayName: displayName || username,
      password
    });
    setSubmitting(false);
    if (res.success) {
      setMessage({ type: 'success', text: `✓ Welcome to VeloTales, ${res.user.display_name}! You can now like and leave reflections.` });
      setTimeout(() => onClose(), 1000);
    } else {
      setMessage({ type: 'error', text: res.error });
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await resetPassword(email, newPassword);
    setSubmitting(false);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setTimeout(() => setTab('login'), 1500);
    } else {
      setMessage({ type: 'error', text: res.error });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(9, 35, 40, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#123f36',
          border: '1px solid rgba(196, 154, 69, 0.45)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          color: '#e8dcc4',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: '#c8beaa',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {isLoggedIn ? (
          // Logged In State
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🚴</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: '#f7f3ea' }}>
              {user.display_name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#c49a45', fontWeight: 600 }}>
              Account Tier: {user.role.toUpperCase()}
            </div>
            <p style={{ fontSize: '0.88rem', color: '#c8beaa', margin: 0 }}>
              {user.email}
            </p>
            <div style={{ borderTop: '1px solid rgba(196, 154, 69, 0.25)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          // Logged Out State with Tabs
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(196, 154, 69, 0.25)', paddingBottom: '12px' }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setMessage(null); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  color: tab === 'login' ? '#c49a45' : '#c8beaa',
                  fontWeight: tab === 'login' ? 700 : 500,
                  borderBottom: tab === 'login' ? '2px solid #c49a45' : 'none',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setMessage(null); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  color: tab === 'register' ? '#c49a45' : '#c8beaa',
                  fontWeight: tab === 'register' ? 700 : 500,
                  borderBottom: tab === 'register' ? '2px solid #c49a45' : 'none',
                  cursor: 'pointer',
                }}
              >
                Join as Reader
              </button>
              <button
                type="button"
                onClick={() => { setTab('forgot'); setMessage(null); }}
                style={{
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  color: tab === 'forgot' ? '#c49a45' : '#c8beaa',
                  fontSize: '0.8rem',
                  fontWeight: tab === 'forgot' ? 700 : 500,
                  borderBottom: tab === 'forgot' ? '2px solid #c49a45' : 'none',
                  cursor: 'pointer',
                }}
              >
                Reset Password
              </button>
            </div>

            {message && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(42, 107, 92, 0.3)',
                  border: `1px solid ${message.type === 'error' ? '#ef4444' : '#c49a45'}`,
                  color: message.type === 'error' ? '#fca5a5' : '#f7f3ea',
                }}
              >
                {message.text}
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '6px' }}>
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. sarah or reader@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
                    color: '#123f36',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(196, 154, 69, 0.35)',
                  }}
                >
                  {submitting ? 'Signing in...' : 'Sign In to Like & Comment'}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.8rem', color: '#c8beaa', margin: 0 }}>
                  Registering gives you an official rider identity so you can heart chronicles and post reflections.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '4px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. kent_cyclist"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '4px' }}>
                    Display Name / Rider Alias
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Charlie Spokes"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '4px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '6px',
                    padding: '12px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
                    color: '#123f36',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Creating Account...' : 'Create Reader Account'}
                </button>
              </form>
            )}

            {/* TAB 3: RESET PASSWORD */}
            {tab === 'forgot' && (
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.8rem', color: '#c8beaa', margin: 0 }}>
                  Enter your registered user email to set a new password.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '6px' }}>
                    User Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#c8beaa', marginBottom: '6px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New secure password"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      backgroundColor: 'rgba(9, 35, 40, 0.8)',
                      color: '#fff',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
                    color: '#123f36',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
