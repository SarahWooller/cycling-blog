import Navbar from '@/components/Navbar';
import DuotoneBackdrop from '@/components/DuotoneBackdrop';
import HeroActions from '@/components/HeroActions';
import ChroniclesSection from '@/components/ChroniclesSection';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

// Fallback photo: user's requested photo https://photos.app.goo.gl/DkjZjzt6AeBzVdge8
const DEFAULT_HOME_BACKDROP_URL =
  'https://lh3.googleusercontent.com/pw/AP1GczOI5lK6G4RzbpdSyo7l-SY-Znj9eFHDwdelvrLkR9WtyVPfyvChwGX84nN__IT1RyVBGszg1PUMzo963iMTiEUwB26xAcMaX5y6aniKTv8w95es46hb=w1600';

async function getHomeData() {
  let backdropUrl = DEFAULT_HOME_BACKDROP_URL;
  let posts = [];

  // Fetch site settings & posts from database via FastAPI backend
  try {
    const [settingsRes, postsRes] = await Promise.all([
      fetch(`${FASTAPI_URL}/settings/public`, { cache: 'no-store' }).catch(() => null),
      fetch(`${FASTAPI_URL}/posts?filter_by=latest`, { cache: 'no-store' }).catch(() => null),
    ]);

    if (settingsRes && settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings.home_backdrop_url) {
        backdropUrl = settings.home_backdrop_url.includes('photos.app.goo.gl')
          ? DEFAULT_HOME_BACKDROP_URL
          : settings.home_backdrop_url;
      }
    }

    if (postsRes && postsRes.ok) {
      posts = await postsRes.json();
    }
  } catch (err) {
    console.warn('Failed fetching data from backend API:', err.message);
  }

  return { backdropUrl, posts };
}

export default async function HomePage() {
  const { backdropUrl, posts } = await getHomeData();

  return (
    <div style={{ position: 'relative', minHeight: '100vh', color: '#e8dcc4' }}>
      {/* 1. Backdrop aligned to center-top so the cyclists' heads are fully visible */}
      <DuotoneBackdrop
        imageUrl={backdropUrl}
        alt="VeloTales Cycling Landscape Backdrop"
        position="center top"
      />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />

        {/* Hero Section */}
        <header
          style={{
            padding: '72px 32px 48px',
            maxWidth: '1100px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* Main Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '3.4rem',
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: '-0.025em',
              maxWidth: '850px',
              background: 'linear-gradient(135deg, #f7f3ea 0%, #e8dcc4 60%, #c49a45 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 24px rgba(18, 63, 54, 0.6)',
            }}
          >
            Stories from the Sussex Saddle
          </h1>

          <p
            style={{
              fontSize: '1.25rem',
              color: '#e8dcc4',
              maxWidth: '680px',
              lineHeight: 1.65,
              fontWeight: 400,
              textShadow: '0 2px 12px rgba(18, 63, 54, 0.8)',
            }}
          >
            Chronicles of the Saddle Sore and Slightly Euphoric
          </p>

          {/* CTA Button Group: Role Aware */}
          <HeroActions featuredSlug={posts[0]?.slug} />
        </header>

        {/* Featured Posts & Drafts Showcase with Published / My Drafts Tabs */}
        <ChroniclesSection initialPosts={posts} />

        {/* Footer */}
        <footer
          style={{
            padding: '32px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#c8beaa',
            borderTop: '1px solid rgba(196, 154, 69, 0.25)',
            backgroundColor: 'rgba(18, 63, 54, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p style={{ margin: 0 }}>
            VeloTales
          </p>
        </footer>
      </div>
    </div>
  );
}
