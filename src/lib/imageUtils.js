export function getSafeImageUrl(url) {
  if (!url) return '';
  // For googleusercontent images, route via zero-storage streaming proxy
  // to avoid Google hotlink 429 blocks
  if (url.includes('googleusercontent.com') || url.includes('photos.app.goo.gl')) {
    return `/api/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
