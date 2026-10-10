'use client';

import { getSafeImageUrl } from '@/lib/imageUtils';

export default function DuotoneBackdrop({
  imageUrl,
  alt = 'Blog Backdrop',
  position = 'center top',
}) {
  if (!imageUrl) return null;

  const safeUrl = getSafeImageUrl(imageUrl);

  return (
    <div className="duotone-bg-wrapper" aria-hidden="true">
      {/* Background Image with top alignment so heads are never cut off */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={safeUrl}
        alt={alt}
        className="duotone-image"
        referrerPolicy="no-referrer"
        style={{
          objectPosition: position,
        }}
      />
      {/* Deep teal / forest green duotone grading layer */}
      <div className="duotone-tint" />
      {/* Warm cream / gold glow layer */}
      <div className="duotone-glow" />
    </div>
  );
}
