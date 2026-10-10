'use client';

import { useEffect } from 'react';
import { getSafeImageUrl } from '@/lib/imageUtils';

export default function LightboxModal({
  photo,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalPhotos
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!photo) return null;

  const safePhotoUrl = getSafeImageUrl(photo.fullUrl || photo.baseUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo Lightbox"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 13, 29, 0.94)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 600 }}>
            {photo.title || `Photo ${currentIndex + 1}`}
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '2px 10px',
              borderRadius: '999px',
            }}
          >
            {currentIndex + 1} / {totalPhotos}
          </span>
        </div>
        <button
          onClick={onClose}
          id="close-lightbox-btn"
          aria-label="Close Lightbox"
          style={{
            color: '#ffffff',
            fontSize: '1.75rem',
            lineHeight: 1,
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
        >
          ✕
        </button>
      </div>

      {/* Main Image Container */}
      <div
        style={{
          position: 'relative',
          maxWidth: '92vw',
          maxHeight: '82vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        <button
          onClick={onPrev}
          id="lightbox-prev-btn"
          aria-label="Previous Photo"
          style={{
            position: 'absolute',
            left: '-60px',
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ‹
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safePhotoUrl}
          alt={photo.title || 'Expanded View'}
          referrerPolicy="no-referrer"
          style={{
            maxWidth: '100%',
            maxHeight: '82vh',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }}
        />

        {/* Next Button */}
        <button
          onClick={onNext}
          id="lightbox-next-btn"
          aria-label="Next Photo"
          style={{
            position: 'absolute',
            right: '-60px',
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ›
        </button>
      </div>

      <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '0.85rem' }}>
        Press <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>Esc</kbd> to close, arrow keys to navigate
      </p>
    </div>
  );
}
