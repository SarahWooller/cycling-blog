'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/authContext';

export default function HeroActions({ featuredSlug }) {
  const { user, isBlogger, isLoggedIn } = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        marginTop: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {/* Bloggers & Admins get Write New Chronicle & View Drafts */}
      {isBlogger ? (
        <>
          <Link
            href="/new"
            id="hero-create-story-btn"
            style={{
              backgroundColor: '#c49a45',
              color: '#123f36',
              padding: '14px 34px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '1.02rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 6px 24px rgba(196, 154, 69, 0.45)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>+ Write New Chronicle</span>
            <span>✍️</span>
          </Link>

          <Link
            href="/#drafts"
            id="hero-view-drafts-btn"
            style={{
              backgroundColor: 'rgba(18, 63, 54, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#e8dcc4',
              border: '1px solid rgba(196, 154, 69, 0.5)',
              padding: '14px 28px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>📝 View My Drafts</span>
          </Link>
        </>
      ) : (
        <a
          href="#chronicles"
          id="hero-explore-btn"
          style={{
            backgroundColor: '#c49a45',
            color: '#123f36',
            padding: '14px 34px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '1.02rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 6px 24px rgba(196, 154, 69, 0.45)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <span>🚴 Explore Chronicles</span>
          <span>↓</span>
        </a>
      )}

      {featuredSlug && (
        <Link
          href={`/blog/${featuredSlug}`}
          id="hero-latest-story-btn"
          style={{
            backgroundColor: 'rgba(18, 63, 54, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#e8dcc4',
            border: '1px solid rgba(196, 154, 69, 0.45)',
            padding: '14px 28px',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <span>Read Featured Ride</span>
          <span>📖</span>
        </Link>
      )}

      {/* Front page button to read author profiles */}
      <Link
        href={isLoggedIn ? `/author/${user.username}` : '/authors'}
        id="hero-read-profiles-btn"
        style={{
          backgroundColor: 'rgba(18, 63, 54, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#e8dcc4',
          border: '1px solid rgba(196, 154, 69, 0.45)',
          padding: '14px 28px',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '1rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <span>👤 {isLoggedIn ? 'Read My Profile' : 'Read Author Profiles'}</span>
        <span>→</span>
      </Link>
    </div>
  );
}
