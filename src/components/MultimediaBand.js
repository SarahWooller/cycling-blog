'use client';

import { useState, useEffect, useRef } from 'react';
import LightboxModal from './LightboxModal';
import { getSafeImageUrl } from '@/lib/imageUtils';

export default function MultimediaBand({
  photos = [],
  summary = {},
  links = [],
  routeMapUrl = '',
  gpxFiles = [],
  gpxUrl = '',
  activePhotoIndex = 0,
  onSelectPhoto = () => {},
  onSetAsBackdrop = null,
  currentBackdropIndex = 0,
}) {
  const [selectedIndex, setSelectedIndex] = useState(activePhotoIndex);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);
  const [slideshowProgress, setSlideshowProgress] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const SLIDESHOW_INTERVAL_MS = 4000;
  const timerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const selectedIndexRef = useRef(selectedIndex);
  const onSelectPhotoRef = useRef(onSelectPhoto);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    onSelectPhotoRef.current = onSelectPhoto;
  }, [onSelectPhoto]);

  // Sync external activePhotoIndex changes
  useEffect(() => {
    if (activePhotoIndex !== undefined && activePhotoIndex !== selectedIndexRef.current) {
      setSelectedIndex(activePhotoIndex);
    }
  }, [activePhotoIndex]);

  // Slideshow timer logic
  useEffect(() => {
    if (!isPlayingSlideshow || photos.length === 0) {
      clearInterval(timerRef.current);
      clearInterval(progressTimerRef.current);
      setSlideshowProgress(0);
      return;
    }

    const startTime = Date.now();
    setSlideshowProgress(0);

    // Update progress bar smoothly
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed % SLIDESHOW_INTERVAL_MS) / SLIDESHOW_INTERVAL_MS, 1);
      setSlideshowProgress(pct * 100);
    }, 50);

    timerRef.current = setInterval(() => {
      const current = selectedIndexRef.current;
      const next = (current + 1) % photos.length;
      setSelectedIndex(next);
      if (onSelectPhotoRef.current) {
        onSelectPhotoRef.current(next);
      }
      setSlideshowProgress(0);
    }, SLIDESHOW_INTERVAL_MS);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [isPlayingSlideshow, photos.length]);

  const currentPhoto = photos[selectedIndex] || photos[0];
  const safeCurrentPhotoUrl = currentPhoto
    ? getSafeImageUrl(currentPhoto.fullUrl || currentPhoto.baseUrl)
    : '';

  const handleSelectThumbnail = (index) => {
    setSelectedIndex(index);
    onSelectPhoto(index);
    setSlideshowProgress(0);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    const prev = selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1;
    setSelectedIndex(prev);
    onSelectPhoto(prev);
    setSlideshowProgress(0);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    const next = (selectedIndex + 1) % photos.length;
    setSelectedIndex(next);
    onSelectPhoto(next);
    setSlideshowProgress(0);
  };

  const toggleSlideshow = (e) => {
    e?.stopPropagation();
    setIsPlayingSlideshow((prev) => !prev);
  };

  return (
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
      {/* 1. Enlarged Photo Viewer with Slideshow Controls */}
      <div
        className="glass-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#123f36',
                backgroundColor: 'rgba(196, 154, 69, 0.2)',
                border: '1px solid rgba(196, 154, 69, 0.35)',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              Gallery Band
            </span>
            <span style={{ fontSize: '0.8rem', color: '#2a6b5c', fontWeight: 500 }}>
              {photos.length > 0 ? `${selectedIndex + 1} of ${photos.length}` : '0 photos'}
            </span>
          </div>

          {/* Backdrop indicator or button */}
          {onSetAsBackdrop && (
            <button
              onClick={() => onSetAsBackdrop(selectedIndex)}
              id="set-as-backdrop-btn"
              title="Use this photo as the page backdrop"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: currentBackdropIndex === selectedIndex ? '#123f36' : '#2a6b5c',
                backgroundColor:
                  currentBackdropIndex === selectedIndex
                    ? 'rgba(196, 154, 69, 0.28)'
                    : 'rgba(232, 220, 196, 0.6)',
                border:
                  currentBackdropIndex === selectedIndex
                    ? '1px solid #c49a45'
                    : '1px solid rgba(196, 154, 69, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
              }}
            >
              {currentBackdropIndex === selectedIndex ? '✓ Active Backdrop' : 'Set as Backdrop'}
            </button>
          )}
        </div>

        {/* The Enlarged Image Display (Full Vibrancy) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '310px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#123f36',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(18, 63, 54, 0.2)',
          }}
          onClick={() => setIsLightboxOpen(true)}
          title="Click to view full screen"
        >
          {currentPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentPhoto.id || selectedIndex}
              src={safeCurrentPhotoUrl}
              alt={currentPhoto.title || `Photo ${selectedIndex + 1}`}
              referrerPolicy="no-referrer"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                transition: 'transform 0.4s ease, opacity 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e8dcc4',
                fontSize: '0.9rem',
              }}
            >
              No photos loaded yet
            </div>
          )}

          {/* Navigation Arrows on Image */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                id="gallery-prev-btn"
                aria-label="Previous photo"
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(18, 63, 54, 0.75)',
                  color: '#e8dcc4',
                  border: '1px solid rgba(196, 154, 69, 0.4)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  transition: 'background 0.2s',
                }}
              >
                ‹
              </button>
              <button
                onClick={handleNext}
                id="gallery-next-btn"
                aria-label="Next photo"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(18, 63, 54, 0.75)',
                  color: '#e8dcc4',
                  border: '1px solid rgba(196, 154, 69, 0.4)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  transition: 'background 0.2s',
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Fullscreen Expand Icon Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            id="fullscreen-gallery-btn"
            title="Open Lightbox"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(18, 63, 54, 0.75)',
              color: '#e8dcc4',
              border: '1px solid rgba(196, 154, 69, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.8rem',
              backdropFilter: 'blur(4px)',
              fontWeight: 500,
            }}
          >
            ⛶ Expand
          </button>
        </div>

        {/* Slideshow Control Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleSlideshow}
              id="slideshow-toggle-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#123f36',
                backgroundColor: isPlayingSlideshow ? '#c49a45' : 'rgba(232, 220, 196, 0.8)',
                border: '1px solid #c49a45',
                padding: '6px 14px',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
            >
              <span>{isPlayingSlideshow ? '⏸ Pause Slideshow' : '▶ Play Slideshow'}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#2a6b5c', fontWeight: 600 }}>
            {currentPhoto?.title || `Photo ${selectedIndex + 1}`}
          </div>
        </div>

        {/* Slideshow Progress Bar */}
        {isPlayingSlideshow && (
          <div
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: 'rgba(196, 154, 69, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: `${slideshowProgress}%`,
                height: '100%',
                backgroundColor: '#c49a45',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
        )}

        {/* 2. Thumbnail Strip (Max 15 Photos) */}
        <div style={{ marginTop: '8px' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#2a6b5c',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Thumbnails ({photos.length} total)
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              maxHeight: '210px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {photos.map((photo, index) => {
              const isSelected = index === selectedIndex;
              const isBackdrop = index === currentBackdropIndex;
              const safeThumbUrl = getSafeImageUrl(photo.thumbUrl || photo.baseUrl);

              return (
                <button
                  key={photo.id || index}
                  onClick={() => handleSelectThumbnail(index)}
                  id={`thumbnail-${index}`}
                  title={photo.title || `Photo ${index + 1}`}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: isSelected
                      ? '2.5px solid #c49a45'
                      : '1.5px solid rgba(196, 154, 69, 0.3)',
                    boxShadow: isSelected ? '0 0 12px rgba(196, 154, 69, 0.6)' : 'none',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    transition: 'all 0.2s',
                    backgroundColor: '#123f36',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={safeThumbUrl}
                    alt={photo.title || `Thumb ${index + 1}`}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: isSelected ? 1 : 0.85,
                    }}
                  />
                  {isBackdrop && (
                    <span
                      title="Current Backdrop"
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        backgroundColor: '#c49a45',
                        color: '#123f36',
                        fontSize: '9px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      BG
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Summary & Hyperlinks Box */}
      <div
        className="glass-card"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🚴</span>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#123f36',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Ride Summary & Statistics
          </h3>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}
        >
          {summary.distance && (
            <div
              style={{
                backgroundColor: 'rgba(232, 220, 196, 0.5)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(196, 154, 69, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#2a6b5c', fontWeight: 700 }}>
                DISTANCE
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#123f36' }}>
                {summary.distance}
              </div>
            </div>
          )}

          {summary.elevation && (
            <div
              style={{
                backgroundColor: 'rgba(232, 220, 196, 0.5)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(196, 154, 69, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#2a6b5c', fontWeight: 700 }}>
                ELEVATION
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#123f36' }}>
                {summary.elevation}
              </div>
            </div>
          )}

          {summary.movingTime && (
            <div
              style={{
                backgroundColor: 'rgba(232, 220, 196, 0.5)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(196, 154, 69, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#2a6b5c', fontWeight: 700 }}>
                MOVING TIME
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#123f36' }}>
                {summary.movingTime}
              </div>
            </div>
          )}

          {summary.weather && (
            <div
              style={{
                backgroundColor: 'rgba(232, 220, 196, 0.5)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(196, 154, 69, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#2a6b5c', fontWeight: 700 }}>
                WEATHER
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#123f36' }}>
                {summary.weather}
              </div>
            </div>
          )}
        </div>

        {/* Hyperlinks */}
        {links && links.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#2a6b5c',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Essential Hyperlinks
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`summary-link-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(196, 154, 69, 0.35)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#123f36',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(232, 220, 196, 0.7)';
                    e.currentTarget.style.borderColor = '#c49a45';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = 'rgba(196, 154, 69, 0.35)';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>
                      {link.type === 'route'
                        ? '🗺️'
                        : link.type === 'cafe'
                        ? '☕'
                        : link.type === 'gpx'
                        ? '📥'
                        : '🔗'}
                    </span>
                    <span>{link.label}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#c49a45' }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Permanent Route Map Box (Bottom Right) */}
      <div
        className="glass-card"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1rem' }}>📍</span>
            <h4
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#123f36',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Route Map
            </h4>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              color: '#123f36',
              backgroundColor: 'rgba(196, 154, 69, 0.25)',
              border: '1px solid rgba(196, 154, 69, 0.4)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            Permanent
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '210px',
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#123f36',
            border: '1px solid rgba(196, 154, 69, 0.35)',
          }}
        >
          {routeMapUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getSafeImageUrl(routeMapUrl)}
              alt="Route Map of the Ride"
              referrerPolicy="no-referrer"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e8dcc4',
                fontSize: '0.85rem',
              }}
            >
              No map photo specified
            </div>
          )}
        </div>

        {/* GPX Route Track Download / Link */}
        {gpxFiles && gpxFiles.length > 0 ? (
          gpxFiles.map((gpx, idx) => (
            <a
              key={idx}
              href={gpx.download_url || `/api/gpx/${gpx.id}/download`}
              download={gpx.filename}
              id={`btn-download-gpx-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#123f36',
                border: '1px solid rgba(196, 154, 69, 0.4)',
                color: '#e8dcc4',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: '4px',
                transition: 'background-color 0.2s',
              }}
            >
              <span>📥</span>
              <span>Download GPX Track ({gpx.filename})</span>
            </a>
          ))
        ) : gpxUrl ? (
          <a
            href={gpxUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-open-route-url"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: '#123f36',
              border: '1px solid rgba(196, 154, 69, 0.4)',
              color: '#e8dcc4',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none',
              marginTop: '4px',
            }}
          >
            <span>🗺️</span>
            <span>Open Route Track ↗</span>
          </a>
        ) : null}
      </div>

      {/* Generous bottom scroll buffer so the route map & GPX buttons are never chopped off */}
      <div style={{ minHeight: '64px', height: '64px', width: '100%', flexShrink: 0 }} />

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <LightboxModal
          photo={currentPhoto}
          currentIndex={selectedIndex}
          totalPhotos={photos.length}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </aside>
  );
}
