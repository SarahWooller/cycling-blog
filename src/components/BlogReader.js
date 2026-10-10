'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DuotoneBackdrop from './DuotoneBackdrop';
import MultimediaBand from './MultimediaBand';
import { likePostApi, fetchCommentsApi, submitCommentApi } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import AuthModal from './AuthModal';
import { calculateReadTimeMinutes } from '@/lib/readingTime';

export default function BlogReader({ post, onBackdropChange = null }) {
  const router = useRouter();
  const { user, token, isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [backdropIndex, setBackdropIndex] = useState(post?.backdropIndex || post?.backdrop_index || 0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Likes state
  const [likesCount, setLikesCount] = useState(post?.likes_count || 12);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [hpField, setHpField] = useState(''); // Anti-bot honeypot
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentMessage, setCommentMessage] = useState(null);

  const photos = post?.photos || [];
  const paragraphs = post?.paragraphs || [];
  const postStatus = post?.status || 'published';
  const isArchived = postStatus === 'archived';
  const isDraft = postStatus === 'draft';

  // Load comments
  useEffect(() => {
    if (post?.slug) {
      fetchCommentsApi(post.slug).then((res) => {
        if (Array.isArray(res)) setComments(res);
      });
    }
  }, [post?.slug]);

  const [tourData, setTourData] = useState(null);

  // Fetch tour series details if chronicle belongs to a tour
  useEffect(() => {
    if (!post?.tour_id) {
      setTourData(null);
      return;
    }
    fetch(`/api/tours/${post.tour_id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setTourData(data);
      })
      .catch(() => {});
  }, [post?.tour_id]);

  const leftPanelRef = useRef(null);

  // Track scroll reading progress (from left panel if independently scrolling, or window)
  useEffect(() => {
    const handleScroll = () => {
      const el = leftPanelRef.current;
      if (el && el.scrollHeight > el.clientHeight) {
        const total = el.scrollHeight - el.clientHeight;
        const progress = (el.scrollTop / total) * 100;
        setScrollProgress(Math.min(Math.max(progress, 0), 100));
        return;
      }
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(Math.min(Math.max(currentProgress, 0), 100));
      }
    };

    const el = leftPanelRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSetBackdrop = (index) => {
    setBackdropIndex(index);
    if (onBackdropChange) {
      onBackdropChange(index);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    if (hasLiked || isLiking || !post?.slug) return;
    setIsLiking(true);
    try {
      const res = await likePostApi(post.slug, token);
      if (res) {
        setLikesCount(res.likes_count);
        setHasLiked(true);
      }
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    if (!commentContent.trim() || !post?.slug) return;

    setIsSubmittingComment(true);
    setCommentMessage(null);

    try {
      const res = await submitCommentApi(
        post.slug,
        {
          author_name: user?.display_name || 'Fellow Cyclist',
          content: commentContent.trim(),
          hp_field: hpField
        },
        token
      );

      if (res && res.id) {
        if (res.is_approved) {
          setComments((prev) => [...prev, res]);
          setCommentMessage({ text: '✓ Comment posted successfully!', type: 'success' });
        } else {
          setCommentMessage({
            text: '✓ Thank you! Your reflection has been submitted and is pending author review.',
            type: 'info'
          });
        }
        setCommentContent('');
      } else {
        setCommentMessage({ text: res?.error || 'Failed to submit comment', type: 'error' });
      }
    } catch (err) {
      setCommentMessage({ text: 'Network error submitting comment', type: 'error' });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!post?.slug) return;
    const isDraft = post?.status === 'draft';
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${isDraft ? 'draft' : 'chronicle'} "${post.title || post.slug}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(post.slug)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        router.push('/');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete chronicle');
      }
    } catch (err) {
      alert('Error connecting to server to delete chronicle');
    } finally {
      setIsDeleting(false);
    }
  };

  const backdropPhoto = photos[backdropIndex] || photos[0];

  return (
    <div className="blog-reader-page" style={{ position: 'relative', width: '100%' }}>
      {/* Scroll Progress Bar with Golden Ochre Glow */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${scrollProgress}%`,
          height: '4px',
          backgroundColor: '#c49a45',
          zIndex: 1000,
          boxShadow: '0 0 12px rgba(196, 154, 69, 0.85)',
          transition: 'width 0.1s linear',
        }}
      />

      {/* Duotone Earthy Backdrop (Pine & Gold) with top alignment */}
      <DuotoneBackdrop
        imageUrl={backdropPhoto?.fullUrl || backdropPhoto?.baseUrl}
        alt="Duotone Cycling Backdrop"
        position="center top"
      />

      {/* Vibrant Outer Frame & Content Grid */}
      <main className="vibrant-frame">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 440px',
            gap: '36px',
            alignItems: 'start',
          }}
          className="blog-layout-grid"
        >
          {/* LEFT: Main Blog Reading Canvas (Cream Linen Glass) */}
          <article
            ref={leftPanelRef}
            className="glass-panel left-story-panel"
            style={{
              padding: '48px 56px',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}
          >
            {/* Work-in-Progress Draft Banner */}
            {isDraft && (
              <div
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.5)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  color: '#854d0e',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>📝</span>
                  <div>
                    <strong style={{ fontSize: '0.96rem', display: 'block' }}>Work-in-Progress Draft</strong>
                    <span style={{ fontSize: '0.84rem', opacity: 0.9 }}>
                      This draft is private and only visible to you. It has not been published publicly.
                    </span>
                  </div>
                </div>
                {(user?.id === post?.author_id || user?.role === 'admin') && (
                  <Link
                    href={`/new?slug=${post.slug}`}
                    id="draft-banner-resume-edit-btn"
                    style={{
                      backgroundColor: '#c49a45',
                      color: '#123f36',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      padding: '8px 18px',
                      borderRadius: '999px',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(196, 154, 69, 0.4)',
                    }}
                  >
                    ✏️ Resume Editing Draft
                  </Link>
                )}
              </div>
            )}

            {/* Chaining Chronicles: Tour Series Header Banner */}
            {(tourData || post?.tour) && (() => {
              const tourPosts = tourData?.posts || [];
              const currentIndex = tourPosts.findIndex((p) => p.slug === post?.slug || p.id === post?.id);
              const prevPost = currentIndex > 0 ? tourPosts[currentIndex - 1] : null;
              const nextPost = currentIndex >= 0 && currentIndex < tourPosts.length - 1 ? tourPosts[currentIndex + 1] : null;

              return (
                <div
                  style={{
                    backgroundColor: 'rgba(18, 63, 54, 0.08)',
                    border: '1px solid rgba(196, 154, 69, 0.35)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🚲</span>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#c49a45', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Part of Tour Series
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#123f36', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                          {tourData?.title || post.tour?.title} {post.day_number ? `• Day ${post.day_number}` : ''} {tourPosts.length > 0 ? `of ${tourPosts.length}` : ''}
                        </h4>
                      </div>
                    </div>

                    {tourPosts.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#718096', fontWeight: 600 }}>Jump to stage:</span>
                        <select
                          value={post?.slug}
                          onChange={(e) => {
                            if (e.target.value && e.target.value !== post?.slug) {
                              router.push(`/blog/${e.target.value}`);
                            }
                          }}
                          style={{
                            backgroundColor: '#fff',
                            border: '1px solid rgba(196, 154, 69, 0.4)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.82rem',
                            color: '#123f36',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {tourPosts.map((tp, idx) => (
                            <option key={tp.id || tp.slug} value={tp.slug}>
                              {tp.day_number ? `Day ${tp.day_number}: ` : `Stage ${idx + 1}: `}{tp.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {(prevPost || nextPost) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(196, 154, 69, 0.15)', fontSize: '0.84rem' }}>
                      {prevPost ? (
                        <Link
                          href={`/blog/${prevPost.slug}`}
                          style={{ color: '#2a6b5c', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>← Prev: {prevPost.day_number ? `Day ${prevPost.day_number}` : prevPost.title}</span>
                        </Link>
                      ) : <span />}

                      {nextPost ? (
                        <Link
                          href={`/blog/${nextPost.slug}`}
                          style={{ color: '#c49a45', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>Next: {nextPost.day_number ? `Day ${nextPost.day_number}` : nextPost.title} →</span>
                        </Link>
                      ) : <span />}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Header & Meta Badges */}
            <header style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {/* Specific Location Badge */}
                {post?.location && post.location.trim() !== '' && post.location !== 'Tour' && post.location !== 'Cycle Tour' && post.location !== 'Cycling Tour' && (
                  <span
                    style={{
                      backgroundColor: 'rgba(42, 107, 92, 0.14)',
                      color: '#123f36',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(196, 154, 69, 0.3)',
                    }}
                  >
                    📍 {post.location}
                  </span>
                )}

                {/* Status Badges */}
                {isDraft && (
                  <span
                    style={{
                      backgroundColor: 'rgba(234, 179, 8, 0.2)',
                      color: '#854d0e',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid rgba(234, 179, 8, 0.5)',
                    }}
                  >
                    📝 Draft (Private)
                  </span>
                )}

                {isArchived && (
                  <span
                    style={{
                      backgroundColor: 'rgba(100, 116, 139, 0.2)',
                      color: '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid rgba(100, 116, 139, 0.4)',
                    }}
                  >
                    📦 Archived Record
                  </span>
                )}

                <span style={{ fontSize: '0.85rem', color: '#2a6b5c', fontWeight: 500 }}>
                  🗓️ {post?.date || 'Autumn 2026'}
                </span>
                
                {post?.author?.display_name && (
                  post?.author?.username ? (
                    <Link
                      href={`/author/${post.author.username}`}
                      style={{ fontSize: '0.85rem', color: '#2a6b5c', fontWeight: 600, textDecoration: 'none' }}
                    >
                      ✍️ {post.author.display_name}
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#2a6b5c', fontWeight: 600 }}>
                      ✍️ {post.author.display_name}
                    </span>
                  )
                )}

                <span style={{ fontSize: '0.85rem', color: '#2a6b5c', fontWeight: 500 }}>
                  ⏱️ {calculateReadTimeMinutes(paragraphs)} min read
                </span>

                {/* Author or Admin Controls: Edit & Delete */}
                {(user?.id === post?.author_id || user?.role === 'admin') && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                      href={`/new?slug=${post.slug}`}
                      id="reader-edit-chronicle-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#c49a45',
                        color: '#123f36',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        padding: '5px 14px',
                        borderRadius: '999px',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(196, 154, 69, 0.35)',
                      }}
                    >
                      <span>✏️</span>
                      <span>{isDraft ? 'Edit Draft' : 'Edit Chronicle'}</span>
                    </Link>

                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      id="reader-delete-chronicle-btn"
                      title="Permanently delete this chronicle"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        padding: '5px 12px',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>🗑️</span>
                      <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                )}
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  lineHeight: 1.18,
                  color: '#123f36',
                  letterSpacing: '-0.02em',
                }}
              >
                {post?.title || 'Day 1 Kent Cycling - Autumn 2026'}
              </h1>

              {/* Tags if present */}
              {Array.isArray(post?.tags) && post.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '-4px' }}>
                  {post.tags.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        color: '#2a6b5c',
                        backgroundColor: 'rgba(42, 107, 92, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Source Link Chips & Likes Action */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  paddingTop: '8px',
                  borderBottom: '1px solid rgba(196, 154, 69, 0.25)',
                  paddingBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  {(post?.docUrl || post?.doc_url) && (
                    <a
                      href={post.docUrl || post.doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.78rem',
                        color: '#123f36',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(196, 154, 69, 0.15)',
                        border: '1px solid rgba(196, 154, 69, 0.35)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>📄 Google Doc Story</span>
                      <span style={{ fontSize: '0.7rem' }}>↗</span>
                    </a>
                  )}

                  {(post?.photosAlbumUrl || post?.photos_album_url) && (
                    <a
                      href={post.photosAlbumUrl || post.photos_album_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.78rem',
                        color: '#123f36',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(42, 107, 92, 0.15)',
                        border: '1px solid rgba(42, 107, 92, 0.3)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>🖼️ Google Photos Album</span>
                      <span style={{ fontSize: '0.7rem' }}>↗</span>
                    </a>
                  )}
                </div>

                {/* Heart / Like Button (Requires Login to Police Abuse) */}
                <button
                  onClick={handleLike}
                  id="like-post-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    backgroundColor: hasLiked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(18, 63, 54, 0.08)',
                    border: hasLiked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(18, 63, 54, 0.2)',
                    color: hasLiked ? '#dc2626' : '#123f36',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                  }}
                  title={isLoggedIn ? (hasLiked ? 'You liked this chronicle' : 'Like this chronicle') : 'Sign in to like'}
                >
                  <span>{hasLiked ? '❤️' : '🤍'}</span>
                  <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                  {!isLoggedIn && <span style={{ fontSize: '0.72rem', color: '#2a6b5c', fontWeight: 500 }}>(sign in)</span>}
                </button>
              </div>
            </header>

            {/* Reading Story Text with Drop-Cap and Typography */}
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.14rem',
                lineHeight: 1.82,
                color: '#18332c',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {paragraphs.map((paragraph, index) => {
                // Drop cap on first paragraph with Warm Golden Ochre
                if (index === 0) {
                  return (
                    <p key={index} style={{ position: 'relative' }}>
                      <span
                        style={{
                          float: 'left',
                          fontSize: '3.8rem',
                          lineHeight: 0.85,
                          paddingTop: '6px',
                          paddingRight: '12px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 800,
                          color: '#c49a45',
                        }}
                      >
                        {paragraph.charAt(0)}
                      </span>
                      {paragraph.slice(1)}
                    </p>
                  );
                }

                // Callout quote with gold border
                if (paragraph.includes('Scotney castle') || paragraph.includes('pilgrimage') || paragraph.includes('Covid summer')) {
                  return (
                    <div
                      key={index}
                      style={{
                        margin: '12px 0',
                        padding: '20px 24px',
                        backgroundColor: 'rgba(196, 154, 69, 0.1)',
                        borderLeft: '4px solid #c49a45',
                        borderRadius: '0 12px 12px 0',
                        fontStyle: 'italic',
                        color: '#123f36',
                      }}
                    >
                      <p style={{ margin: 0 }}>{paragraph}</p>
                    </div>
                  );
                }

                return (
                  <p key={index} style={{ marginBottom: '4px' }}>
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Comments & Reader Engagement Section */}
            <section
              style={{
                marginTop: '40px',
                paddingTop: '32px',
                borderTop: '1px solid rgba(196, 154, 69, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: '#123f36',
                    margin: 0,
                  }}
                >
                  💬 Reader Reflections ({comments.length})
                </h3>
              </div>

              {/* Comments List */}
              {comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.65)',
                        border: '1px solid rgba(196, 154, 69, 0.25)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#123f36', fontSize: '0.95rem' }}>
                          🚴 {c.author_name}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : 'Recently'}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.55 }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                  No reflections yet. Be the first registered rider to share your thoughts!
                </p>
              )}

              {/* Comment Submission or Login Prompt */}
              {isArchived ? (
                <div
                  style={{
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    border: '1px dashed #94a3b8',
                    borderRadius: '10px',
                    padding: '16px',
                    fontSize: '0.88rem',
                    color: '#475569',
                    textAlign: 'center',
                  }}
                >
                  🔒 Comments are closed on this archived chronicle.
                </div>
              ) : !isLoggedIn ? (
                // Logged-out Reader Callout Card
                <div
                  style={{
                    backgroundColor: 'rgba(42, 107, 92, 0.12)',
                    border: '1px solid rgba(196, 154, 69, 0.35)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>🛡️</div>
                  <h4 style={{ margin: 0, color: '#123f36', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                    Join the Discussion
                  </h4>
                  <p style={{ margin: 0, color: '#2a6b5c', fontSize: '0.9rem', maxWidth: '440px', lineHeight: 1.5 }}>
                    To ensure a respectful cycling space free from hate mail and harassment, only logged-in readers can post reflections and like posts.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    id="comment-login-trigger-btn"
                    style={{
                      marginTop: '6px',
                      backgroundColor: '#123f36',
                      color: '#e8dcc4',
                      padding: '10px 24px',
                      borderRadius: '999px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    🔑 Sign In or Join as Reader
                  </button>
                </div>
              ) : (
                // Authenticated Comment Form
                <form
                  onSubmit={handleCommentSubmit}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.55)',
                    border: '1px solid rgba(196, 154, 69, 0.3)',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#123f36', fontSize: '0.95rem' }}>
                      Leave a Reflection:
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#2a6b5c', fontWeight: 600 }}>
                      Commenting as: 🚴 {user?.display_name}
                    </span>
                  </div>

                  {commentMessage && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        backgroundColor: commentMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(42, 107, 92, 0.15)',
                        color: commentMessage.type === 'error' ? '#991b1b' : '#123f36',
                        border: `1px solid ${commentMessage.type === 'error' ? '#ef4444' : '#2a6b5c'}`,
                      }}
                    >
                      {commentMessage.text}
                    </div>
                  )}

                  {/* Honeypot anti-bot input */}
                  <input
                    type="text"
                    value={hpField}
                    onChange={(e) => setHpField(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex="-1"
                    autoComplete="off"
                  />

                  <textarea
                    placeholder="Share a reflection, road tip, or route question..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={3}
                    required
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#123f36',
                      fontSize: '0.92rem',
                      resize: 'vertical',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentContent.trim()}
                      id="submit-comment-btn"
                      style={{
                        backgroundColor: '#123f36',
                        color: '#e8dcc4',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        padding: '8px 20px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: isSubmittingComment || !commentContent.trim() ? 0.6 : 1,
                      }}
                    >
                      {isSubmittingComment ? 'Submitting...' : 'Post Reflection'}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Chained Tour Navigation Footer */}
            {(() => {
              const tourPosts = tourData?.posts || [];
              const currentIndex = tourPosts.findIndex((p) => p.slug === post?.slug || p.id === post?.id);
              const prevPost = currentIndex > 0 ? tourPosts[currentIndex - 1] : null;
              const nextPost = currentIndex >= 0 && currentIndex < tourPosts.length - 1 ? tourPosts[currentIndex + 1] : null;

              if (!prevPost && !nextPost) return null;

              return (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    backgroundColor: 'rgba(18, 63, 54, 0.06)',
                    borderRadius: '12px',
                    border: '1px solid rgba(196, 154, 69, 0.25)',
                    marginTop: '16px',
                  }}
                >
                  {prevPost ? (
                    <Link
                      href={`/blog/${prevPost.slug}`}
                      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                    >
                      <span style={{ fontSize: '0.74rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>← Previous Stage</span>
                      <strong style={{ fontSize: '0.92rem', color: '#123f36' }}>{prevPost.title}</strong>
                    </Link>
                  ) : <span />}

                  {nextPost ? (
                    <Link
                      href={`/blog/${nextPost.slug}`}
                      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', textAlign: 'right' }}
                    >
                      <span style={{ fontSize: '0.74rem', color: '#c49a45', textTransform: 'uppercase', fontWeight: 700 }}>Next Stage →</span>
                      <strong style={{ fontSize: '0.92rem', color: '#123f36' }}>{nextPost.title}</strong>
                    </Link>
                  ) : <span />}
                </div>
              );
            })()}

            {/* Footer / End of Post Note */}
            <footer
              style={{
                marginTop: '16px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(196, 154, 69, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#2a6b5c',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <div>End of Chronicle</div>
              <div style={{ fontStyle: 'italic' }}>Captured with Google Photos & Docs (Zero local file storage)</div>
            </footer>

            {/* Generous bottom scroll buffer so the story footer is never chopped off */}
            <div style={{ minHeight: '64px', height: '64px', width: '100%', flexShrink: 0 }} />
          </article>

          {/* RIGHT: Multimedia Band with Slideshow, Thumbnails, Summary, Route Map */}
          <div className="right-multimedia-panel">
            <MultimediaBand
              photos={photos}
              summary={post?.summary}
              links={post?.links}
              routeMapUrl={post?.routeMapUrl || post?.route_map_url}
              gpxFiles={post?.gpx_files || []}
              gpxUrl={post?.gpx_url || post?.gpxUrl}
              activePhotoIndex={activePhotoIndex}
              onSelectPhoto={(idx) => setActivePhotoIndex(idx)}
              onSetAsBackdrop={handleSetBackdrop}
              currentBackdropIndex={backdropIndex}
            />
          </div>
        </div>
      </main>

      {/* Auth Modal for Log In / Register / Reset Password */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <style jsx>{`
        @media (min-width: 1025px) {
          .blog-reader-page {
            flex: 1;
            height: 100%;
            max-height: 100%;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
          }
          .blog-reader-page :global(.vibrant-frame) {
            flex: 1;
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
            overflow: hidden;
            padding: 16px 36px 16px !important;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .blog-layout-grid {
            flex: 1;
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
            grid-template-columns: minmax(0, 1fr) 460px !important;
            align-items: stretch !important;
            overflow: hidden;
          }
          .left-story-panel {
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(196, 154, 69, 0.45) transparent;
            padding-bottom: 72px !important;
            box-sizing: border-box;
          }
          .right-multimedia-panel {
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            overscroll-behavior: contain;
            padding-right: 8px;
            padding-bottom: 72px !important;
            scrollbar-width: thin;
            scrollbar-color: rgba(196, 154, 69, 0.45) transparent;
            box-sizing: border-box;
          }
          .left-story-panel::-webkit-scrollbar,
          .right-multimedia-panel::-webkit-scrollbar {
            width: 6px;
          }
          .left-story-panel::-webkit-scrollbar-thumb,
          .right-multimedia-panel::-webkit-scrollbar-thumb {
            background-color: rgba(196, 154, 69, 0.45);
            border-radius: 999px;
          }
        }
        @media (max-width: 1024px) {
          .blog-layout-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .left-story-panel,
          .right-multimedia-panel {
            height: auto !important;
            overflow-y: visible !important;
            padding-bottom: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
