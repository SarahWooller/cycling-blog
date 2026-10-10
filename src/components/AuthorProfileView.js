'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import DuotoneBackdrop from './DuotoneBackdrop';
import { getSafeImageUrl } from '@/lib/imageUtils';
import { useAuth } from '@/lib/authContext';
import { calculateReadTimeMinutes } from '@/lib/readingTime';

const DEFAULT_PROFILE_PHOTOS = [
  {
    id: 1,
    baseUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=240&h=240&q=80',
    title: 'On the Trail'
  },
  {
    id: 2,
    baseUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=240&h=240&q=80',
    title: 'Gravel Rig Setup'
  }
];

export default function AuthorProfileView({ initialAuthor }) {
  const { user, token, isAdmin } = useAuth();
  const [author, setAuthor] = useState(initialAuthor);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [backdropIndex, setBackdropIndex] = useState(author?.backdrop_index || 0);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(author?.display_name || '');
  const [location, setLocation] = useState(author?.location || '');
  const [cyclingStyle, setCyclingStyle] = useState(author?.cycling_style || '');
  const [bikeSetup, setBikeSetup] = useState(author?.bike_setup || '');
  const [bioText, setBioText] = useState(
    Array.isArray(author?.bio_paragraphs) ? author.bio_paragraphs.join('\n\n') : ''
  );
  const [links, setLinks] = useState(author?.links || []);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [photosAlbumUrl, setPhotosAlbumUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const canEdit = user && (user.id === author?.id || isAdmin);

  const photos = author?.photos && author.photos.length > 0 ? author.photos : DEFAULT_PROFILE_PHOTOS;
  const currentPhoto = photos[activePhotoIndex] || photos[0];
  const backdropPhoto = photos[backdropIndex] || photos[0];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setSaveStatus(null);

    const paragraphs = bioText
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      let fetchedPhotos = author.photos;
      if (photosAlbumUrl && photosAlbumUrl.trim() !== '') {
        try {
          const albumRes = await fetch(`/api/fetch-photos?url=${encodeURIComponent(photosAlbumUrl)}`);
          if (albumRes.ok) {
            const albumData = await albumRes.json();
            if (albumData.photos && albumData.photos.length > 0) {
              fetchedPhotos = albumData.photos;
            }
          }
        } catch (albumErr) {
          console.warn('Could not auto-fetch album photos:', albumErr);
        }
      }

      const payload = {
        display_name: displayName,
        location,
        cycling_style: cyclingStyle,
        bike_setup: bikeSetup,
        bio_paragraphs: paragraphs,
        links,
        photos: fetchedPhotos,
        backdrop_index: backdropIndex,
      };

      const res = await fetch(`/api/authors/${author.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setAuthor(updated);
        setIsEditing(false);
        setSaveStatus({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveStatus({ type: 'error', text: err.error || 'Failed to update profile' });
      }
    } catch (err) {
      setSaveStatus({ type: 'error', text: 'Network error updating profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLink = () => {
    if (!newLinkLabel || !newLinkUrl) return;
    setLinks([...links, { label: newLinkLabel.trim(), url: newLinkUrl.trim(), type: 'custom' }]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (idx) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  return (
    <div className="blog-reader-page" style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      {/* Duotone Earthy Backdrop */}
      <DuotoneBackdrop
        imageUrl={backdropPhoto?.fullUrl || backdropPhoto?.baseUrl}
        alt="Author Profile Backdrop"
        position="center top"
      />

      <Navbar />

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
          {/* LEFT: Author Biography & Chronicles Canvas */}
          <article
            className="glass-panel left-story-panel"
            style={{
              padding: '48px 56px',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              minHeight: '80vh',
            }}
          >
            {/* Author Header */}
            <header style={{ borderBottom: '1px solid rgba(196, 154, 69, 0.25)', paddingBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.84rem', color: '#c49a45', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      🚴 Author Profile
                    </span>
                    <span style={{ fontSize: '0.74rem', backgroundColor: 'rgba(196, 154, 69, 0.2)', color: '#c49a45', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {author?.role || 'Blogger'}
                    </span>
                  </div>

                  <h1
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: '#123f36',
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em',
                      margin: 0,
                    }}
                  >
                    {author?.display_name || 'VeloTales Author'}
                  </h1>

                  {/* Rider Details (Location, Style, Bike Setup) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', fontSize: '0.88rem', color: '#2a6b5c', fontWeight: 500 }}>
                    {author?.location && (
                      <span>📍 {author.location}</span>
                    )}
                    {author?.cycling_style && (
                      <span>• 🚵 {author.cycling_style}</span>
                    )}
                    {author?.bike_setup && (
                      <span>• 🚲 {author.bike_setup}</span>
                    )}
                  </div>
                </div>

                {/* Edit Button for Author / Admin */}
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    id="edit-profile-toggle-btn"
                    style={{
                      backgroundColor: isEditing ? 'rgba(18, 63, 54, 0.1)' : '#c49a45',
                      color: isEditing ? '#123f36' : '#123f36',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      borderRadius: '999px',
                      padding: '8px 18px',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{isEditing ? '✕ Cancel Editing' : '✏️ Edit Profile'}</span>
                  </button>
                )}
              </div>

              {saveStatus && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    backgroundColor: saveStatus.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: saveStatus.type === 'success' ? '#15803d' : '#b91c1c',
                    fontWeight: 600,
                  }}
                >
                  {saveStatus.text}
                </div>
              )}
            </header>

            {/* Profile Editing Form */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#123f36', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  Update Your Public Profile
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#123f36', marginBottom: '6px' }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.92rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#123f36', marginBottom: '6px' }}>
                      Location (e.g. Brighton, Sussex)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Lewes, East Sussex"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.92rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#123f36', marginBottom: '6px' }}>
                      Cycling Style
                    </label>
                    <input
                      type="text"
                      value={cyclingStyle}
                      onChange={(e) => setCyclingStyle(e.target.value)}
                      placeholder="e.g. Gravel & Audax Bikepacking"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.92rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#123f36', marginBottom: '6px' }}>
                      Bicycle Setup
                    </label>
                    <input
                      type="text"
                      value={bikeSetup}
                      onChange={(e) => setBikeSetup(e.target.value)}
                      placeholder="e.g. Fairlight Secan / 650b wheels"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#123f36', marginBottom: '6px' }}>
                    Author Biography (Paragraphs separated by double blank line)
                  </label>
                  <textarea
                    rows={6}
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Tell your cycling story, favorite routes in Sussex, and memorable adventures..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.92rem', lineHeight: 1.6 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#123f36', marginBottom: '6px' }}>
                    Profile Photos Google Photos Album Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={photosAlbumUrl}
                    onChange={(e) => setPhotosAlbumUrl(e.target.value)}
                    placeholder="Paste public Google Photos album URL (e.g. https://photos.app.goo.gl/...)"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.92rem' }}
                  />
                </div>

                {/* Hyperlinks Editor */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#123f36', marginBottom: '8px' }}>
                    External Profile Links (Strava, Komoot, Instagram, Website)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Label (e.g. Strava Profile)"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      style={{ flex: 1, minWidth: '160px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.88rem' }}
                    />
                    <input
                      type="url"
                      placeholder="URL (https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      style={{ flex: 2, minWidth: '220px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #c49a45', backgroundColor: '#fff', fontSize: '0.88rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      style={{ backgroundColor: '#123f36', color: '#f7f3ea', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      + Add Link
                    </button>
                  </div>

                  {links.map((link, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: 'rgba(18, 63, 54, 0.06)', borderRadius: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#123f36', fontWeight: 600 }}>
                        🔗 {link.label}: <a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#2a6b5c', fontWeight: 400 }}>{link.url}</a>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      backgroundColor: '#123f36',
                      color: '#f7f3ea',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontWeight: 700,
                      fontSize: '0.94rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(18, 63, 54, 0.25)',
                    }}
                  >
                    {isSaving ? 'Saving Changes...' : '💾 Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#123f36',
                      border: '1px solid rgba(18, 63, 54, 0.3)',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontWeight: 600,
                      fontSize: '0.94rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Biography Paragraphs */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {author?.bio_paragraphs && author.bio_paragraphs.length > 0 ? (
                    author.bio_paragraphs.map((p, idx) => (
                      <p
                        key={idx}
                        style={{
                          fontSize: '1.12rem',
                          lineHeight: 1.85,
                          color: '#2d3748',
                          fontFamily: 'var(--font-body)',
                          letterSpacing: '-0.01em',
                          margin: 0,
                        }}
                      >
                        {p}
                      </p>
                    ))
                  ) : (
                    <div style={{ padding: '24px', backgroundColor: 'rgba(18, 63, 54, 0.05)', borderRadius: '12px', color: '#4a5568', fontStyle: 'italic' }}>
                      <p style={{ margin: 0 }}>
                        {author?.display_name || 'This author'} has not written a public biography yet.
                      </p>
                    </div>
                  )}
                </section>

                {/* Published Chronicles by this Author */}
                <section style={{ borderTop: '1px solid rgba(196, 154, 69, 0.25)', paddingTop: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        color: '#123f36',
                        margin: 0,
                      }}
                    >
                      🌾 Chronicles by {author?.display_name || 'Author'}
                    </h2>
                    <span style={{ fontSize: '0.85rem', color: '#c49a45', fontWeight: 600 }}>
                      {author?.posts?.length || 0} chronicles
                    </span>
                  </div>

                  {author?.posts && author.posts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {author.posts.map((post) => (
                        <Link
                          key={post.id || post.slug}
                          href={`/blog/${post.slug}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '18px 24px',
                            backgroundColor: 'rgba(255, 255, 255, 0.85)',
                            border: '1px solid rgba(196, 154, 69, 0.3)',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(18, 63, 54, 0.08)',
                          }}
                        >
                          <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#123f36', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>
                              {post.title}
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#718096' }}>
                              <span>{post.date || 'Autumn 2026'}</span>
                              <span>⏱️ {calculateReadTimeMinutes(post.paragraphs)} min read</span>
                              {post.summary?.distance && <span>• {post.summary.distance}</span>}
                            </div>
                          </div>
                          <span style={{ color: '#c49a45', fontWeight: 700, fontSize: '1.1rem' }}>→</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#718096', fontStyle: 'italic', margin: 0 }}>
                      No public chronicles published yet.
                    </p>
                  )}
                </section>
              </>
            )}
          </article>

          {/* RIGHT: Multimedia Band (Photos & External Links — NO ride stats box!) */}
          <div className="right-multimedia-panel">
            <aside
              className="multimedia-band"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                width: '100%',
                maxWidth: '460px',
              }}
            >
              {/* 1. Enlarged Photo Viewer */}
              {currentPhoto && (
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(18, 63, 54, 0.85)',
                    border: '1px solid rgba(196, 154, 69, 0.4)',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#092328' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getSafeImageUrl(currentPhoto.fullUrl || currentPhoto.baseUrl)}
                      alt={currentPhoto.title || 'Profile Photo'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  {currentPhoto.title && (
                    <div style={{ padding: '12px 18px', color: '#e8dcc4', fontSize: '0.88rem', fontWeight: 500 }}>
                      {currentPhoto.title}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Thumbnail Strip */}
              {photos.length > 1 && (
                <div
                  className="glass-card"
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(18, 63, 54, 0.85)',
                    border: '1px solid rgba(196, 154, 69, 0.35)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#c49a45', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase' }}>
                    Gallery ({photos.length} photos)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {photos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        style={{
                          border: activePhotoIndex === idx ? '2px solid #c49a45' : '1px solid transparent',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          height: '64px',
                          padding: 0,
                          cursor: 'pointer',
                          backgroundColor: '#092328',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getSafeImageUrl(p.thumbUrl || p.baseUrl)}
                          alt={p.title || `Thumbnail ${idx}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. External Hyperlinks Box */}
              {author?.links && author.links.length > 0 && (
                <div
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(18, 63, 54, 0.85)',
                    border: '1px solid rgba(196, 154, 69, 0.35)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#c49a45', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase' }}>
                    🔗 Author Links & Social
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {author.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: 'rgba(42, 107, 92, 0.35)',
                          borderRadius: '8px',
                          color: '#e8dcc4',
                          textDecoration: 'none',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          border: '1px solid rgba(196, 154, 69, 0.25)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{link.label}</span>
                        <span style={{ color: '#c49a45' }}>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
