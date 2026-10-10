'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(18, 63, 54, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(196, 154, 69, 0.25)',
          padding: '14px 36px',
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

        {/* Right Action: Sign In / Join (or account profile) */}
        <div>
          <button
            onClick={() => setAuthModalOpen(true)}
            id="nav-auth-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLoggedIn ? 'rgba(42, 107, 92, 0.35)' : 'rgba(18, 63, 54, 0.7)',
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
            <span>{isLoggedIn ? '👤' : '🔑'}</span>
            <span>
              {isLoggedIn ? user.display_name : 'Sign In / Join'}
            </span>
            {isLoggedIn && (
              <span
                style={{
                  fontSize: '0.68rem',
                  backgroundColor: '#c49a45',
                  color: '#123f36',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  marginLeft: '4px',
                }}
              >
                {user.role}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
