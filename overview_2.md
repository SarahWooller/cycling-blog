# Cycling Blog Platform - Functional & Architectural Specification (Overview 2)

## 1. Vision & Core Philosophy

The goal is to create a modern, elegant web platform for publishing cycling blog stories, built with **Next.js** and **npm**.

### Guiding Principles
- **Blank Canvas First**: The author starts with a clean, blank slate where creating a post requires simply adding links (Google Photos album, Google Doc, route links), previewing the result in real time, and hitting **Publish**.
- **Zero Photo Storage**: The platform **does not host or store image files**. All photos remain hosted on Google Photos (or external links). The platform resolves and displays them dynamically via remote URLs.
- **Rich, Immersive Visual Design**: High-contrast typography over a duotone blue-and-white background, framed with full vibrancy, paired with an interactive multimedia sidebar and slideshow.

---

## 2. Technical Stack

- **Framework**: **Next.js (App Router, React)**
  - Dynamic routing for posts (`/new` for blank canvas editor, `/blog/[slug]` for published posts).
  - Next.js API route to resolve public Google Photos shared albums and Google Docs into structured URLs and text on the fly.
  - SEO optimization with server-side metadata generation for social sharing.
- **Styling**: Modern Vanilla CSS / CSS Modules with CSS variables, backdrop filters (`glassmorphism`), duotone blend modes, and responsive grid/flexbox layouts.
- **Package Manager**: `npm`.

---

## 3. The "Blank Canvas" & Publishing Workflow

```
+----------------------------------------------------------------------------------------+
|                                BLANK CANVAS EDITOR                                     |
|                                                                                        |
|  1. Add Google Doc Link (or paste text)   -->  Text parsed into readable story         |
|  2. Add Google Photos Album Link (max 15) -->  Live photos fetched dynamically        |
|  3. Select Backdrop Photo                 -->  Applies blue & white duotone filter     |
|  4. Add Summary & Custom Hyperlinks       -->  Generates stats & links badges          |
|  5. Add Route Map Photo/Link (optional)   -->  Locks permanent map at bottom right     |
|                                                                                        |
|  [ Live Interactive Preview Updates Instantly ]                                        |
|                                                                                        |
|  [ PUBLISH BLOG ] -------------------------->  Saves post metadata (links & settings)  |
|                                                WITHOUT saving any image files!         |
+----------------------------------------------------------------------------------------+
```

### Step-by-Step Flow
1. **Initiate**: The author opens the blank canvas (`/new`).
2. **Input Links**:
   - **Google Doc Link**: Fetches the text dynamically (or allows pasting raw text).
   - **Google Photos Shared Album**: Dynamically resolves up to 15 photo URLs from the shared album.
3. **Configure & Curate**:
   - **Backdrop Picker**: Author selects one photo from the fetched album to serve as the page backdrop.
   - **Summary & Links**: Author adds distance, elevation, notes, and links (e.g. Strava, Komoot, accommodation, GPX download).
   - **Route Map**: Author optionally specifies a route map photo or map link.
4. **Publish**:
   - Clicking **"Publish"** saves only the post metadata (the URLs, selected backdrop index, summary details, and title).
   - No photos are uploaded or stored locally.

---

## 4. Page Layout & Visual Design

```
+---------------------------------------------------------------------------------------+
|  PAGE BACKDROP: User-selected photo in blue & white duotone (covers viewport)         |
|                                                                                       |
|  +--------------------------------------------+  +---------------------------------+  |
|  | VIBRANT OUTER FRAME / BORDER               |  | RIGHT MULTIMEDIA BAND           |  |
|  | +----------------------------------------+ |  | +-----------------------------+ |  |
|  | | MAIN BLOG READING CANVAS               | |  | | ENLARGED PHOTO DISPLAY      | |  |
|  | | (Frosted glass / lightened background  | |  | | - Full natural vibrancy     | |  |
|  | |  with high-contrast typography)        | |  | | - Slideshow Play/Pause      | |  |
|  | |                                        | |  | | - Prev / Next navigation    | |  |
|  | | Title: "Day 1 Kent Cycling"            | |  | +-----------------------------+ |  |
|  | | Date & Ride Meta                       | |  |                                 |  |
|  | |                                        | |  | THUMBNAIL STRIP (Up to 15)     |  |
|  | | Story Text:                            | |  | [T1] [T2] [T3] [T4] [T5] ...   |  |
|  | | "This bike ride has been some time     | |  +---------------------------------+  |
|  | |  in the making, perhaps even           | |  | SUMMARY & HYPERLINKS BOX        |  |
|  | |  35 years..."                          | |  | - Ride stats (Distance, Elev)  |  |
|  | |                                        | |  | - Strava / Komoot / Cafe links |  |
|  | | [Long-form reading experience]         | |  +---------------------------------+  |
|  | |                                        | |  | ROUTE MAP BOX (Permanent)      |  |
|  | |                                        | |  | - Map of the route / GPX view  |  |
|  | +----------------------------------------+ |  +---------------------------------+  |
|  +--------------------------------------------+                                       |
+---------------------------------------------------------------------------------------+
```

### Visual Specifications
1. **Backdrop Filter (Blue & White Duotone)**:
   - Full-bleed background using CSS duotone filters (`filter: grayscale(100%) contrast(125%)` combined with blue color toning or SVG duotone filter).
2. **Vibrant Frame & Text Legibility**:
   - **Outer Frame**: Keeps the natural vibrant framing and texture visible around the blog margins.
   - **Reading Area**: Substantially lightened background with high opacity and frosted glass blur (`backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.92)`).
   - **Typography**: Dark slate/charcoal text (`#0f172a`) with modern typography for comfortable long-form reading.

---

## 5. Right Multimedia Band & Interactive Features

1. **Enlarged Photo Display**:
   - Shows the currently selected photo in full natural color and crisp resolution.
   - Clicking opens an immersive fullscreen lightbox view.
2. **Slideshow Functionality**:
   - **Auto-Play**: Toggle button to start/pause automatic cycling through all 15 photos.
   - **Interval Controls**: Smooth transitions (cross-fade) between images every few seconds.
   - **Manual Navigation**: Previous (`<`) and Next (`>`) arrows directly on the enlarged viewer, as well as keyboard arrow keys.
3. **Thumbnail Strip (Max 15 Photos)**:
   - Grid or strip beneath the enlarged viewer showing all photos from the album.
   - Clicking any thumbnail immediately updates the enlarged viewer and pauses/updates the slideshow position.
   - Visual indicator highlighting the currently active thumbnail.
4. **Summary & Hyperlinks Box**:
   - Card positioned beneath the thumbnails.
   - Displays summary statistics (e.g. distance, elevation, time, weather).
   - Actionable hyperlink buttons for external resources (Strava ride, Komoot collection, café/pub stops, accommodation, GPX file).
5. **Permanent Route Map Box (Bottom Right)**:
   - Dedicated box at the bottom of the right band.
   - Displays a permanent visual of the route map (either an image link or interactive route embed).

---

## 6. Responsive Behavior

- **Desktop (>= 1024px)**: Dual-column layout. The left column scrolls the story while the right multimedia band remains sticky and accessible.
- **Tablet / Mobile (< 1024px)**: Responsive single-column flow:
  - The hero backdrop maintains the duotone aesthetic.
  - The multimedia gallery adapts to an interactive top carousel with slideshow controls and expandable thumbnails.
  - The summary box and route map sit gracefully between or below the reading sections.

---

## 7. Next Implementation Steps

1. **Project Setup**: Initialize Next.js project with App Router.
2. **Dynamic Ingestion Service**: Build lightweight Google Photos album link parser and Google Doc text importer.
3. **Blank Canvas Creator (`/new`)**: Build the blank canvas UI with link inputs, live preview, backdrop selector, and "Publish" action.
4. **Blog Viewer (`/blog/[slug]`)**: Build the published view with the duotone backdrop, vibrant frame, readable story canvas, and the interactive multimedia band with slideshow.
