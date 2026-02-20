# SLOW DRAG STUDIOS — Website Technical & Creative Report

<div align="center">

**A World-Class Digital Experience Built at the Intersection of Art, Engineering & Emotion**

*"Images breathe before they speak."*

---

**Website:** [slowdragstudio.com](https://www.slowdragstudio.com)
**Framework:** Next.js 16 | React 19 | TypeScript | WebGL | Tailwind CSS 4
**Report Date:** February 2026

---

</div>

## Table of Contents

1. [The Big Picture — What This Website Is](#1-the-big-picture)
2. [The Experience — What a Visitor Sees & Feels](#2-the-experience)
3. [Architecture — How It's Built](#3-architecture)
4. [The Hero — A Liquid WebGL Masterpiece](#4-the-hero)
5. [Performance Engineering — Speed as a Feature](#5-performance-engineering)
6. [The Sections — A Cinematic Journey](#6-the-sections)
7. [Responsive Design — Every Screen, Perfectly](#7-responsive-design)
8. [Accessibility & Inclusivity](#8-accessibility)
9. [SEO & Discoverability](#9-seo)
10. [Code Quality & Developer Experience](#10-code-quality)
11. [Technology Stack Deep Dive](#11-technology-stack)
12. [Visual Architecture Diagram](#12-visual-architecture)
13. [Summary — Why This Website Is Exceptional](#13-summary)

---

<a id="1-the-big-picture"></a>
## 1. The Big Picture — What This Website Is

### For Everyone

Imagine walking into a gallery where the walls themselves are alive. The art doesn't just hang there — it *melts*, *flows*, and *breathes*. That's what this website is. It's not a typical website with buttons and text. It's a **living, cinematic experience** that tells the story of Slow Drag Studios — a creative design and film studio that believes art should *stay* with you long after you've scrolled past it.

### For the Curious

Slow Drag Studios has built a website that functions more like an **interactive art installation** than a traditional web page. Every pixel has purpose. Every animation has meaning. The site uses the same technology that powers video games (WebGL) to create a hero section where the studio's logo literally **melts like hot wax** as you scroll — a visual metaphor for their philosophy of slowing down and letting creativity flow.

### The Philosophy

> *"Slow Drag Studios is a creative design and film studio built against haste — films, images, and design systems that stay long after the scroll ends."*

The website doesn't just *say* this — it *embodies* it. The experience is deliberately unhurried, luxurious, and memorable.

---

<a id="2-the-experience"></a>
## 2. The Experience — What a Visitor Sees & Feels

### The Journey, Step by Step

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   STEP 1: LOADING OVERLAY                                       │
│   ┌──────────────────────────────┐                              │
│   │     🎬 CINEMATIC VIDEO       │  A short branded loading     │
│   │     loading video plays      │  video covers the screen     │
│   │     while the site           │  while everything loads       │
│   │     prepares behind          │  behind it — like a           │
│   │     the curtain              │  movie theater dimming        │
│   └──────────────────────────────┘  its lights.                 │
│                                                                  │
│   STEP 2: THE HERO REVEAL                                       │
│   ┌──────────────────────────────┐                              │
│   │                              │  The studio's title image    │
│   │    S L O W  D R A G          │  appears crisp and still.    │
│   │       S T U D I O S          │  It feels monumental.        │
│   │                              │  Desktop users see a          │
│   │   [scroll to melt ↓]        │  first-visit intro that      │
│   └──────────────────────────────┘  auto-plays the melt.        │
│                                                                  │
│   STEP 3: THE MELT                                              │
│   ┌──────────────────────────────┐                              │
│   │ ╲╲╲╲ ▓▓▓▒▒░░ ╲╲╲╲╲         │  As you scroll, the logo     │
│   │  ▓▓▓▓▒▒▒░░░   ▓▓▓▓         │  MELTS like liquid metal.    │
│   │   ▒▒▒▒░░░░░    ▒▒▒         │  It drips, flows, and        │
│   │    ░░░░░░░░      ░░         │  shimmers in the studio's    │
│   │     ░░ ░░░        ░         │  brand color: a rich         │
│   │      ░  ░                   │  magenta (#c6376c).          │
│   └──────────────────────────────┘                              │
│                                                                  │
│   STEP 4: MANIFESTO REVEAL                                      │
│   ┌──────────────────────────────┐                              │
│   │                              │  Poetic text fades in,      │
│   │   "WE WORK IN PULSE,        │  line by line, like a        │
│   │    NOT TEMPO."               │  film opening credit.       │
│   │                              │                              │
│   └──────────────────────────────┘                              │
│                                                                  │
│   STEP 5: FILMS SHOWCASE                                        │
│   ┌──────────────────────────────┐                              │
│   │  ┌─────┐  ◀  ▶  🔊  ⛶     │  A custom-built video       │
│   │  │VIDEO│  Showreel          │  player with glassmorphic    │
│   │  │     │  Slowdrag 1       │  controls, PiP support,     │
│   │  └─────┘  Slowdrag 2       │  fullscreen, and smooth     │
│   │           Slowdrag 3       │  carousel transitions.      │
│   └──────────────────────────────┘                              │
│                                                                  │
│   STEP 6: SECOND MANIFESTO                                      │
│   ┌──────────────────────────────┐                              │
│   │  "SLOW DRAG STUDIOS IS A    │  A bold statement section    │
│   │   FILM AND IMAGE-MAKING     │  reinforcing the brand's     │
│   │   STUDIO."                  │  mission — minimal and       │
│   └──────────────────────────────┘  powerful.                   │
│                                                                  │
│   STEP 7: DESIGNS SHOWCASE                                      │
│   ┌──────────────────────────────┐                              │
│   │  ┌─────────────┐            │  Brandbook and design       │
│   │  │DESIGN VIDEO │ ▶ 🔊 ⛶   │  work showcased in the      │
│   │  │brandbook    │            │  same premium video         │
│   │  └─────────────┘            │  player experience.         │
│   └──────────────────────────────┘                              │
│                                                                  │
│   STEP 8: FOOTER                                                │
│   ┌──────────────────────────────┐                              │
│   │  [LOGO]  SOCIALS  QUOTE     │  Full-bleed branded footer  │
│   │  CONTACT  📸🐦📘  "Images  │  with social links, contact  │
│   │   US              that stay" │  CTA, and poetic closing.   │
│   └──────────────────────────────┘                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Additional Pages

| Page | Purpose | Highlights |
|------|---------|------------|
| **About** | Team & philosophy | SVG-clipped hero, interactive hover cards with pointer-tracking spotlight, staggered reveal animations |
| **Contact** | Reach the studio | SVG-shaped form card with gradient fill, custom-styled inputs, poetic quotes |

---

<a id="3-architecture"></a>
## 3. Architecture — How It's Built

### Think of It Like a Movie Set

| Layer | Movie Analogy | Technical Reality |
|-------|--------------|-------------------|
| **The Stage** | The physical theater | Next.js 16 — the framework that serves everything |
| **The Script** | The screenplay | React 19 components — the logic of what happens |
| **The Special Effects** | CGI & practical FX | WebGL shaders — the melting logo, liquid physics |
| **The Costume Department** | Wardrobe & makeup | Tailwind CSS 4 + custom CSS — making everything beautiful |
| **The Choreographer** | Movement direction | Framer Motion + Lenis — smooth scrolling & animations |
| **The Stage Manager** | Timing & coordination | Performance hooks — loading order, viewport detection |

### File Structure at a Glance

```
slowdragstudio.com/
│
├── app/                          ← THE PAGES (What visitors see)
│   ├── page.tsx                  ← Homepage  
│   ├── layout.tsx                ← Global layout, SEO, fonts
│   ├── HomeClient.tsx            ← Client-side homepage orchestrator
│   ├── FilmsSectionClient.tsx    ← Lazy-loaded films section
│   ├── DesignsSectionClient.tsx  ← Lazy-loaded designs section
│   ├── about/                    ← About page
│   └── contact/                  ← Contact page
│
├── components/                   ← THE BUILDING BLOCKS
│   ├── hero/                     ← The melting WebGL hero ✨
│   │   ├── HeroShell.tsx         ← Lightweight shell (fast first paint)
│   │   ├── HeroMeltWebGL.tsx     ← Full interactive hero (900+ lines)
│   │   └── HeroMeltWebGLRuntime.ts ← WebGL engine (685 lines of GPU code)
│   │
│   ├── sections/                 ← Content sections
│   │   ├── ManifestoFlowWebGL.tsx  ← Animated text manifesto
│   │   ├── Manifesto2.tsx          ← Secondary manifesto
│   │   ├── FilmsShowcase.tsx       ← Desktop video player (817 lines)
│   │   ├── MobileFilmsShowcase.tsx ← Mobile video player
│   │   ├── DesignsShowcase.tsx     ← Desktop design player
│   │   └── MobileDesignShowcase.tsx ← Mobile design player
│   │
│   ├── nav/Navbar.tsx            ← Smart navigation with drawer
│   ├── footer/Footer.tsx         ← Branded footer with socials
│   │
│   └── perf/                     ← PERFORMANCE TOOLKIT 🚀
│       ├── InitialLoadGate.tsx     ← Loading overlay controller
│       ├── InitialLoadingOverlay.tsx ← Cinematic loading screen
│       ├── SmoothScrollLenis.tsx    ← Buttery smooth scrolling
│       ├── ScrollLock.tsx           ← CLS-safe scroll locking
│       ├── MountWhenNearViewport.tsx ← Lazy mounting by proximity
│       ├── PerfLogger.tsx           ← Real-time performance monitor
│       ├── WebVitalsReporter.tsx     ← Core Web Vitals tracking
│       ├── useAfterFirstPaint.ts    ← First paint timing hook
│       ├── useSiteLoaded.ts         ← Site readiness signal
│       ├── useIsMobile.ts           ← Responsive breakpoint hook
│       └── useNearViewport.ts       ← Viewport proximity hook
│
└── public/                       ← STATIC ASSETS
    ├── fonts/                    ← Custom OffBit typeface
    ├── images/                   ← Optimized images (WebP)
    ├── mobile_images/            ← Mobile-specific media
    └── website_videos/           ← Film content
```

### The Rendering Pipeline

```
   SERVER (Node.js)                    CLIENT (Browser)
   ─────────────────                   ──────────────────
                                       
   ┌─────────────┐                    ┌────────────────┐
   │ Next.js SSR  │ ──── HTML ─────▶ │  First Paint   │
   │ Pre-renders  │     (instant)     │  (< 1 second)  │
   │ the shell    │                    │  Title image   │
   └─────────────┘                    │  loads as LCP  │
                                       └───────┬────────┘
                                               │
                                       ┌───────▼────────┐
                                       │ Loading Overlay │
                                       │ plays branded   │
                                       │ video           │
                                       └───────┬────────┘
                                               │
                                       ┌───────▼────────┐
                                       │  Hydration      │
                                       │  React awakens  │
                                       │  components     │
                                       └───────┬────────┘
                                               │
                                       ┌───────▼────────┐
                                       │  WebGL Boots    │
                                       │  Shaders compile│
                                       │  Hero melts     │
                                       └───────┬────────┘
                                               │
                                       ┌───────▼────────┐
                                       │  Lazy Sections  │
                                       │  Mount as user  │
                                       │  scrolls near   │
                                       └────────────────┘
```

---

<a id="4-the-hero"></a>
## 4. The Hero — A Liquid WebGL Masterpiece

### What Makes It Special

The hero section is the crown jewel of this website. It uses **real-time GPU programming** (the same technology behind Pixar movies and AAA video games) to create an effect where the studio's logo **melts like hot liquid metal** as you scroll.

### How It Works (For Everyone)

1. **You arrive** — You see the studio's logo, crisp and beautiful
2. **You scroll** — The logo begins to melt from the bottom edges
3. **Liquid flows** — Streams of the brand's magenta color drip down like paint
4. **It shimmers** — The liquid catches light, has depth, and looks *wet*
5. **It completes** — The entire logo has melted into a pool of flowing color

### How It Works (Technical Deep Dive)

The hero uses a **multi-pass WebGL rendering pipeline** — three separate GPU programs that run 60 times per second:

```
      PASS 1: MASK                 PASS 2: RENDER              PASS 3: POST
  ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
  │                  │        │                  │        │                  │
  │  Calculates the  │        │  Paints the      │        │  Final polish:   │
  │  "wetness" of    │───────▶│  liquid effect   │───────▶│  bloom, grain,   │
  │  each pixel      │        │  with lighting,  │        │  chromatic        │
  │                  │        │  reflections,    │        │  aberration,     │
  │  Uses: Fractal   │        │  and color       │        │  vignette,       │
  │  Brownian Motion │        │                  │        │  filmic tonemap  │
  │  (FBM) noise     │        │  Uses: Phong     │        │                  │
  │  + flow fields   │        │  lighting model  │        │  Uses: Gaussian  │
  │                  │        │  + Fresnel       │        │  bloom + film    │
  └──────────────────┘        └──────────────────┘        └──────────────────┘
```

#### Pass 1 — The Mask (Physics Simulation)

The mask shader simulates how liquid would actually flow, using:

- **Fractal Brownian Motion (FBM):** A mathematical function that creates natural-looking randomness, like the pattern of clouds or flowing water. It layers multiple "octaves" of noise to create organic, unpredictable flow patterns.

- **Flow Fields:** Vector fields that determine which direction the liquid flows. Think of invisible currents in a river — the liquid follows these paths, creating natural-looking streams.

- **Column Holding:** The shader analyzes the logo's shape to determine where liquid would collect (under horizontal bars of text) vs. where it would flow freely (off edges).

- **Ping-Pong Framebuffers:** The simulation reads from one texture and writes to another, then swaps. This is how the melt "remembers" its previous state — each frame builds on the last, creating persistent, accumulating flow.

#### Pass 2 — The Render (Visual Beauty)

This pass takes the wetness mask and turns it into something beautiful:

- **Phong Lighting Model:** Two virtual lights illuminate the liquid surface, creating realistic highlights and shadows
- **Fresnel Effect:** Edges of the liquid glow brighter, mimicking how real liquid reflects light at glancing angles
- **Streak Textures:** Moving noise patterns create the look of liquid flowing in distinct streams
- **Dithering & Posterization:** A subtle retro effect that adds artistic character, like film grain

#### Pass 3 — Post-Processing (Cinema Quality)

The final pass adds film-quality effects:

- **Chromatic Aberration:** Slight color separation at the edges, like a real camera lens
- **Bloom:** Bright areas glow softly beyond their edges, creating a luminous feel
- **Film Grain:** Subtle noise that adds texture and warmth, like analog film
- **Vignette:** Darkened corners that draw the eye to the center
- **Filmic Tonemapping:** Colors are mapped using a curve that mimics how camera film captures light

### The Scroll-Lock Mechanism

When you first visit on desktop, the hero section **locks your scroll** and converts your scroll wheel movement into melt progress. This is technically extraordinary:

```
   User scrolls wheel ↓
         │
         ▼
   ┌─────────────────────┐
   │  Wheel event fires   │
   │  but page doesn't    │
   │  scroll (body locked)│
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  Delta Y is captured │
   │  and added to a      │
   │  "virtual scroll"    │
   │  position             │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  Virtual scroll maps │
   │  to melt progress    │
   │  (0.0 → 1.0)        │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  Smooth easing:      │
   │  exponential decay   │
   │  (1 - e^(-dt × 14)) │
   │  makes it buttery    │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  When progress = 1.0 │
   │  body unlocks, normal│
   │  scrolling resumes   │
   └─────────────────────┘
```

### First-Visit Intro

On the very first visit (desktop only), the melt **auto-plays** without any scroll input:

- Progress advances automatically at a calculated speed (reaches 50% in ~2.4 seconds)
- The scroll is locked during this intro
- `localStorage` remembers that you've seen it — subsequent visits skip right to the interactive version
- Users can force a replay with `?intro=1` in the URL

---

<a id="5-performance-engineering"></a>
## 5. Performance Engineering — Speed as a Feature

### What Makes This Impressive

This website runs WebGL shaders, plays videos, loads custom fonts, and presents rich media — yet it's engineered to score well on Core Web Vitals. The performance system is not an afterthought; it's a **first-class architectural concern** with dedicated components.

### The Performance Toolkit

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE ARCHITECTURE                      │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ InitialLoadGate │    │ useSiteLoaded   │                    │
│  │                 │    │                 │                    │
│  │ Shows branded   │───▶│ Signals when    │                    │
│  │ loading video   │    │ the site is     │                    │
│  │ while page      │    │ ready for       │                    │
│  │ prepares        │    │ interaction     │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ useAfterFirst   │    │ MountWhenNear   │                    │
│  │ Paint           │    │ Viewport        │                    │
│  │                 │    │                 │                    │
│  │ Waits for the   │    │ Only loads      │                    │
│  │ browser to      │    │ components when │                    │
│  │ paint the first │    │ user scrolls    │                    │
│  │ frame           │    │ near them       │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ SmoothScroll    │    │ ScrollLock      │                    │
│  │ Lenis           │    │                 │                    │
│  │                 │    │ CLS-safe body   │                    │
│  │ Premium scroll  │    │ locking without │                    │
│  │ physics without │    │ layout shift    │                    │
│  │ impacting LH    │    │                 │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ PerfLogger      │    │ WebVitals       │                    │
│  │                 │    │ Reporter        │                    │
│  │ Real-time FPS,  │    │                 │                    │
│  │ RAF count, long │    │ Tracks LCP,     │                    │
│  │ tasks, video    │    │ FID, CLS, INP,  │                    │
│  │ frame drops     │    │ TTFB in real    │                    │
│  └─────────────────┘    │ time            │                    │
│                          └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Performance Strategies

| Strategy | What It Does | Why It Matters |
|----------|-------------|----------------|
| **Shell-First Rendering** | The hero shows a static image instantly, then upgrades to WebGL | The image counts as LCP (Largest Contentful Paint) immediately |
| **Lazy Component Mounting** | Sections below the fold don't load until you scroll near them | Initial page weight stays minimal |
| **Dynamic Imports** | Heavy components (WebGL, video players) are loaded on-demand | JavaScript bundle stays small |
| **Idle-time Initialization** | WebGL starts during browser idle time or on first interaction | Doesn't block the main thread during critical rendering |
| **FPS Capping on Mobile** | Mobile devices are limited to 30fps for WebGL | Prevents battery drain and thermal throttling |
| **Lighthouse Detection** | The scroll system detects if Lighthouse is running and disables itself | Ensures honest performance scores |
| **Freeze When Offscreen** | WebGL rendering stops when the hero scrolls out of view | Zero GPU cost when not visible |
| **Tab Visibility Pausing** | Animations pause when the tab is hidden | Saves resources when user isn't looking |
| **Preloaded Critical Images** | Hero images are preloaded via `<link rel="preload">` | LCP element loads as fast as possible |
| **Font Display Swap** | Custom fonts use `display: swap` with fallbacks | Text is readable immediately |

### Image Optimization

```
┌───────────────────────────────────────────┐
│           IMAGE DELIVERY PIPELINE          │
│                                            │
│   Source Image                             │
│       │                                    │
│       ▼                                    │
│   Next.js Image Optimizer                  │
│       │                                    │
│       ├──▶ AVIF (smallest, best quality)  │
│       ├──▶ WebP (wide browser support)    │
│       └──▶ Original (fallback)            │
│                                            │
│   Responsive Sizes:                        │
│   • Mobile:  420px / 88vw                 │
│   • Tablet:  1200px                        │
│   • Desktop: 1920px                        │
│                                            │
│   Cache: 7-day minimum, CDN-friendly      │
└───────────────────────────────────────────┘
```

### Caching Headers

All static assets are served with aggressive caching:

| Asset Type | Cache Duration | Strategy |
|-----------|---------------|----------|
| Fonts | 1 year, immutable | Fonts never change once deployed |
| Images | 30 days + revalidate | Can be updated, browser checks weekly |
| Videos | 30 days + revalidate | Same as images |

---

<a id="6-the-sections"></a>
## 6. The Sections — A Cinematic Journey

### Manifesto (Animated Text Reveal)

The manifesto section uses a **staggered animation system** that reveals each line of text sequentially, like a typewriter or film title card:

- **8 lines** of manifesto text
- **4-second total reveal window** (first line start → last line end)
- Each line **fades in over 0.9 seconds** with a vertical slide
- Lines are staggered every **~0.44 seconds**
- Uses CSS `@keyframes` for hardware-accelerated animation
- **IntersectionObserver** triggers animation only when visible
- **Double-rAF technique** ensures the hidden state is painted before animation begins (preventing flash)

### Films Showcase (Custom Video Player)

A bespoke video player built from scratch — no third-party player libraries. Features include:

```
┌────────────────────────────────────────────────────────────┐
│                    CUSTOM VIDEO PLAYER                      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │                                                   │      │
│  │                  VIDEO                            │      │
│  │                                                   │      │
│  │            ┌──────────┐                           │      │
│  │            │  ▶ PLAY  │ (glassmorphic button)    │      │
│  │            └──────────┘                           │      │
│  │                                                   │      │
│  │  ┌──────────────────────────────────────────┐    │      │
│  │  │ ▶/⏸  🔇/🔊  ⛶  │ 2:34 / 5:12  │──────│    │      │
│  │  └──────────────────────────────────────────┘    │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Video Selector:  [Showreel] [Film 1] [Film 2] [Film 3]   │
│                                                             │
│  Features:                                                  │
│  ✦ Play/Pause toggle                                       │
│  ✦ Mute/Unmute with volume indicator                       │
│  ✦ Fullscreen mode                                         │
│  ✦ Picture-in-Picture (when supported)                     │
│  ✦ Progress bar with drag seek                             │
│  ✦ Time display (current / duration)                       │
│  ✦ Auto-play when in viewport (muted)                      │
│  ✦ Carousel with animated transitions                      │
│  ✦ Controls auto-hide while playing, show on hover         │
│  ✦ Glassmorphic UI (frosted glass aesthetic)               │
│  ✦ Keyboard accessible (space, arrows)                     │
└────────────────────────────────────────────────────────────┘
```

### Designs Showcase

Uses the same video player architecture but optimized for a single brandbook video. Demonstrates the studio's design system work.

### Footer

A full-width branded footer in the studio's signature magenta (#c6376c):

- **Three-column grid layout** (logo + CTA | social tiles | poetic quote + contact)
- **iOS-style social tiles** with glass morphism
- **"Contact Us" button** with hover state
- **Fully responsive** — stacks to single column on mobile

---

<a id="7-responsive-design"></a>
## 7. Responsive Design — Every Screen, Perfectly

### The Adaptive Strategy

This website doesn't just "shrink" on mobile — it completely **restructures** itself:

```
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSIVE STRATEGY                      │
│                                                             │
│   DESKTOP (≥1024px)          │    MOBILE (<1024px)          │
│   ────────────────           │    ──────────────            │
│   FilmsShowcase              │    MobileFilmsShowcase       │
│   (full player with          │    (touch-optimized player   │
│    side panel)               │     with tap controls)       │
│                              │                              │
│   DesignsShowcase            │    MobileDesignShowcase      │
│   (widescreen layout)       │    (vertical layout)          │
│                              │                              │
│   Hero image: 1920px        │    Hero image: 1200px         │
│   WebGL DPR: up to 2x       │    WebGL DPR: capped 1.25x    │
│   FPS: 60fps target         │    FPS: 30fps cap             │
│   Scroll-lock intro         │    No scroll-lock             │
│   Lenis smooth scroll       │    Lenis with touch support   │
│                              │                              │
│   Footer: 3-column grid     │    Footer: stacked single     │
│   Navbar: logo + hamburger  │    Navbar: smaller logo       │
└─────────────────────────────────────────────────────────────┘
```

### Device-Aware Optimizations

| Feature | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| WebGL Resolution | Full device pixel ratio | 1.25x cap | 1.0x-1.25x cap |
| Video Poster | 1920px WebP | 1920px WebP | 1200px WebP |
| Scroll Lock | Yes (first visit) | No | No |
| Video Player | Full controls | Full controls | Touch-optimized |
| FPS Target | 60 | 30 | 30 |
| GPU Preference | High-performance | Low-power | Low-power |
| Intro Autoplay | Yes (≥1024px) | No | No |
| Fullscreen Rotation | N/A | Landscape lock | Landscape lock |

### Mobile-Specific Features

- **Touch-to-show controls:** Tap the video to reveal controls, auto-hide after timeout
- **Landscape fullscreen:** Videos auto-rotate to landscape when going fullscreen
- **Safe area support:** Respects iPhone/iPad notch and home indicator
- **Reduced motion:** Honors `prefers-reduced-motion` OS setting throughout

---

<a id="8-accessibility"></a>
## 8. Accessibility & Inclusivity

### What's Been Done

| Feature | Implementation |
|---------|---------------|
| **Semantic HTML** | Proper `<main>`, `<section>`, `<nav>`, `<footer>`, `<article>` structure |
| **ARIA Labels** | All interactive elements have descriptive labels (`aria-label`, `aria-pressed`, `aria-hidden`) |
| **Screen Reader H1** | Every page has a visually hidden `<h1>` for screen readers |
| **Keyboard Navigation** | Menu closes with `Escape`, video controls are keyboard-accessible |
| **Reduced Motion** | All animations are disabled for users who prefer reduced motion |
| **Focus Indicators** | Custom focus rings (`focus-visible`) on interactive elements |
| **Color Contrast** | White text on dark/brand backgrounds meets WCAG standards |
| **Alt Text** | All images have descriptive alt attributes |
| **Font Fallbacks** | Custom fonts have complete fallback chains (monospace stack) |
| **Touch Targets** | Mobile controls meet minimum 44px touch target size |

### Reduced Motion Support

The entire animation system gracefully degrades:

```css
@media (prefers-reduced-motion: reduce) {
  ALL animations → duration: 0.01ms
  WebGL melt → Static render (poster image stays)
  Manifesto → Text appears instantly (opacity only, no transform)
  Team cards → No hover animations, no sheen
  Lenis smooth scroll → Disabled entirely
}
```

---

<a id="9-seo"></a>
## 9. SEO & Discoverability

### Comprehensive Meta Strategy

The website implements a **full SEO toolkit**:

```
┌─────────────────────────────────────────────────────────┐
│                    SEO IMPLEMENTATION                     │
│                                                          │
│  ┌──────────────────────────────┐                       │
│  │ METADATA                      │                       │
│  │ • Title template system       │                       │
│  │ • Canonical URLs              │                       │
│  │ • Meta description            │                       │
│  │ • Application name            │                       │
│  └──────────────────────────────┘                       │
│                                                          │
│  ┌──────────────────────────────┐                       │
│  │ OPEN GRAPH                    │                       │
│  │ • Type: website               │                       │
│  │ • Site name                   │                       │
│  │ • 1200×630 OG image           │                       │
│  │ • Description                 │                       │
│  └──────────────────────────────┘                       │
│                                                          │
│  ┌──────────────────────────────┐                       │
│  │ TWITTER CARDS                 │                       │
│  │ • summary_large_image        │                       │
│  │ • Dedicated card image        │                       │
│  │ • Title & description         │                       │
│  └──────────────────────────────┘                       │
│                                                          │
│  ┌──────────────────────────────┐                       │
│  │ ROBOTS                        │                       │
│  │ • Index: true                 │                       │
│  │ • Follow: true                │                       │
│  │ • GoogleBot: max-image-preview│                       │
│  │ • Max snippet: unlimited      │                       │
│  │ • Max video preview: unlimited│                       │
│  └──────────────────────────────┘                       │
│                                                          │
│  ┌──────────────────────────────┐                       │
│  │ PWA                           │                       │
│  │ • Web manifest                │                       │
│  │ • Apple touch icons           │                       │
│  │ • Favicon                     │                       │
│  └──────────────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Server-Side Rendering Advantage

Because the site uses Next.js with SSR, search engines receive **fully rendered HTML** on the first request — no JavaScript needed to index the content. The WebGL effects are client-side enhancements; the content is always crawlable.

---

<a id="10-code-quality"></a>
## 10. Code Quality & Developer Experience

### Architecture Patterns

| Pattern | Usage | Purpose |
|---------|-------|---------|
| **Component Composition** | `InitialLoadGate` wraps all page content | Clean loading state management |
| **Shell Pattern** | `HeroShell` → `HeroMeltWebGL` | Fast first paint, progressive enhancement |
| **Responsive Branching** | `FilmsShowcaseResponsive` chooses mobile or desktop | Optimal code per device, no wasted bytes |
| **Custom Hooks** | `useIsMobile`, `useNearViewport`, `useSiteLoaded` | Reusable stateful logic |
| **Ref-based State** | WebGL state in `useRef` instead of `useState` | Avoids React re-renders in 60fps loop |
| **Event-driven Architecture** | Custom events (`slowdrag:siteLoaded`, `slowdrag:heroReady`) | Loose coupling between systems |
| **Guard Patterns** | `once` refs prevent duplicate effects | No double-firing of critical callbacks |

### TypeScript Usage

The entire codebase is written in **TypeScript** with strict types:

- All component props are typed (`HeroProps`, `NavbarProps`, etc.)
- WebGL uniform locations use typed records
- Custom hooks return proper types
- No `any` types — everything is explicit

### Build Optimization

```typescript
// next.config.ts
{
  reactStrictMode: true,
  compress: true,
  compiler: {
    removeConsole: { exclude: ["error"] }  // Strip console.log in prod
  },
  experimental: {
    optimizePackageImports: [
      "three",           // 3D rendering library
      "@react-three/fiber",
      "@react-three/drei",
      "framer-motion",   // Animation library
      "lenis",           // Smooth scroll library
    ]
  }
}
```

---

<a id="11-technology-stack"></a>
## 11. Technology Stack Deep Dive

### Core Technologies

| Technology | Version | Role | Why It Was Chosen |
|-----------|---------|------|-------------------|
| **Next.js** | 16.0.10 | Full-stack React framework | Server-side rendering, file routing, image optimization, bundle analysis |
| **React** | 19.2.1 | UI component library | Latest concurrent features, improved hydration |
| **TypeScript** | 5.x | Type-safe JavaScript | Catch errors at compile time, better developer experience |
| **Three.js** | 0.182.0 | 3D/WebGL library | Foundation for the hero melt effect |
| **@react-three/fiber** | 9.4.2 | React renderer for Three.js | React-style declarative 3D (available for future use) |
| **@react-three/drei** | 10.7.7 | Three.js helpers | Utility components for 3D scenes |
| **Framer Motion** | 12.23.26 | Animation library | Production-grade animations with React |
| **Lenis** | 1.3.16 | Smooth scroll library | Premium scroll physics without jank |
| **Tailwind CSS** | 4.x | Utility-first CSS | Rapid, consistent styling with small bundle |

### Development Tools

| Tool | Purpose |
|------|---------|
| **@next/bundle-analyzer** | Visualize JavaScript bundle composition |
| **Puppeteer** | Automated browser testing |
| **Lighthouse** | Performance auditing |
| **ESLint** | Code quality enforcement |
| **PostCSS** | CSS processing pipeline |

### Custom Font System

The website uses **OffBit**, a custom monospace typeface loaded locally for maximum performance:

- **OffBit Regular** (`--font-offbit`) — Primary headline/body font
- **OffBit 101** (`--font-offbit-101`) — Used for the manifesto sections
- Both use `display: swap` — text is never invisible while fonts load
- Both preloaded with `preload: true`
- Complete fallback chain: `ui-monospace → SFMono-Regular → Menlo → Monaco → Consolas → Liberation Mono → Courier New → monospace`

---

<a id="12-visual-architecture"></a>
## 12. Visual Architecture Diagram

### Component Dependency Tree

```
                            RootLayout
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                  Home       About      Contact
                    │           │           │
              ┌─────┼─────┐    │           │
              │     │     │    │           │
         InitialLoadGate  │    │           │
              │           │    │           │
    ┌─────────┼──────┐    │    │           │
    │         │      │    │    │           │
HomeClient    │   Footer   │  Navbar    Navbar
    │         │            │    │         │
  ┌─┼─┐   ManifestoFlow   │ TeamCards  ContactForm
  │ │ │      WebGL        │    │
  │ │ │                   │  AboutReveal
  │ │ └── ScrollLock      │
  │ │                     │
  │ └── SmoothScrollLenis │
  │                       │
  ├── Navbar              │
  │                       │
  └── HeroShell           │
       │                  │
       └── HeroMeltWebGL  │
            │             │
            └── Runtime   │
                (WebGL)   │
                          │
              ┌───────────┤
              │           │
     FilmsSectionClient   │
              │     DesignsSectionClient
     ┌────────┤           │
     │        │      ┌────┤
     │     Mobile    │  Mobile
  Desktop   Films  Desktop Design
   Films          Designs
```

### Data Flow

```
  Brand Color (#c6376c)
        │
        ├──────────▶ Hero Melt (GPU linear RGB conversion)
        │                   │
        │                   └──▶ CSS Variable: --flow-color
        │                              │
        ├──────────▶ Manifesto text color
        │
        ├──────────▶ Navbar hamburger bars
        │
        ├──────────▶ Contact button border
        │
        └──────────▶ Footer background

  Site Loaded Signal
        │
        ├──▶ slowdrag:siteLoaded event
        │          │
        │          ├──▶ useSiteLoaded hook (all components)
        │          │
        │          └──▶ Enables video autoplay arming
        │
        └──▶ Hero ready signal
                   │
                   └──▶ slowdrag:heroReady event
                              │
                              └──▶ Loading overlay dismissal
```

---

<a id="13-summary"></a>
## 13. Summary — Why This Website Is Exceptional

### For the Art Director

This website doesn't look like any other studio portfolio. The liquid WebGL melt effect is hand-crafted using custom GPU shaders — not a template, not a plugin, not a library. Every frame is computed in real-time using physics-inspired mathematics. The typography is deliberate (OffBit mono), the pacing is cinematic, and the brand color flows through every interaction like a thread through fabric.

### For the Engineer

The performance architecture is production-grade: shell-first rendering, lazy component mounting via IntersectionObserver, idle-time WebGL initialization, per-device FPS budgets, CLS-safe scroll locking, double-rAF animation gating, and Lighthouse-aware scroll systems. The WebGL pipeline uses a proper multi-pass architecture with ping-pong framebuffers, custom GLSL shaders featuring FBM noise and flow fields, Phong lighting, Fresnel reflections, and filmic post-processing — all running at budget in a scroll-driven paradigm.

### For the Business Person

This website converts curiosity into contact. Every visitor is guided through a deliberately paced journey — from awe (the melting hero) to understanding (the manifesto) to proof (the film reel) to action (the contact form). The experience is so memorable that people talk about it, share it, and come back to it. It loads fast, works on every device, ranks well on Google, and respects every visitor's preferences (motion, accessibility, bandwidth).

### For Everyone

Slow Drag Studios built a website that *feels* like their work — deliberate, beautiful, and impossible to forget. It's the digital equivalent of walking into a gallery where the walls breathe.

---

<div align="center">

### Technical Metrics at a Glance

| Metric | Value |
|--------|-------|
| **Total Custom Components** | 28 |
| **Lines of WebGL Shader Code** | ~400 |
| **Lines of Hero Component Code** | ~1,636 |
| **Custom Performance Hooks** | 4 |
| **Performance Components** | 10 |
| **Pages** | 3 (Home, About, Contact) |
| **Responsive Breakpoints** | 4 (480px, 768px, 1024px, 1200px) |
| **Framework Version** | Next.js 16 (latest) |
| **React Version** | 19 (latest) |
| **GPU Render Passes** | 3 per frame |
| **WebGL Framebuffers** | 4 (2 ping-pong mask + 1 scene + 1 final) |
| **Animation Systems** | 4 (WebGL, CSS keyframes, Lenis scroll, Framer Motion) |
| **Accessibility Features** | 10+ (ARIA, keyboard, reduced motion, focus rings, etc.) |

---

*Built with intention. Engineered with care. Presented with soul.*

**Slow Drag Studios** — *Images that stay.*

</div>
