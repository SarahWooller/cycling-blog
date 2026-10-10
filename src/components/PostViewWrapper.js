'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BlogReader from './BlogReader';
import { useAuth } from '@/lib/authContext';
import AuthModal from './AuthModal';

export default function PostViewWrapper({ slug, initialPost }) {
  const { user, token, isLoggedIn } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [isLoading, setIsLoading] = useState(!initialPost);
  const [error, setError] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // If SSR already found the post, use it
    if (initialPost) {
      setPost(initialPost);
      setIsLoading(false);
      return;
    }

    // SSR returned null (likely a private draft). Try client-side authenticated fetch.
    let isMounted = true;
    setIsLoading(true);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(`/api/posts/${encodeURIComponent(slug)}`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.error || 'Chronicle not found or private');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setPost(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, initialPost, token]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: '#e8dcc4',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '2rem' }}>🚲</div>
        <p style={{ fontSize: '1.1rem' }}>Loading chronicle...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div
        style={{
          maxWidth: '680px',
          margin: '80px auto',
          padding: '48px 32px',
          textAlign: 'center',
          backgroundColor: 'rgba(18, 63, 54, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          border: '1px solid rgba(196, 154, 69, 0.4)',
          color: '#e8dcc4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: '#f7f3ea' }}>
          Chronicle Not Found or Restricted
        </h2>
        <p style={{ color: '#c8beaa', maxWidth: '480px', lineHeight: 1.6 }}>
          This cycling chronicle is either saved as a private draft, or requires an author/administrator login to view.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <button
            onClick={() => setAuthModalOpen(true)}
            style={{
              backgroundColor: '#c49a45',
              color: '#123f36',
              padding: '12px 26px',
              borderRadius: '999px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.92rem',
            }}
          >
            🔑 {isLoggedIn ? 'Switch Account' : 'Sign In as Author'}
          </button>

          <Link
            href="/"
            style={{
              backgroundColor: 'transparent',
              color: '#e8dcc4',
              border: '1px solid rgba(196, 154, 69, 0.4)',
              padding: '12px 24px',
              borderRadius: '999px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.92rem',
            }}
          >
            ← Back to All Chronicles
          </Link>
        </div>

        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return <BlogReader post={post} />;
}
