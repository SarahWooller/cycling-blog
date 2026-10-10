# Problems & Implementation Specifications

This document outlines the technical specifications, implementation solutions, and verification status for all requested items on the VeloTales platform.

---

## 1. Chronicle Slug Synchronization — ✅ COMPLETED

### Problem
- Previously, when a chronicle's title was modified, its slug did not update. For example, the Day 1 post had title `"Day 1 Kent Cycling - Autumn 2026"` but its slug was stuck on `"my-new-chronicle"`.
- This caused a mismatch between the article's title, its URL path (`/blog/my-new-chronicle`), and its editor link (`/new?slug=my-new-chronicle`).

### Implemented Solution
1. **Backend Auto-Slug Update (`backend/app/routers/posts.py`)**:
   - In `update_post`, when `post_update.title` is provided and differs from the existing title (and no manual slug is specified), the slug is dynamically regenerated using `slugify(post_update.title)`.
   - Automatic numerical collision avoidance ensures unique slugs (e.g. `title-slug-2`).
2. **Database Fix for Day 1 (`velotales.db`)**:
   - Day 1's slug in `velotales.db` was updated from `my-new-chronicle` to `day-1-kent-cycling-autumn-2026`.
3. **Database Integrity Preservation**:
   - Foreign key relations (`comments`, `likes`, `post_gpx`) reference `post.id` (UUID), so updating the slug leaves all associated media, comments, and GPX files intact.
4. **Frontend Seamless Sync (`src/app/new/page.js`)**:
   - When saving title changes that update the slug, the editor updates state and executes `window.history.replaceState(null, '', `/new?slug=${newSlug}`)` so subsequent saves continue editing seamlessly.

---

## 2. Author Display & Filtering — ✅ COMPLETED

### Problem
- The author's name was not displayed on chronicle cards on the home page (`ChroniclesSection.js`).
- Readers and bloggers had no way to filter chronicles by author.

### Implemented Solution
1. **Author Byline on Chronicle Cards (`src/components/ChroniclesSection.js`)**:
   - Each chronicle card prominently renders:
     `✍️ {post.author?.display_name || 'VeloTales Author'}`
   - Positioned in the card metadata band alongside date, distance, and reading time.
2. **Author Filter on Home Page (`src/components/ChroniclesSection.js`)**:
   - Added author filter controls derived dynamically from loaded posts.
   - Clicking an author filters the displayed chronicles in real-time.
3. **Backend Query Support (`backend/app/routers/posts.py`)**:
   - Added `author` query parameter to `GET /api/v1/posts` supporting filtering by author UUID, `username`, or `display_name`.
   - Forwarded through Next.js proxy route (`src/app/api/posts/route.js`).

---

## 3. Dynamic "Time to Read" Calculation — ✅ COMPLETED

### Problem
- In `BlogReader.js`, the reading time was previously hardcoded static text (`☕ 5 min read`).
- Chronicle cards on the front page did not show reading time.

### Implemented Solution
1. **Calculation Formula (`src/lib/readingTime.js`)**:
   - Standard average reading speed: **200 words per minute**:
     $$\text{Total Words} = \sum_{\text{paragraphs}} \text{word\_count}$$
     $$\text{Reading Time} = \max\left(1, \left\lceil \frac{\text{Total Words}}{200} \right\rceil\right) \text{ min read}$$
2. **Display Locations**:
   - **Chronicle Cards (`src/components/ChroniclesSection.js`)**:
     Renders `⏱️ {calculateReadTimeMinutes(post.paragraphs)} min read` badge on every card.
   - **Chronicle Reader Header (`src/components/BlogReader.js`)**:
     Renders dynamic reading time alongside author byline.
   - **Editor & Live Preview (`src/app/new/page.js`)**:
     Displays live paragraph count and read time badge in the Story Content section, and passes calculated read time into the live preview.

---

## 4. Author Filtering Dropdown — ✅ COMPLETED

### Problem
- Previously, author filtering used horizontal pill buttons (`[All Authors] [✍️ VeloTales Admin]`).
- As more authors contribute chronicles, a horizontal row of buttons becomes cumbersome, wraps across multiple rows, and clutters the section header.

### Implemented Solution
1. **Styled Dropdown Menu (`src/components/ChroniclesSection.js`)**:
   - Replaced horizontal pill buttons with an elegant custom `<select>` dropdown menu:
     - `All Authors (${totalCount})` (default option)
     - `${author.name} (${authorPostCount})` for each contributing author.
2. **Visual Aesthetics**:
   - Dark forest green background (`rgba(18, 63, 54, 0.9)`), warm gold border (`1px solid rgba(196, 154, 69, 0.45)`), cream typography (`#f7f3ea`), with a custom gold chevron indicator.
3. **Instant Reset Control**:
   - When a specific author is selected, an inline `✕ Clear Filter` button appears to quickly return to all authors.

---

## 5. Independent Panel Scrolling — ✅ COMPLETED

### Problem
- In `BlogReader.js`, the left story canvas and the right multimedia band scrolled together with the window.
- In long chronicles, readers lost sight of photo galleries, or if the multimedia band exceeded viewport height, readers could not scroll through thumbnails, maps, or GPX downloads without shifting their story reading position.

### Implemented Solution
1. **Desktop Dual Independent Scrolling (`src/components/BlogReader.js` & `src/app/blog/[slug]/page.js`)**:
   - On viewport widths `>= 1025px`, the page root shell locks to `height: 100vh; overflow: hidden; display: flex; flex-direction: column`.
   - The navigation bar sits at the top while the reader fills the exact remaining viewport height (`flex: 1; min-height: 0; overflow: hidden`), eliminating any off-screen bottom overflow.
   - Both panels scroll independently with slim golden scrollbars:
     - **Left Story Canvas (`left-story-panel`)**: `height: 100%; overflow-y: auto; padding-bottom: 72px` with a 64px bottom scroll buffer ensuring the story footer and tour links are fully visible with comfortable breathing room.
     - **Right Multimedia Band (`right-multimedia-panel`)**: `height: 100%; overflow-y: auto; padding-bottom: 72px` with a 64px bottom scroll buffer ensuring route maps,Poi links, and GPX download buttons are never chopped off at the bottom.
   - Reading progress bar automatically tracks and syncs with the left canvas scroll position.
2. **Responsive Mobile Flow (`< 1025px`)**:
   - Falls back gracefully to standard single-column document flow with natural native touch scrolling.

---

## 6. Author Biographies & Public Profiles — ✅ COMPLETED

### Problem
- Authors lacked dedicated public profiles and biographies.
- Readers had no way to explore an author's background, riding style, bike setups, or view all chronicles written by them.

### Implemented Solution
1. **Data Model Extensions (`backend/app/models.py` & `velotales.db`)**:
   - Added author profile fields to `users`: `bio_paragraphs`, `photos`, `backdrop_index`, `links`, `location`, `cycling_style`, `bike_setup`.
2. **Backend API Endpoints (`backend/app/routers/authors.py`)**:
   - `GET /api/v1/authors`: Public list of active authors and their published chronicles.
   - `GET /api/v1/authors/{identifier}`: Public profile by username or UUID with published posts.
   - `PUT /api/v1/authors/{id}`: Secure update endpoint for authors (or admins) to adjust bio, gallery, backdrop, and links.
3. **Public Author Page (`/author/[username]` & `AuthorProfileView.js`)**:
   - Adopts the signature duotone backdrop and two-column format:
     - **Left Panel**: Author bio narrative, location/riding style badges, and a catalog of all published chronicles with reading time badges.
     - **Right Multimedia Band**: Photo gallery with slideshow and external links (Strava, Komoot, Instagram, website).
     - **Explicit Constraint**: *No ride summary stats box* (no distance/elevation/moving time).
   - Authenticated authors and admins see an `✏️ Edit Profile` button to modify profile details in real-time.
4. **Platform Navigation**:
   - Author bylines on chronicle cards and inside the blog reader link directly to `/author/[username]`.

---

## 7. Chaining Chronicles Together (Tours & Multi-Day Series) — ✅ COMPLETED

### Problem
- Multi-day adventures (such as Day 1, Day 2 of Kent Autumn Cycling) were isolated posts without sequential progression or next/previous stage links.

### Implemented Solution
1. **Data Model Architecture (`tours` & `posts`)**:
   - Leveraged `Tour` model and foreign keys in `velotales.db`:
     - `tours`: `id`, `slug`, `title`, `description`, `author_id`.
     - `posts.tour_id`: links post to tour.
     - `posts.day_number`: tracks stage index (Day 1, Day 2, etc.).
2. **Backend Tour Endpoints (`backend/app/routers/tours.py`)**:
   - `GET /api/v1/tours`: Lists all tour series.
   - `GET /api/v1/tours/{identifier}`: Returns tour details with all associated posts ordered chronologically by `day_number ASC`.
   - `POST /api/v1/tours`: Allows authors to create new tour series.
3. **Blank Canvas Tour Chaining (`src/app/new/page.js`)**:
   - Added "Tour / Multi-Day Series" selector in Section 1 (Title & Metadata).
   - Allows assigning a post to an existing tour or creating a new tour series inline.
   - Includes "Stage / Day Number" field.
4. **Blog Reader Chained Navigation (`src/components/BlogReader.js`)**:
   - **Top Tour Banner**: Renders `🚲 Part of Tour Series: [Tour Title] • Day X of Y` with an interactive stage jump selector.
   - **Chained Navigation**: `← Prev Stage: Day 1` and `Next Stage: Day 3 →` displayed at both the top banner and bottom of the chronicle.
5. **Card Tour Badges (`src/components/ChroniclesSection.js`)**:
   - Chronicle cards show `🚲 [Tour Title] • Day X` badge.

---

## 8. User Profile Management & Directory — ✅ COMPLETED

### Problem Statement
- **Viewing Profiles:**
  - Readers and authors currently lack a centralized way to discover and view other members of the cycling community (e.g. an Authors & Community Directory).
  - While public author pages exist at `/author/[username]`, there is no directory route (`/authors`) and no direct navigation link in the top bar to browse profiles or view one's own profile.
  - The navigation bar (`Navbar.js`) only opens a basic authentication dialog with a "Log Out" button rather than a personal user menu.
- **Editing Profiles:**
  - Profile customization is currently limited to an inline toggle buried on `/author/[username]` that only edits biography text and bike setup.
  - Users cannot easily update their display name, avatar photo, external profile links (Komoot, Strava, Instagram), cycling style, or change their account password from a centralized profile settings interface.

### Implemented Architecture & Solution

#### 1. Navigation & Discoverability (`src/components/Navbar.js`)
- Replaced the simple authentication toggle with an interactive **User Account Menu**:
  - **Logged-in State:** Displays avatar thumbnail, display name, and role badge (`Reader`, `Blogger`, or `Admin`).
  - **Account Dropdown Actions:**
    - 👤 **View Public Profile** (`/author/${user.username}`): Quick jump to one's public showcase page.
    - ⚙️ **Edit Profile & Settings** (`/profile`): Dedicated screen to edit identity, cycling bio, links, and security.
    - 👥 **Authors & Community** (`/authors`): Direct link to explore all registered members and storytellers.
    - 🛡️ **Admin Dashboard** (`/admin`): Exclusively visible for `admin` role accounts.
    - 🚪 **Sign Out**: Clears session and updates UI state.

#### 2. Authors & Community Directory Page (`src/app/authors/page.js` & `AuthorsDirectoryView.js`)
- **Public Directory:**
  - Route: `/authors`
  - Fetches all public authors via `GET /api/v1/authors`.
  - Responsive grid of duotone community cards showcasing:
    - Author Avatar & Display Name.
    - Cycling Style & Location badges (e.g., *Gravel & Bikepacking • Kent, UK*).
    - Bio snippet.
    - Published chronicle count and total distance/routes.
    - Direct button: `Read Profile →` linking to `/author/[username]`.

#### 3. Dedicated Profile Editor (`src/app/profile/page.js` & `ProfileEditorView.js`)
- **Profile Settings Interface:**
  - Accessible at `/profile` (protected route, requires authentication).
  - Organized into three clean sections:
    1. **Identity & Avatar:**
       - Display Name (editable).
       - Avatar Image URL (with Google Photos streaming proxy support).
       - Location & Cycling Style (e.g. *Endurance Touring, Road, Gravel*).
       - Bike Setup & Gear description.
    2. **Story Narrative & Links:**
       - Biography paragraphs (add, edit, reorder paragraphs).
       - Social & Route Tracking Links (Strava, Komoot, Instagram, Personal Website).
       - Personal Photo Showcase: Add/manage remote photo URLs for the author's profile slideshow.
    3. **Account Security:**
       - Change Password card: Current password validation + new password confirmation via `POST /api/v1/auth/change-password`.

#### 4. Front Page Profile Access (`src/components/HeroActions.js` & `src/components/ChroniclesSection.js`)
- **Hero Action Button:** Added a prominent `👤 Read My Profile` (when logged in) or `👥 Read Author Profiles` button in the front page Hero section.
- **Author Filter Direct Link:** Added an instant `👤 Read Profile` button alongside the Author dropdown filter on `ChroniclesSection.js` so readers can jump directly to the profile of the selected author with a single click, or explore all authors.
- **Card Bylines:** Retain direct clickable links on all chronicle cards leading to `/author/[username]`.

#### 5. Backend Endpoints (`backend/app/routers/authors.py` & `auth.py`)
- `GET /api/v1/authors`: Returns list of all active community authors and published chronicles.
- `GET /api/v1/auth/me`: Returns full profile of the authenticated user.
- `PUT /api/v1/authors/{id}`: Authenticated endpoint allowing users to update their own profile fields (`display_name`, `avatar_url`, `location`, `cycling_style`, `bike_setup`, `bio_paragraphs`, `photos`, `links`), or admins to edit any profile.
- `POST /api/v1/auth/change-password`: Secure password change with verification of old password.

---

## 9. Admin User Management & Permissions Page — ✅ COMPLETED

### Problem Statement
- Currently, administrators have backend API routes for managing users (`/admin/users`, `/admin/users/{id}/role`, `/admin/users/{id}/block`), but **no user interface exists** on the frontend.
- Admins cannot visually view all registered accounts, create new accounts, assign roles, or manage permissions without using command-line API calls.
- There is no administrative mechanism to onboard new bloggers or team members directly with a pre-configured role.

### Implemented Architecture & Solution

#### 1. Admin Management Dashboard (`src/app/admin/page.js`)
- **Dedicated Route:** `/admin` (or `/admin/users`).
- **Security & Route Guard:**
  - Restricted strictly to users where `user.role === 'admin'`.
  - Non-admin visitors or unauthenticated users receive a styled 403 Forbidden alert with a link back to homepage.
  - Next.js API proxy (`src/app/api/admin/users/route.js`) forwards the JWT Bearer token to FastAPI's `require_admin` dependency.

#### 2. User Administration Table & Capabilities
- **Search & Filter:**
  - Search by username, display name, or email address.
  - Filter by role (`All Roles`, `Reader`, `Blogger`, `Admin`) and status (`Active`, `Blocked`).
- **User Roster Grid / Table:**
  - **User Identity:** Avatar, display name, username, and email.
  - **Role Selector:** Interactive dropdown to instantly amend permissions:
    - `reader`: Can read, like, and comment on chronicles.
    - `blogger`: Can create, edit, publish chronicles, upload GPX tracks, and create Tour series.
    - `admin`: Full moderation, user management, and platform configuration.
  - **Chronicles Count:** Number of published posts by this user.
  - **Account Status Toggle:**
    - `Active` (Green badge) vs `Blocked` (Red badge).
    - One-click Block / Unblock action (automatically synchronizes with `blocked_emails` database table).
    - Safety guardrail: Admin cannot block or demote their own account.
  - **Profile Jump:** Direct link to view the user's public profile page (`/author/[username]`).

#### 3. "Add New User" Modal / Form
- An administrative creation form allowing admins to invite or provision users directly:
  - **Full Name / Display Name** (e.g. *Sarah Wooller*).
  - **Username** (e.g. *sarah*).
  - **Email Address** (checked against blocked email registry).
  - **Initial Password** (temporary password provided by admin).
  - **Assigned Role**: Select `Reader`, `Blogger`, or `Admin` upon creation.
- **Backend Endpoint (`POST /api/v1/admin/users`)**:
  - Created inside `backend/app/routers/admin.py`.
  - Hashes the initial password, assigns the chosen role, validates uniqueness, and saves to `velotales.db`.

#### 4. System Statistics Header
- Top metrics band showing platform health at a glance:
  - Total Registered Users
  - Active Bloggers / Authors
  - Readers / Subscribers
  - Blocked Accounts

