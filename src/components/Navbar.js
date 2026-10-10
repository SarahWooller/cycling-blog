'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import AuthModal from './AuthModal';
import { getSafeImageUrl } from '@/lib/imageUtils';

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(18, 63, 54, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(196, 154, 69, 0.28)',
          padding: '12px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand: Velotales */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#e8dcc4',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              fontSize: '1.25rem',
              background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(196, 154, 69, 0.3)',
            }}
          >
            🚲
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.45rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #f7f3ea 0%, #e8dcc4 60%, #c49a45 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            VeloTales
          </span>
        </Link>

        {/* Center / Right Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            href="/#chronicles"
            style={{
              color: '#e8dcc4',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              opacity: 0.9,
              transition: 'opacity 0.2s',
            }}
          >
            🌾 Chronicles
          </Link>

          <Link
            href="/authors"
            id="nav-authors-directory-btn"
            style={{
              color: '#e8dcc4',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              opacity: 0.9,
              transition: 'opacity 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>👥</span>
            <span>Authors</span>
          </Link>

          {/* User Account Menu / Auth Button */}
          {isLoggedIn ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                id="nav-user-menu-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(42, 107, 92, 0.4)',
                  border: '1px solid rgba(196, 154, 69, 0.45)',
                  color: '#f7f3ea',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getSafeImageUrl(user.avatar_url)}
                    alt={user.display_name}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>👤</span>
                )}
                <span>{user.display_name}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    backgroundColor: '#c49a45',
                    color: '#123f36',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#c49a45' }}>▼</span>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    backgroundColor: 'rgba(18, 63, 54, 0.97)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(196, 154, 69, 0.4)',
                    borderRadius: '14px',
                    boxShadow: '0 12px 36px rgba(9, 35, 40, 0.55)',
                    padding: '8px 0',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  <div style={{ padding: '8px 16px 10px', borderBottom: '1px solid rgba(196, 154, 69, 0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#f7f3ea', fontSize: '0.9rem' }}>{user.display_name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#c8beaa' }}>@{user.username}</div>
                  </div>

                  <Link
                    href={`/author/${user.username}`}
                    onClick={() => setUserMenuOpen(false)}
                    id="menu-view-profile-btn"
                    style={{
                      padding: '10px 16px',
                      color: '#e8dcc4',
                      textDecoration: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(196, 154, 69, 0.18)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>👤</span>
                    <span>My Public Profile</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    id="menu-edit-profile-btn"
                    style={{
                      padding: '10px 16px',
                      color: '#e8dcc4',
                      textDecoration: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(196, 154, 69, 0.18)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>⚙️</span>
                    <span>Edit Profile & Settings</span>
                  </Link>

                  <Link
                    href="/authors"
                    onClick={() => setUserMenuOpen(false)}
                    id="menu-authors-directory-btn"
                    style={{
                      padding: '10px 16px',
                      color: '#e8dcc4',
                      textDecoration: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(196, 154, 69, 0.18)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>👥</span>
                    <span>Authors Directory</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      id="menu-admin-dashboard-btn"
                      style={{
                        padding: '10px 16px',
                        color: '#c49a45',
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderTop: '1px solid rgba(196, 154, 69, 0.2)',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(196, 154, 69, 0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>🛡️</span>
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <div style={{ borderTop: '1px solid rgba(196, 154, 69, 0.2)', marginTop: '4px', paddingTop: '4px' }}>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      id="menu-sign-out-btn"
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        color: '#f87171',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              id="nav-auth-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(18, 63, 54, 0.7)',
                border: '1px solid rgba(196, 154, 69, 0.4)',
                color: '#e8dcc4',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span>🔑</span>
              <span>Sign In / Join</span>
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
