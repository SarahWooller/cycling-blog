import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filterBy = searchParams.get('filter_by') || 'latest';
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status_filter') || '';
  const author = searchParams.get('author') || '';
  const authHeader = request.headers.get('authorization');

  // Query database via FastAPI backend
  try {
    const query = new URLSearchParams({ filter_by: filterBy });
    if (search) query.set('search', search);
    if (statusFilter) query.set('status_filter', statusFilter);
    if (author) query.set('author', author);

    const headers = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${FASTAPI_URL}/posts?${query.toString()}`, {
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      const dbPosts = await res.json();
      return NextResponse.json(dbPosts);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json({ error: errData.detail || 'Failed to fetch posts' }, { status: res.status });
  } catch (err) {
    console.error('FastAPI error in /api/posts:', err);
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const clientAuth = request.headers.get('authorization');
    if (!clientAuth) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in as a Blogger or Administrator to create chronicles.' },
        { status: 401 }
      );
    }

    // Strictly verify role with FastAPI
    let currentUser = null;
    try {
      const meRes = await fetch(`${FASTAPI_URL}/auth/me`, {
        headers: { 'Authorization': clientAuth },
        cache: 'no-store'
      });
      if (meRes.ok) {
        currentUser = await meRes.json();
      } else {
        return NextResponse.json(
          { error: 'Invalid or expired session. Please sign in again.' },
          { status: 401 }
        );
      }
    } catch (err) {
      console.warn('FastAPI auth check error:', err.message);
    }

    if (currentUser && currentUser.role === 'reader') {
      return NextResponse.json(
        {
          error: 'Permission denied. Reader accounts cannot create chronicles or drafts. Only Bloggers and Administrators have authoring privileges.'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      status = 'draft',
      is_public = true,
      approve_comments = false,
      docUrl,
      photosAlbumUrl,
      paragraphs,
      photos,
      backdropIndex,
      summary,
      links,
      routeMapUrl,
      gpx_url,
      gpx_id,
      tags = []
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Normalized photos list (Zero photo storage - remote URLs only)
    const normalizedPhotos = (photos || []).map((p, idx) => ({
      id: idx + 1,
      baseUrl: p.baseUrl || p.url,
      fullUrl: p.fullUrl || `${p.baseUrl || p.url}=w1600`,
      thumbUrl: p.thumbUrl || `${p.baseUrl || p.url}=w240-h240-c`,
      title: p.title || `Photo ${idx + 1}`
    }));

    // Post directly to database via FastAPI backend
    const createRes = await fetch(`${FASTAPI_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': clientAuth
      },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        status,
        is_public,
        approve_comments,
        doc_url: docUrl || '',
        photos_album_url: photosAlbumUrl || '',
        backdrop_index: typeof backdropIndex === 'number' ? backdropIndex : 0,
        paragraphs: Array.isArray(paragraphs) ? paragraphs : [paragraphs],
        photos: normalizedPhotos,
        summary: summary || {},
        links: Array.isArray(links) ? links : [],
        route_map_url: routeMapUrl || '',
        gpx_url: gpx_url || null,
        gpx_id: gpx_id || null,
        tags: tags || ['cycling']
      })
    });

    if (createRes.ok) {
      const backendPost = await createRes.json();
      return NextResponse.json({ success: true, post: backendPost }, { status: 201 });
    } else {
      const err = await createRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to create chronicle' },
        { status: createRes.status }
      );
    }
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Internal server error saving post' }, { status: 500 });
  }
}
