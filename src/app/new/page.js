'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BlogReader from '@/components/BlogReader';
import { getSafeImageUrl } from '@/lib/imageUtils';
import { useAuth } from '@/lib/authContext';
import AuthModal from '@/components/AuthModal';
import { calculateReadTimeMinutes } from '@/lib/readingTime';

function BlankCanvasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSlug = searchParams?.get('slug') || '';
  const { user, token, isLoggedIn } = useAuth();

  const [currentSlug, setCurrentSlug] = useState(initialSlug);
  const [availableDrafts, setAvailableDrafts] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Blank Canvas Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('Autumn 2026');
  const [location, setLocation] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [storyText, setStoryText] = useState('');
  const [paragraphs, setParagraphs] = useState([]);

  // Photos State (Zero photo storage - remote URLs only)
  const [photosAlbumUrl, setPhotosAlbumUrl] = useState('');
  const [photos, setPhotos] = useState([]);
  const [backdropIndex, setBackdropIndex] = useState(0);

  // Summary State
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [movingTime, setMovingTime] = useState('');
  const [weather, setWeather] = useState('');
  const [links, setLinks] = useState([
    { label: 'Strava Route', url: 'https://www.strava.com', type: 'route' },
  ]);
  const [routeMapUrl, setRouteMapUrl] = useState('');
  const [gpxUrl, setGpxUrl] = useState('');
  const [gpxId, setGpxId] = useState('');
  const [gpxFileMeta, setGpxFileMeta] = useState(null); // { id, filename, file_size, summary, download_url }
  const [gpxMode, setGpxMode] = useState('upload'); // 'upload' | 'url'
  const [isUploadingGpx, setIsUploadingGpx] = useState(false);
  const [tags, setTags] = useState('cycling, gravel, kent');

  // Lifecycle & Moderation State
  const [postStatus, setPostStatus] = useState('published'); // 'draft' | 'published' | 'archived'
  const [isPublic, setIsPublic] = useState(true);
  const [approveComments, setApproveComments] = useState(false);

  // Tour / Multi-Day Chaining State
  const [tourId, setTourId] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [availableTours, setAvailableTours] = useState([]);
  const [isCreatingNewTour, setIsCreatingNewTour] = useState(false);
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourDesc, setNewTourDesc] = useState('');

  // UI State
  const [isFetchingDoc, setIsFetchingDoc] = useState(false);
  const [isFetchingPhotos, setIsFetchingPhotos] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  // Fetch available drafts and tours
  useEffect(() => {
    fetch('/api/tours')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAvailableTours(data);
      })
      .catch(() => {});

    if (token && (user?.role === 'blogger' || user?.role === 'admin')) {
      fetch('/api/posts?status_filter=draft', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAvailableDrafts(data);
        })
        .catch(() => {});
    }
  }, [token, user]);

  // Load a specific draft if currentSlug is set
  useEffect(() => {
    if (!currentSlug) return;

    let isMounted = true;
    setIsLoadingDraft(true);
    setStatusMessage({ text: `Loading draft "${currentSlug}"...`, type: 'info' });

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`/api/posts/${encodeURIComponent(currentSlug)}`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.error || 'Failed to load draft');
        }
        return res.json();
      })
      .then((post) => {
        if (!isMounted || !post) return;
        setTitle(post.title || '');
        setDate(post.date || 'Autumn 2026');
        setLocation(post.location || '');
        setDocUrl(post.doc_url || post.docUrl || '');
        setPhotosAlbumUrl(post.photos_album_url || post.photosAlbumUrl || '');
        setParagraphs(Array.isArray(post.paragraphs) ? post.paragraphs : []);
        setStoryText(Array.isArray(post.paragraphs) ? post.paragraphs.join('\n\n') : (post.paragraphs || ''));
        setPhotos(Array.isArray(post.photos) ? post.photos : []);
        setBackdropIndex(post.backdrop_index || post.backdropIndex || 0);
        setDistance(post.summary?.distance || '');
        setElevation(post.summary?.elevation || '');
        setMovingTime(post.summary?.movingTime || '');
        setWeather(post.summary?.weather || '');
        if (Array.isArray(post.links) && post.links.length > 0) {
          setLinks(post.links);
        }
        setRouteMapUrl(post.route_map_url || post.routeMapUrl || '');
        setGpxUrl(post.gpx_url || '');
        if (Array.isArray(post.gpx_files) && post.gpx_files.length > 0) {
          const primaryGpx = post.gpx_files[0];
          setGpxId(primaryGpx.id);
          setGpxFileMeta(primaryGpx);
          setGpxMode('upload');
        } else if (post.gpx_url) {
          setGpxMode('url');
        } else {
          setGpxId('');
          setGpxFileMeta(null);
          setGpxMode('upload');
        }
        setTags(Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || 'cycling'));
        setTourId(post.tour_id || '');
        setDayNumber(post.day_number !== null && post.day_number !== undefined ? String(post.day_number) : '');
        setPostStatus(post.status || 'draft');
        setIsPublic(post.is_public ?? true);
        setApproveComments(post.approve_comments ?? false);
        setStatusMessage({ text: `✓ Loaded draft "${post.title || currentSlug}"`, type: 'success' });
      })
      .catch((err) => {
        if (isMounted) {
          setStatusMessage({ text: `Error loading draft: ${err.message}`, type: 'error' });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingDraft(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSlug, token]);

  const handleStartFresh = () => {
    setCurrentSlug('');
    setTitle('');
    setDate('Autumn 2026');
    setLocation('');
    setDocUrl('');
    setStoryText('');
    setParagraphs([]);
    setPhotosAlbumUrl('');
    setPhotos([]);
    setBackdropIndex(0);
    setDistance('');
    setElevation('');
    setMovingTime('');
    setWeather('');
    setLinks([{ label: 'Strava Route', url: 'https://www.strava.com', type: 'route' }]);
    setRouteMapUrl('');
    setGpxUrl('');
    setGpxId('');
    setGpxFileMeta(null);
    setTags('cycling, gravel, kent');
    setPostStatus('published');
    setStatusMessage({ text: 'Blank canvas ready for a new chronicle.', type: 'info' });
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/new');
    }
  };

  const handleGpxFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setStatusMessage({ text: 'Please select a valid .gpx file', type: 'error' });
      return;
    }
    setIsUploadingGpx(true);
    setStatusMessage({ text: `Uploading GPX file "${file.name}" to database...`, type: 'info' });
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (currentSlug) formData.append('post_slug', currentSlug);

      const res = await fetch('/api/gpx/upload', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload GPX file');

      setGpxId(data.id);
      setGpxFileMeta(data);
      setStatusMessage({ text: `✓ Uploaded "${data.filename}" to database`, type: 'success' });
    } catch (err) {
      setStatusMessage({ text: `GPX upload failed: ${err.message}`, type: 'error' });
    } finally {
      setIsUploadingGpx(false);
      e.target.value = '';
    }
  };

  const handleRemoveGpx = () => {
    setGpxId('');
    setGpxFileMeta(null);
    setStatusMessage({ text: 'GPX file unlinked from chronicle', type: 'info' });
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePost = async () => {
    if (!currentSlug) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title || currentSlug}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    setStatusMessage({ text: 'Deleting chronicle...', type: 'info' });

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(currentSlug)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setStatusMessage({ text: '✓ Chronicle deleted successfully. Redirecting...', type: 'success' });
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMessage({ text: data.error || 'Failed to delete chronicle', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Error connecting to server to delete chronicle', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch Google Doc text dynamically
  const triggerFetchDoc = async (urlToFetch) => {
    const targetUrl = urlToFetch || docUrl;
    if (!targetUrl) return;

    setIsFetchingDoc(true);
    setStatusMessage({ text: 'Fetching Google Doc text...', type: 'info' });

    try {
      const res = await fetch(`/api/fetch-doc?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (res.ok && data.paragraphs) {
        setParagraphs(data.paragraphs);
        setStoryText(data.fullText);
        setStatusMessage({ text: `✓ Fetched ${data.paragraphs.length} paragraphs from Google Doc`, type: 'success' });
      } else {
        setStatusMessage({ text: data.error || 'Failed to fetch Google Doc', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Network error fetching Google Doc', type: 'error' });
    } finally {
      setIsFetchingDoc(false);
    }
  };

  // Fetch Google Photos shared album dynamically
  const triggerFetchPhotos = async (urlToFetch) => {
    const targetUrl = urlToFetch || photosAlbumUrl;
    if (!targetUrl) return;

    setIsFetchingPhotos(true);
    setStatusMessage({ text: 'Resolving Google Photos shared album...', type: 'info' });

    try {
      const res = await fetch(`/api/fetch-photos?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (res.ok && data.photos && data.photos.length > 0) {
        setPhotos(data.photos);
        setBackdropIndex(0);
        setStatusMessage({ text: `✓ Fetched ${data.photos.length} photos from Google Photos album`, type: 'success' });
      } else {
        setStatusMessage({ text: data.error || 'Could not find photos in album', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Network error resolving Google Photos', type: 'error' });
    } finally {
      setIsFetchingPhotos(false);
    }
  };

  // Add custom hyperlink
  const handleAddLink = () => {
    setLinks([...links, { label: '', url: '', type: 'link' }]);
  };

  const handleUpdateLink = (index, field, value) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // Save Post: Supports Save as Draft, Publish, or Archive
  const handleSavePost = async (targetStatus = postStatus) => {
    if (!title.trim()) {
      setStatusMessage({ text: 'Please provide a title for your chronicle', type: 'error' });
      return;
    }

    const currentParagraphs = paragraphs.length > 0 
      ? paragraphs 
      : (storyText ? storyText.split(/\r?\n\r?\n/).map(p => p.trim()).filter(Boolean) : []);

    // For full publishing, require content and photos; for drafts, allow saving WIP
    if (targetStatus === 'published') {
      if (currentParagraphs.length === 0) {
        setStatusMessage({ text: 'Please add your Google Doc link or paste story text before publishing', type: 'error' });
        return;
      }
      if (photos.length === 0) {
        setStatusMessage({ text: 'Please add your Google Photos album link and fetch photos before publishing', type: 'error' });
        return;
      }
    }

    setIsPublishing(true);
    const actionLabel = targetStatus === 'draft' ? 'Saving draft...' : targetStatus === 'archived' ? 'Archiving chronicle...' : 'Publishing chronicle...';
    setStatusMessage({ text: actionLabel, type: 'info' });

    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const postPayload = {
        title,
        date,
        location,
        status: targetStatus,
        is_public: isPublic,
        approve_comments: approveComments,
        tags: tagList,
        gpx_url: gpxUrl || null,
        gpx_id: gpxId || null,
        docUrl,
        photosAlbumUrl,
        backdropIndex,
        paragraphs: currentParagraphs.length > 0 ? currentParagraphs : ['(Draft in progress...)'],
        photos: photos.length > 0 ? photos : [
          {
            id: 1,
            baseUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
            fullUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
            thumbUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=240&h=240&q=80',
            title: 'Draft Placeholder'
          }
        ],
        summary: {
          distance,
          elevation,
          movingTime,
          weather,
          surface: 'Paved lanes and gravel byways'
        },
        links: links.filter(l => l.label && l.url),
        route_map_url: routeMapUrl || '',
        routeMapUrl: routeMapUrl || '',
        doc_url: docUrl || '',
        docUrl: docUrl || '',
        photos_album_url: photosAlbumUrl || '',
        photosAlbumUrl: photosAlbumUrl || '',
        backdrop_index: backdropIndex,
        backdropIndex: backdropIndex,
        tour_id: tourId || null,
        day_number: dayNumber ? parseInt(dayNumber, 10) : null,
      };

      const isEditing = Boolean(currentSlug);
      const endpoint = isEditing ? `/api/posts/${encodeURIComponent(currentSlug)}` : '/api/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(postPayload)
      });

      const data = await res.json();

      if (res.ok && data.post) {
        if (data.post.slug && data.post.slug !== currentSlug) {
          setCurrentSlug(data.post.slug);
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/new?slug=${data.post.slug}`);
          }
        }

        const successText = targetStatus === 'draft' 
          ? (isEditing ? '✓ Draft updated in Notebook!' : '✓ Draft created & saved in Notebook!') 
          : targetStatus === 'archived' 
          ? '✓ Chronicle archived successfully!' 
          : '✓ Published successfully! Redirecting...';
        setStatusMessage({ text: successText, type: 'success' });

        if (targetStatus === 'published') {
          setTimeout(() => {
            router.push(`/blog/${data.post.slug}`);
          }, 1200);
        } else {
          // Re-fetch available drafts list
          if (token) {
            fetch('/api/posts?status_filter=draft', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then((r) => r.json())
              .then((d) => {
                if (Array.isArray(d)) setAvailableDrafts(d);
              })
              .catch(() => {});
          }
        }
      } else {
        setStatusMessage({ text: data.error || 'Failed to save post', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Error saving post to server', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Preview Post Object for live preview
  const previewPost = {
    title: title || 'Untitled Cycling Chronicle',
    date: date || 'Autumn 2026',
    location: location || 'Cycle Tour',
    docUrl,
    photosAlbumUrl,
    backdropIndex,
    author: { display_name: user?.display_name || 'VeloTales Author' },
    paragraphs: paragraphs.length > 0 
      ? paragraphs 
      : (storyText ? storyText.split(/\r?\n\r?\n/).filter(Boolean) : [
          'Add your Google Doc link above or paste text to see your story rendered here with high-contrast typography.',
          'Your selected backdrop photo will appear with a blue-and-white duotone filter, while the right band showcases your photo gallery, slideshow, summary, and route map.'
        ]),
    photos: photos.length > 0 ? photos : [
      {
        id: 1,
        baseUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
        fullUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
        thumbUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=240&h=240&q=80',
        title: 'Sample Route Photo'
      }
    ],
    summary: {
      distance: distance || '64 miles',
      elevation: elevation || '1,420 m',
      movingTime: movingTime || '5h 12m',
      weather: weather || 'Sunny & brisk'
    },
    links,
    routeMapUrl: routeMapUrl || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80',
    tour_id: tourId || null,
    day_number: dayNumber ? parseInt(dayNumber, 10) : null,
  };

  // 1. Reader Role Access Restriction
  if (user && user.role === 'reader') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#123f36', color: '#e8dcc4', background: 'linear-gradient(180deg, #123f36 0%, #0d2c26 100%)' }}>
        <Navbar />
        <div
          style={{
            maxWidth: '680px',
            margin: '80px auto',
            padding: '48px 36px',
            textAlign: 'center',
            backgroundColor: 'rgba(18, 63, 54, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: '1px solid rgba(196, 154, 69, 0.4)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <span style={{ fontSize: '3.5rem' }}>🔒</span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              color: '#f7f3ea',
              margin: 0,
            }}
          >
            Author Privileges Required
          </h2>
          <p style={{ color: '#c8beaa', fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>
            You are signed in as <strong>{user.display_name}</strong> ({user.email}) with <strong>Reader</strong> permissions.
          </p>
          <div
            style={{
              backgroundColor: 'rgba(18, 63, 54, 0.9)',
              border: '1px solid rgba(196, 154, 69, 0.25)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontSize: '0.9rem',
              color: '#e8dcc4',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#c49a45' }}>Your Reader capabilities:</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#c8beaa', lineHeight: 1.6 }}>
              <li>Read all published cycling chronicles</li>
              <li>Leave reflections and comments</li>
              <li>Like rides and stories</li>
              <li>Change password and profile email</li>
            </ul>
          </div>
          <p style={{ color: '#c8beaa', fontSize: '0.92rem', margin: 0 }}>
            To compose drafts, connect Google Docs, or publish chronicles, please sign in with a Blogger or Administrator account.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            <button
              onClick={() => setAuthModalOpen(true)}
              id="switch-author-account-btn"
              style={{
                backgroundColor: '#c49a45',
                color: '#123f36',
                fontWeight: 700,
                fontSize: '0.95rem',
                padding: '12px 28px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(196, 154, 69, 0.4)',
              }}
            >
              🔑 Switch to Author / Admin Account
            </button>
            <Link
              href="/"
              style={{
                backgroundColor: 'transparent',
                color: '#e8dcc4',
                border: '1px solid rgba(196, 154, 69, 0.4)',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '12px 24px',
                borderRadius: '999px',
                textDecoration: 'none',
              }}
            >
              ← Explore Published Chronicles
            </Link>
          </div>
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#123f36', color: '#e8dcc4', background: 'linear-gradient(180deg, #123f36 0%, #0d2c26 100%)' }}>
        <Navbar />
        <div
          style={{
            maxWidth: '680px',
            margin: '80px auto',
            padding: '48px 36px',
            textAlign: 'center',
            backgroundColor: 'rgba(18, 63, 54, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: '1px solid rgba(196, 154, 69, 0.4)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <span style={{ fontSize: '3.5rem' }}>✍️</span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              color: '#f7f3ea',
              margin: 0,
            }}
          >
            Author Sign In Required
          </h2>
          <p style={{ color: '#c8beaa', fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>
            Blank Canvas allows Bloggers and Administrators to turn Google Docs and Google Photos albums into interactive cycling chronicles. Please sign in to continue.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            <button
              onClick={() => setAuthModalOpen(true)}
              id="author-signin-btn"
              style={{
                backgroundColor: '#c49a45',
                color: '#123f36',
                fontWeight: 700,
                fontSize: '0.95rem',
                padding: '12px 28px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(196, 154, 69, 0.4)',
              }}
            >
              🔑 Sign In as Author
            </button>
            <Link
              href="/"
              style={{
                backgroundColor: 'transparent',
                color: '#e8dcc4',
                border: '1px solid rgba(196, 154, 69, 0.4)',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '12px 24px',
                borderRadius: '999px',
                textDecoration: 'none',
              }}
            >
              ← Back to Chronicles
            </Link>
          </div>
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#123f36', color: '#e8dcc4', background: 'linear-gradient(180deg, #123f36 0%, #0d2c26 100%)' }}>
      <Navbar />

      {/* Header Bar with Tabs, Draft Switcher & Quick Load */}
      <div
        style={{
          borderBottom: '1px solid rgba(196, 154, 69, 0.25)',
          backgroundColor: 'rgba(18, 63, 54, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '16px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: '#f7f3ea',
                margin: 0,
              }}
            >
              {currentSlug ? `Editing: ${title || currentSlug}` : 'The Blank Canvas'}
            </h1>
            {currentSlug && (
              <span
                style={{
                  backgroundColor: '#eab308',
                  color: '#123f36',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  letterSpacing: '0.04em',
                }}
              >
                DRAFT
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#c8beaa', margin: '4px 0 0 0' }}>
            {currentSlug
              ? 'Modifying saved draft in your Notebook. Changes update this draft directly.'
              : 'Add links to your Google Doc & Google Photos album, preview instantly, and publish without storing any photos.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Draft Switcher */}
          {availableDrafts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#c49a45', fontWeight: 600 }}>
                📋 Resume Draft:
              </span>
              <select
                value={currentSlug || ''}
                id="draft-selector-dropdown"
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentSlug(e.target.value);
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', `/new?slug=${e.target.value}`);
                    }
                  } else {
                    handleStartFresh();
                  }
                }}
                style={{
                  backgroundColor: 'rgba(18, 63, 54, 0.9)',
                  border: '1px solid rgba(196, 154, 69, 0.4)',
                  color: '#e8dcc4',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  maxWidth: '220px',
                }}
              >
                <option value="">+ New Blank Canvas</option>
                {availableDrafts.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    📝 {d.title || d.slug}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentSlug && (
            <button
              onClick={handleStartFresh}
              id="clear-start-fresh-btn"
              style={{
                backgroundColor: 'rgba(18, 63, 54, 0.8)',
                color: '#c8beaa',
                border: '1px solid rgba(196, 154, 69, 0.3)',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              + Start Fresh
            </button>
          )}

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(18, 63, 54, 0.8)',
              border: '1px solid rgba(196, 154, 69, 0.3)',
              borderRadius: '8px',
              padding: '3px',
            }}
          >
            <button
              onClick={() => setActiveTab('editor')}
              id="tab-editor-btn"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: activeTab === 'editor' ? '#123f36' : '#e8dcc4',
                backgroundColor: activeTab === 'editor' ? '#c49a45' : 'transparent',
              }}
            >
              ✏️ Editor Canvas
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              id="tab-preview-btn"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: activeTab === 'preview' ? '#123f36' : '#e8dcc4',
                backgroundColor: activeTab === 'preview' ? '#c49a45' : 'transparent',
              }}
            >
              👁️ Live Blog Preview
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {currentSlug && (
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                id="top-delete-btn"
                title="Delete this chronicle"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '999px',
                  padding: '7px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            )}

            <button
              onClick={() => handleSavePost('draft')}
              disabled={isPublishing}
              id="top-draft-btn"
              style={{
                backgroundColor: 'rgba(18, 63, 54, 0.85)',
                color: '#e8dcc4',
                border: '1px solid rgba(196, 154, 69, 0.4)',
                borderRadius: '999px',
                padding: '7px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💾 Save Draft
            </button>

            <button
              onClick={() => handleSavePost('published')}
              disabled={isPublishing}
              id="publish-blog-btn"
              style={{
                background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
                color: '#123f36',
                fontSize: '0.9rem',
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: '999px',
                boxShadow: '0 4px 16px rgba(196, 154, 69, 0.35)',
                cursor: 'pointer',
                opacity: isPublishing ? 0.7 : 1,
              }}
            >
              {isPublishing ? 'Saving...' : '🚀 Publish Blog'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage.text && (
        <div
          style={{
            padding: '10px 32px',
            fontSize: '0.85rem',
            backgroundColor:
              statusMessage.type === 'error'
                ? 'rgba(239, 68, 68, 0.2)'
                : statusMessage.type === 'success'
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(59, 130, 246, 0.2)',
            color:
              statusMessage.type === 'error'
                ? '#fca5a5'
                : statusMessage.type === 'success'
                ? '#86efac'
                : '#93c5fd',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Main View Area */}
      {activeTab === 'preview' ? (
        <div style={{ position: 'relative' }}>
          <BlogReader
            post={previewPost}
            onBackdropChange={(idx) => setBackdropIndex(idx)}
          />
        </div>
      ) : (
        <main
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          {/* Section 1: Title & Ride Metadata */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
              borderRadius: '16px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🏷️</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                1. Blog Story Title & Metadata
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Blog Post Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Day 1 Kent Cycling - Autumn 2026"
                  id="input-blog-title"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Date / Season
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. October 2026"
                  id="input-blog-date"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Route Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Canterbury to Brighton"
                  id="input-blog-location"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            {/* Chaining Chronicles: Tour & Stage Selector */}
            <div
              style={{
                backgroundColor: 'rgba(18, 63, 54, 0.45)',
                border: '1px solid rgba(196, 154, 69, 0.3)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: '#c49a45', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🚲</span>
                  <span>Tour / Multi-Day Series (Chain Chronicles)</span>
                </span>
                {!isCreatingNewTour && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewTour(true)}
                    id="new-tour-series-btn"
                    style={{
                      background: 'none',
                      border: '1px solid rgba(196, 154, 69, 0.4)',
                      borderRadius: '6px',
                      color: '#c49a45',
                      padding: '3px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Create New Tour Series
                  </button>
                )}
              </div>

              {isCreatingNewTour ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(18, 63, 54, 0.6)', padding: '12px', borderRadius: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tour Series Title (e.g. Kent Autumn Cycling 2026)"
                    value={newTourTitle}
                    onChange={(e) => setNewTourTitle(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #c49a45', backgroundColor: '#123f36', color: '#fff', fontSize: '0.88rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Short Tour Overview / Description"
                    value={newTourDesc}
                    onChange={(e) => setNewTourDesc(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #c49a45', backgroundColor: '#123f36', color: '#fff', fontSize: '0.88rem' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newTourTitle || !token) return;
                        try {
                          const res = await fetch('/api/tours', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ title: newTourTitle, description: newTourDesc }),
                          });
                          if (res.ok) {
                            const newTour = await res.json();
                            setAvailableTours((prev) => [newTour, ...prev]);
                            setTourId(newTour.id);
                            setIsCreatingNewTour(false);
                            setNewTourTitle('');
                            setNewTourDesc('');
                          } else {
                            const err = await res.json().catch(() => ({}));
                            alert(err.error || 'Failed to create tour series');
                          }
                        } catch (err) {
                          alert('Error creating tour series');
                        }
                      }}
                      style={{ backgroundColor: '#c49a45', color: '#123f36', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      Save Tour Series
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewTour(false)}
                      style={{ background: 'none', color: '#e8dcc4', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                      Assign to Tour Series
                    </label>
                    <select
                      value={tourId}
                      onChange={(e) => setTourId(e.target.value)}
                      id="select-tour-series"
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">(None - Standalone Chronicle)</option>
                      {availableTours.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                      Stage / Day Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1 for Day 1"
                      value={dayNumber}
                      onChange={(e) => setDayNumber(e.target.value)}
                      id="input-day-number"
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Story Text Link & Editor */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
              borderRadius: '16px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>📄</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  2. Story Content (Google Doc Link or Paste)
                </h2>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#c49a45', fontWeight: 600 }}>
                {paragraphs.length > 0 
                  ? `${paragraphs.length} paragraphs • ⏱️ ${calculateReadTimeMinutes(paragraphs)} min read` 
                  : (storyText 
                      ? `⏱️ ${calculateReadTimeMinutes(storyText.split(/\r?\n\r?\n/).filter(Boolean))} min read` 
                      : 'No text yet')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="Paste Google Doc link (e.g. https://docs.google.com/document/d/...)"
                id="input-google-doc-url"
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(42, 107, 92, 0.22)',
                  border: '1px solid rgba(196, 154, 69, 0.38)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#f7f3ea',
                  fontSize: '0.92rem',
                }}
              />
              <button
                onClick={() => triggerFetchDoc()}
                disabled={isFetchingDoc || !docUrl}
                id="fetch-google-doc-btn"
                style={{
                  background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
                  color: '#123f36',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  opacity: isFetchingDoc || !docUrl ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {isFetchingDoc ? 'Fetching...' : '📥 Fetch Google Doc'}
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Story Text (Fetched or manually pasted / edited)
              </label>
              <textarea
                rows={8}
                value={storyText}
                onChange={(e) => {
                  setStoryText(e.target.value);
                  setParagraphs(e.target.value.split(/\r?\n\r?\n/).map(p => p.trim()).filter(Boolean));
                }}
                placeholder="The text of your bike ride will appear here. You can also paste text directly."
                id="textarea-story-text"
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '14px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Section 3: Google Photos Shared Album (Zero Storage) */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
              borderRadius: '16px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>📷</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  3. Photography (Google Photos Album Link - Max 15)
                </h2>
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#86efac',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}
              >
                🔒 Zero Local Storage (Streamed from Google Photos)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={photosAlbumUrl}
                onChange={(e) => setPhotosAlbumUrl(e.target.value)}
                placeholder="Paste Google Photos shared album (e.g. https://photos.app.goo.gl/...)"
                id="input-photos-album-url"
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(42, 107, 92, 0.22)',
                  border: '1px solid rgba(196, 154, 69, 0.38)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#f7f3ea',
                  fontSize: '0.92rem',
                }}
              />
              <button
                onClick={() => triggerFetchPhotos()}
                disabled={isFetchingPhotos || !photosAlbumUrl}
                id="fetch-photos-album-btn"
                style={{
                  background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
                  color: '#123f36',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  opacity: isFetchingPhotos || !photosAlbumUrl ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {isFetchingPhotos ? 'Fetching...' : '📥 Fetch Photos'}
              </button>
            </div>

            {/* Photos Preview & Backdrop Selector Grid */}
            {photos.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Click a photo to select it as the <strong>Blue & White Duotone Backdrop</strong> (currently photo {backdropIndex + 1}):
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                    {photos.length} photos in gallery band
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '12px',
                  }}
                >
                  {photos.map((photo, index) => {
                    const isBackdrop = index === backdropIndex;

                    return (
                      <button
                        key={photo.id || index}
                        onClick={() => setBackdropIndex(index)}
                        id={`choose-backdrop-${index}`}
                        title="Click to set as duotone backdrop"
                        style={{
                          position: 'relative',
                          aspectRatio: '1/1',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: isBackdrop ? '3px solid #38bdf8' : '1px solid #334155',
                          boxShadow: isBackdrop ? '0 0 16px rgba(56, 189, 248, 0.5)' : 'none',
                          transform: isBackdrop ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.2s',
                          backgroundColor: '#0f172a',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getSafeImageUrl(photo.thumbUrl || photo.baseUrl)}
                          alt={photo.title || `Photo ${index + 1}`}
                          referrerPolicy="no-referrer"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        {isBackdrop && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(29, 78, 216, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            ✓ Backdrop
                          </div>
                        )}
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          #{index + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Summary Box & Essential Hyperlinks */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
              borderRadius: '16px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                4. Summary Statistics & Hyperlinks
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Distance
                </label>
                <input
                  type="text"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g. 64 miles"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Elevation
                </label>
                <input
                  type="text"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  placeholder="e.g. 1,420 m"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Moving Time
                </label>
                <input
                  type="text"
                  value={movingTime}
                  onChange={(e) => setMovingTime(e.target.value)}
                  placeholder="e.g. 5h 12m"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Weather / Conditions
                </label>
                <input
                  type="text"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  placeholder="e.g. Crisp, 14°C"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Hyperlink List Builder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Actionable Hyperlinks (Strava, Komoot, Cafes, GPX):
                </span>
                <button
                  onClick={handleAddLink}
                  id="add-hyperlink-btn"
                  style={{
                    fontSize: '0.8rem',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  + Add Link
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {links.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Label (e.g. Strava Route)"
                      value={link.label}
                      onChange={(e) => handleUpdateLink(idx, 'label', e.target.value)}
                      style={{
                        width: '200px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#fff',
                        fontSize: '0.85rem',
                      }}
                    />
                    <input
                      type="url"
                      placeholder="URL (https://...)"
                      value={link.url}
                      onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#fff',
                        fontSize: '0.85rem',
                      }}
                    />
                    <button
                      onClick={() => handleRemoveLink(idx)}
                      style={{ color: '#f87171', fontSize: '0.85rem', padding: '4px 8px' }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Map Image Link */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Permanent Route Map Image / Link (Optionally at the bottom of the right band)
              </label>
              <input
                type="url"
                value={routeMapUrl}
                onChange={(e) => setRouteMapUrl(e.target.value)}
                placeholder="Image URL for permanent route map snapshot (e.g. Strava map snapshot, Komoot image)"
                id="input-route-map-url"
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.92rem',
                }}
              />
            </div>

            {/* GPX Route Track (Upload file to database or enter external URL) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>
                GPX Route Track (Upload .gpx file or enter URL)
              </label>

              {/* Simple File Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="file"
                  accept=".gpx"
                  onChange={handleGpxFileUpload}
                  disabled={isUploadingGpx}
                  id="input-gpx-file"
                  style={{ fontSize: '0.85rem', color: '#cbd5e1' }}
                />
                {isUploadingGpx && (
                  <span style={{ fontSize: '0.8rem', color: '#c49a45' }}>Uploading to database...</span>
                )}
              </div>

              {/* Show attached file confirmation */}
              {gpxFileMeta && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#8bbb92' }}>
                  <span>✓ Attached: <strong>{gpxFileMeta.filename}</strong></span>
                  <button
                    type="button"
                    onClick={handleRemoveGpx}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Optional external URL input */}
              <input
                type="url"
                value={gpxUrl}
                onChange={(e) => setGpxUrl(e.target.value)}
                placeholder="Or paste external URL (e.g. Strava or Komoot link)"
                id="input-gpx-url"
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.92rem',
                }}
              />
            </div>
          </div>

          {/* Section 5: Post Lifecycle, Privacy & Moderation */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(196, 154, 69, 0.35)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
              borderRadius: '16px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>⚙️</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#f7f3ea' }}>
                5. Lifecycle Status, Privacy & Moderation
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Lifecycle Status Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                  Chronicle Lifecycle State:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPostStatus('draft')}
                    id="status-draft-select"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: postStatus === 'draft' ? '#123f36' : '#cbd5e1',
                      backgroundColor: postStatus === 'draft' ? '#c49a45' : '#0f172a',
                      border: '1px solid #475569',
                      cursor: 'pointer',
                    }}
                  >
                    📝 Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostStatus('published')}
                    id="status-published-select"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: postStatus === 'published' ? '#123f36' : '#cbd5e1',
                      backgroundColor: postStatus === 'published' ? '#c49a45' : '#0f172a',
                      border: '1px solid #475569',
                      cursor: 'pointer',
                    }}
                  >
                    🚀 Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostStatus('archived')}
                    id="status-archived-select"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: postStatus === 'archived' ? '#123f36' : '#cbd5e1',
                      backgroundColor: postStatus === 'archived' ? '#c49a45' : '#0f172a',
                      border: '1px solid #475569',
                      cursor: 'pointer',
                    }}
                  >
                    📦 Archived
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                  {postStatus === 'draft' && 'Draft: Visible only to you in your notebook. Excluded from public feeds.'}
                  {postStatus === 'published' && 'Published: Active chronicle with timestamp, appearing on public discovery feeds.'}
                  {postStatus === 'archived' && 'Archived: Retired chronicle preserved at direct link. Front feed excluded & comments closed.'}
                </p>
              </div>

              {/* Privacy Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                  Audience Visibility:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    id="visibility-public-btn"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: isPublic ? '#123f36' : '#cbd5e1',
                      backgroundColor: isPublic ? '#c49a45' : '#0f172a',
                      border: '1px solid #475569',
                      cursor: 'pointer',
                    }}
                  >
                    🌐 Public (All Readers)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    id="visibility-private-btn"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: !isPublic ? '#123f36' : '#cbd5e1',
                      backgroundColor: !isPublic ? '#c49a45' : '#0f172a',
                      border: '1px solid #475569',
                      cursor: 'pointer',
                    }}
                  >
                    🔒 Private (Members Only)
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                  {isPublic ? 'Anyone visiting VeloTales can discover and read this post.' : 'Restricted to authenticated cycling bloggers.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Comment Moderation Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                  Comment Moderation Mode:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setApproveComments(false)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: !approveComments ? '#123f36' : '#cbd5e1',
                      backgroundColor: !approveComments ? '#c49a45' : '#0f172a',
                      border: '1px solid #475569',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Instant (Auto-Approve)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveComments(true)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: approveComments ? '#123f36' : '#cbd5e1',
                      backgroundColor: approveComments ? '#c49a45' : '#0f172a',
                      border: '1px solid #475569',
                      cursor: 'pointer',
                    }}
                  >
                    🛡️ Moderate (Review First)
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                  {approveComments ? 'Comments remain hidden until you or an admin approve them.' : 'Reader comments post immediately with honeypot spam protection.'}
                </p>
              </div>

              {/* Tags Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                  Tags (comma-separated):
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. gravel, kent, autumn, bikepacking"
                  id="input-post-tags"
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                  Tags help cyclists find rides by terrain, location, or season.
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
              paddingTop: '16px',
            }}
          >
            <button
              onClick={() => setActiveTab('preview')}
              id="bottom-preview-btn"
              style={{
                backgroundColor: 'rgba(18, 63, 54, 0.85)',
                border: '1px solid rgba(196, 154, 69, 0.45)',
                color: '#e8dcc4',
                padding: '12px 24px',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              👁️ Preview Live Blog First
            </button>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => handleSavePost('draft')}
                disabled={isPublishing}
                id="bottom-draft-btn"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(196, 154, 69, 0.5)',
                  color: '#e8dcc4',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  padding: '12px 24px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                }}
              >
                💾 Save Draft
              </button>

              <button
                onClick={() => handleSavePost('published')}
                disabled={isPublishing}
                id="bottom-publish-btn"
                style={{
                  background: 'linear-gradient(135deg, #c49a45 0%, #b08836 100%)',
                  color: '#123f36',
                  fontSize: '1.02rem',
                  fontWeight: 700,
                  padding: '12px 32px',
                  borderRadius: '999px',
                  boxShadow: '0 4px 20px rgba(196, 154, 69, 0.4)',
                  cursor: 'pointer',
                  opacity: isPublishing ? 0.7 : 1,
                }}
              >
                {isPublishing ? 'Saving...' : '🚀 Publish Chronicle'}
              </button>

              <button
                onClick={() => handleSavePost('archived')}
                disabled={isPublishing}
                id="bottom-archive-btn"
                style={{
                  backgroundColor: 'rgba(71, 85, 105, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  color: '#cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '12px 20px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                }}
              >
                📦 Archive
              </button>

              {currentSlug && (
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  id="bottom-delete-btn"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#fca5a5',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '12px 20px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {isDeleting ? 'Deleting...' : '🗑️ Delete Chronicle'}
                </button>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default function BlankCanvasPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#123f36',
            color: '#e8dcc4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>🚲</div>
          <p style={{ fontSize: '1.1rem' }}>Loading Blank Canvas...</p>
        </div>
      }
    >
      <BlankCanvasContent />
    </Suspense>
  );
}
