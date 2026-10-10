const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export async function fetchPosts({ filter_by = 'latest', search, tag, status_filter, token } = {}) {
  try {
    const params = new URLSearchParams();
    if (filter_by) params.set('filter_by', filter_by);
    if (search) params.set('search', search);
    if (tag) params.set('tag', tag);
    if (status_filter) params.set('status_filter', status_filter);

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts?${params.toString()}`, {
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('FastAPI backend not reached, falling back to local storage:', err.message);
  }
  return null;
}

export async function fetchPostBySlug(slug, token = null) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`FastAPI backend fetch failed for slug ${slug}:`, err.message);
  }
  return null;
}

export async function createPostApi(postData, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData)
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    return { error: errData.detail || 'Failed to create post' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updatePostApi(slug, updateData, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    return { error: errData.detail || 'Failed to update post' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function likePostApi(slug, token = null) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/like`, {
      method: 'POST',
      headers
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Like failed:', err);
  }
  return null;
}

export async function fetchCommentsApi(slug, token = null) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments`, {
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Fetch comments failed:', err);
  }
  return [];
}

export async function submitCommentApi(slug, commentData, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commentData)
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return { error: err.detail || 'Failed to submit comment' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function loginApi(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login-json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return { error: err.detail || 'Invalid credentials' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchPublicSettingsApi() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Settings fetch failed:', err);
  }
  return {};
}
