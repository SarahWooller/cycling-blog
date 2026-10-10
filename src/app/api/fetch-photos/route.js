import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const albumUrl = searchParams.get('url');

  if (!albumUrl) {
    return NextResponse.json({ error: 'Album URL is required' }, { status: 400 });
  }

  try {
    let html = '';

    // Use curl -s -L to robustly follow Google Firebase dynamic shortlink redirects
    try {
      const { stdout } = await execFileAsync('curl', ['-s', '-L', albumUrl], {
        maxBuffer: 15 * 1024 * 1024,
      });
      html = stdout;
    } catch (curlErr) {
      console.warn('Curl fallback failed, trying fetch:', curlErr);
      const res = await fetch(albumUrl, { redirect: 'follow' });
      html = await res.text();
    }

    // Match all Google Photos lh3.googleusercontent.com/pw/... URLs
    const regex = /https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+/g;
    const matches = html.match(regex) || [];

    // Deduplicate while maintaining sequence
    const uniqueBases = [];
    const seen = new Set();
    for (const url of matches) {
      if (!seen.has(url)) {
        seen.add(url);
        uniqueBases.push(url);
      }
    }

    // Filter out tiny utility/avatar icons if any, keeping full photo hashes
    // Typically Google Photos pw hashes are 100+ characters long
    const photoBases = uniqueBases.filter(u => u.length > 50);

    // Limit to max 15 photos as specified
    const maxPhotos = 15;
    const photos = photoBases.slice(0, maxPhotos).map((baseUrl, idx) => ({
      id: idx + 1,
      baseUrl,
      fullUrl: `${baseUrl}=w1600`,
      thumbUrl: `${baseUrl}=w240-h240-c`,
      title: `Photo ${idx + 1}`
    }));

    return NextResponse.json({
      albumUrl,
      totalFound: photoBases.length,
      photos
    });
  } catch (error) {
    console.error('Error fetching Google Photos album:', error);
    return NextResponse.json({ error: 'Failed to parse album' }, { status: 500 });
  }
}
