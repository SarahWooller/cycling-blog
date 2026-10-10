'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSafeImageUrl } from '@/lib/imageUtils';
import { useAuth } from '@/lib/authContext';
import { calculateReadTimeMinutes } from '@/lib/readingTime';

export default function ChroniclesSection({ initialPosts = [] }) {
  const router = useRouter();
  const { user, token, isBlogger, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'drafts'
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [publishedPosts, setPublishedPosts] = useState(initialPosts);
  const [drafts, setDrafts] = useState([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState(null);

  // Sync initialPosts if parent updates
  useEffect(() => {
    setPublishedPosts(initialPosts);
  }, [initialPosts]);

  // Check URL hash for direct navigation to #drafts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#drafts' && isBlogger) {
      setActiveTab('drafts');
    }
  }, [isBlogger]);

  // Load drafts if blogger or admin
  useEffect(() => {
    if (!isBlogger || !token) {
      setDrafts([]);
      return;
    }

    let isMounted = true;
    setIsLoadingDrafts(true);

    fetch('/api/posts?status_filter=draft', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch drafts');
        return res.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setDrafts(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load drafts:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDrafts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isBlogger, token]);

  const handleDeletePost = async (e, post) => {
    e.stopPropagation();
    e.preventDefault();

    const isDraft = post.status === 'draft';
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${isDraft ? 'draft' : 'chronicle'} "${post.title || post.slug}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingSlug(post.slug);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(post.slug)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        if (isDraft) {
          setDrafts((prev) => prev.filter((p) => p.slug !== post.slug));
        } else {
          setPublishedPosts((prev) => prev.filter((p) => p.slug !== post.slug));
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete chronicle');
      }
    } catch (err) {
      alert('Error connecting to server to delete chronicle');
    } finally {
      setDeletingSlug(null);
    }
  };

  // Derive list of authors who have published posts
  const availableAuthors = useMemo(() => {
    const map = new Map();
    publishedPosts.forEach((p) => {
      if (p.author?.id && p.author?.display_name) {
        map.set(p.author.id, p.author.display_name);
      } else if (p.author_id) {
        map.set(p.author_id, 'Author');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [publishedPosts]);

  const filteredPublishedPosts = useMemo(() => {
    if (selectedAuthor === 'all') return publishedPosts;
    return publishedPosts.filter((p) => p.author_id === selectedAuthor || p.author?.id === selectedAuthor);
  }, [publishedPosts, selectedAuthor]);

  const displayedPosts = activeTab === 'drafts' ? drafts : filteredPublishedPosts;

  return (
    <section
      id="chronicles"
      style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 32px 80px',
        flex: 1,
      }}
    >
      {/* Section Header & Tabs */}
      <div
        style={{
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: '#f7f3ea',
                letterSpacing: '-0.01em',
              }}
            >
              {activeTab === 'drafts' ? '📝 Work-in-Progress Drafts' : 'Chronicles'}
            </h2>
            
            {/* Tab switch pills for Bloggers & Admins */}
            {isBlogger && (
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: 'rgba(18, 63, 54, 0.75)',
                  borderRadius: '999px',
                  padding: '3px',
                  border: '1px solid rgba(196, 154, 69, 0.35)',
                }}
              >
                <button
                  onClick={() => setActiveTab('published')}
                  id="tab-published-btn"
                  style={{
                    backgroundColor: activeTab === 'published' ? '#c49a45' : 'transparent',
                    color: activeTab === 'published' ? '#123f36' : '#c8beaa',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Chronicles ({publishedPosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('drafts')}
                  id="tab-drafts-btn"
                  style={{
                    backgroundColor: activeTab === 'drafts' ? '#c49a45' : 'transparent',
                    color: activeTab === 'drafts' ? '#123f36' : '#c8beaa',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  📝 My Drafts ({drafts.length})
                </button>
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.92rem', color: '#c8beaa', marginTop: '4px' }}>
            {activeTab === 'drafts'
              ? 'Drafts are private to you and administrator accounts. Select any draft to resume editing in Blank Canvas.'
              : 'Cycle tours, quick jaunts and general musings from cyclists around Sussex'}
          </p>

          {/* Author filter selector */}
          {activeTab === 'published' && availableAuthors.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '12px',
                flexWrap: 'wrap',
              }}
            >
              <label
                htmlFor="author-select-filter"
                style={{ fontSize: '0.84rem', color: '#c8beaa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>✍️</span>
                <span>Filter by Author:</span>
              </label>

              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  id="author-select-filter"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundColor: 'rgba(18, 63, 54, 0.9)',
                    color: '#f7f3ea',
                    border: '1px solid rgba(196, 154, 69, 0.45)',
                    borderRadius: '8px',
                    padding: '6px 36px 6px 14px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(9, 35, 40, 0.3)',
                    outline: 'none',
                  }}
                >
                  <option value="all" style={{ backgroundColor: '#123f36', color: '#f7f3ea' }}>
                    All Authors ({publishedPosts.length})
                  </option>
                  {availableAuthors.map((auth) => {
                    const count = publishedPosts.filter((p) => p.author_id === auth.id || p.author?.id === auth.id).length;
                    return (
                      <option key={auth.id} value={auth.id} style={{ backgroundColor: '#123f36', color: '#f7f3ea' }}>
                        {auth.name} ({count})
                      </option>
                    );
                  })}
                </select>
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#c49a45',
                    fontSize: '0.75rem',
                  }}
                >
                  ▼
                </span>
              </div>

              {selectedAuthor !== 'all' && (
                <button
                  onClick={() => setSelectedAuthor('all')}
                  id="author-filter-reset-btn"
                  title="Clear author filter"
                  style={{
                    backgroundColor: 'rgba(196, 154, 69, 0.15)',
                    color: '#c49a45',
                    border: '1px solid rgba(196, 154, 69, 0.35)',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>✕</span>
                  <span>Clear Filter</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Button: only visible to Bloggers and Admins */}
        {isBlogger && (
          <Link
            href="/new"
            id="section-new-story-btn"
            style={{
              fontSize: '0.88rem',
              color: '#123f36',
              backgroundColor: '#c49a45',
              padding: '8px 18px',
              borderRadius: '999px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(196, 154, 69, 0.3)',
            }}
          >
            <span>+ Write New Chronicle</span>
            <span>✍️</span>
          </Link>
        )}
      </div>

      {/* Drafts Loading State */}
      {activeTab === 'drafts' && isLoadingDrafts && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#c8beaa' }}>
          Loading your saved drafts...
        </div>
      )}

      {/* Empty State for Drafts */}
      {activeTab === 'drafts' && !isLoadingDrafts && drafts.length === 0 && (
        <div
          style={{
            backgroundColor: 'rgba(18, 63, 54, 0.65)',
            border: '1px dashed rgba(196, 154, 69, 0.4)',
            borderRadius: '16px',
            padding: '56px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>📝</div>
          <h3 style={{ color: '#f7f3ea', fontSize: '1.25rem', fontWeight: 600 }}>
            No Active Drafts Found
          </h3>
          <p style={{ color: '#c8beaa', maxWidth: '440px', fontSize: '0.92rem' }}>
            Whenever you click <strong>Save Draft</strong> in Blank Canvas, your unfinished chronicles are safely preserved here for you to resume anytime.
          </p>
          <Link
            href="/new"
            style={{
              backgroundColor: '#c49a45',
              color: '#123f36',
              padding: '10px 24px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              marginTop: '8px',
            }}
          >
            ✍️ Start a New Chronicle
          </Link>
        </div>
      )}

      {/* Posts & Drafts Grid - Entire card is clickable */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '28px',
        }}
      >
        {displayedPosts.map((post) => {
          const coverPhoto = post.photos?.[post.backdrop_index || post.backdropIndex || 0] || post.photos?.[0];
          const safeCoverUrl = coverPhoto
            ? getSafeImageUrl(coverPhoto.fullUrl || coverPhoto.baseUrl)
            : '';
          const isDraft = post.status === 'draft';
          const canDelete = isBlogger && (isAdmin || user?.id === post.author_id);
          const hasLocation = post.location && post.location.trim() !== '' && post.location !== 'Tour' && post.location !== 'Cycle Tour';

          const handleCardClick = () => {
            if (isDraft) {
              router.push(`/new?slug=${post.slug}`);
            } else {
              router.push(`/blog/${post.slug}`);
            }
          };

          return (
            <div
              key={post.id || post.slug}
              id={`post-card-${post.slug}`}
              onClick={handleCardClick}
              className="chronicle-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick();
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(18, 63, 54, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '18px',
                border: isDraft
                  ? '2px solid rgba(234, 179, 8, 0.7)'
                  : '1px solid rgba(196, 154, 69, 0.35)',
                overflow: 'hidden',
                boxShadow: isDraft
                  ? '0 6px 24px rgba(234, 179, 8, 0.18)'
                  : '0 8px 32px rgba(9, 35, 40, 0.45)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
              }}
            >
              {/* Card Cover Image */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  backgroundColor: '#092328',
                  overflow: 'hidden',
                }}
              >
                {safeCoverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={safeCoverUrl}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                    }}
                  />
                )}
                
                {/* Specific Location or Tour Badge */}
                {post.tour?.title ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(18, 63, 54, 0.92)',
                      backdropFilter: 'blur(8px)',
                      color: '#c49a45',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: '1px solid rgba(196, 154, 69, 0.5)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    🚲 {post.tour.title} {post.day_number ? `• Day ${post.day_number}` : ''}
                  </div>
                ) : hasLocation ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(18, 63, 54, 0.88)',
                      backdropFilter: 'blur(8px)',
                      color: '#e8dcc4',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                    }}
                  >
                    📍 {post.location}
                  </div>
                ) : null}

                {/* Status Badge */}
                {isDraft ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#eab308',
                      color: '#123f36',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    📝 DRAFT
                  </div>
                ) : post.status === 'archived' ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(100, 116, 139, 0.9)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '6px',
                    }}
                  >
                    📦 ARCHIVED
                  </div>
                ) : null}

                {/* Photos Count */}
                {post.photos && post.photos.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(18, 63, 54, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#c49a45',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      border: '1px solid rgba(196, 154, 69, 0.3)',
                    }}
                  >
                    📷 {post.photos.length} photos
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: '#c8beaa', fontWeight: 500 }}>
                      {post.date || 'Autumn 2026'} {post.summary?.distance ? `• ${post.summary.distance}` : ''}
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: '#c49a45',
                        backgroundColor: 'rgba(196, 154, 69, 0.14)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 600,
                        border: '1px solid rgba(196, 154, 69, 0.28)',
                      }}
                    >
                      ⏱️ {calculateReadTimeMinutes(post.paragraphs)} min read
                    </span>
                  </div>
                  {typeof post.likes_count === 'number' && (
                    <span style={{ fontSize: '0.8rem', color: '#c49a45', fontWeight: 600 }}>
                      ❤️ {post.likes_count}
                    </span>
                  )}
                </div>

                {/* Author Byline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {post.author?.username ? (
                    <Link
                      href={`/author/${post.author.username}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '0.82rem',
                        color: '#7ee0cb',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                      }}
                    >
                      ✍️ {post.author?.display_name || 'VeloTales Author'}
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#7ee0cb', fontWeight: 600 }}>
                      ✍️ {post.author?.display_name || 'VeloTales Author'}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: '#f7f3ea',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {post.title}
                </h3>

                {/* Tags Pills */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {post.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          color: '#c49a45',
                          backgroundColor: 'rgba(196, 154, 69, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <p
                  style={{
                    fontSize: '0.94rem',
                    color: '#e8dcc4',
                    lineHeight: 1.65,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1,
                    fontFamily: 'var(--font-body)',
                    opacity: 0.9,
                  }}
                >
                  {post.paragraphs?.[0]}
                </p>

                {/* Card Actions Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(196, 154, 69, 0.25)',
                    gap: '12px',
                  }}
                >
                  {isDraft ? (
                    <>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link
                          href={`/new?slug=${post.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          id={`edit-draft-btn-${post.slug}`}
                          style={{
                            backgroundColor: '#c49a45',
                            color: '#123f36',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            padding: '6px 16px',
                            borderRadius: '999px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(196, 154, 69, 0.35)',
                          }}
                        >
                          <span>✏️</span>
                          <span>Edit Draft</span>
                        </Link>

                        <span
                          style={{
                            color: '#c8beaa',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                          }}
                        >
                          Click card to edit
                        </span>
                      </div>

                      {canDelete && (
                        <button
                          onClick={(e) => handleDeletePost(e, post)}
                          disabled={deletingSlug === post.slug}
                          title="Delete this draft"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {deletingSlug === post.slug ? 'Deleting...' : '🗑️ Delete'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          color: '#c49a45',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Read Full Chronicle</span>
                        <span>→</span>
                      </span>

                      {canDelete && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Link
                            href={`/new?slug=${post.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.8rem',
                              color: '#c8beaa',
                              textDecoration: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(196, 154, 69, 0.25)',
                            }}
                          >
                            ✏️ Edit
                          </Link>

                          <button
                            onClick={(e) => handleDeletePost(e, post)}
                            disabled={deletingSlug === post.slug}
                            title="Delete this chronicle"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {deletingSlug === post.slug ? 'Deleting...' : '🗑️'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
