import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Helper to resolve photos.app.goo.gl album/photo share links to direct image URLs
async function resolveGooglePhotosLink(url) {
  try {
    const { stdout } = await execFileAsync('curl', ['-s', '-L', url], {
      maxBuffer: 15 * 1024 * 1024,
    });
    // Check og:image meta tag first
    const ogMatch = stdout.match(/property="og:image"\s+content="([^"]+)"/i) || stdout.match(/content="([^"]+)"\s+property="og:image"/i);
    if (ogMatch && ogMatch[1]) {
      return ogMatch[1].replace(/=w\d+.*$/, '=w1600');
    }
    // Fallback to first high-res Google Photos pw link
    const pwMatches = stdout.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+/g);
    if (pwMatches && pwMatches.length > 0) {
      return `${pwMatches[0]}=w1600`;
    }
  } catch (err) {
    console.warn('Failed to resolve Google Photos link via curl:', err.message);
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing image URL parameter', { status: 400 });
  }

  try {
    // If it's a Google Photos sharing link (photos.app.goo.gl), resolve to direct image
    if (imageUrl.includes('photos.app.goo.gl')) {
      const resolved = await resolveGooglePhotosLink(imageUrl);
      if (resolved) {
        imageUrl = resolved;
      }
    }

    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!res.ok) {
      return new Response(`Upstream Google Photos error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const imageArrayBuffer = await res.arrayBuffer();

    return new Response(imageArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return new Response('Error fetching remote image', { status: 500 });
  }
}
