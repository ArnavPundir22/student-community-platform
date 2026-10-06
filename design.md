# 🚀 D-Coders Squad Design System (`design.md`)

> **Comprehensive Design Theme & UI Specification Guide for Teammates**  
> *Reference implementation from `D-Coders-Static` — Official Web Platform of D-Coders Squad.*

---

## 📑 Table of Contents
1. [Design Philosophy & Aesthetic Direction](#1-design-philosophy--aesthetic-direction)
2. [Global CSS Variables & Tokens (`:root`)](#2-global-css-variables--tokens-root)
3. [Tailwind CSS Configuration (`tailwind.config.js`)](#3-tailwind-css-configuration-tailwindconfigjs)
4. [Color System & Semantic Palette](#4-color-system--semantic-palette)
5. [Typography Hierarchy & Font System](#5-typography-hierarchy--font-system)
6. [Borders, Radii, Shadows & Elevation](#6-borders-radii-shadows--elevation)
7. [Signature Components & UI Code Snippets](#7-signature-components--ui-code-snippets)
   - [Crime Scene / Caution Tape Ribbon](#-component-1-crime-scene--caution-tape-ribbon)
   - [Floating Glass Pill Navbar](#-component-2-floating-glass-pill-navbar)
   - [Cosmic Hero Header with Glowing Orbs](#-component-3-cosmic-hero-header-with-glowing-orbs)
   - [Buttons & Interactive CTAs](#-component-4-buttons--interactive-ctas)
   - [Card Systems (Editorial, Glass & Perforated Ticket)](#-component-5-card-systems)
   - [Pills, Badges & Status Indicators](#-component-6-pills-badges--status-indicators)
   - [Input Fields & Newsletter Bar](#-component-7-input-fields--newsletter-bar)
   - [Expanding Back-to-Top Floating Pill](#-component-8-expanding-back-to-top-floating-pill)
   - [Premium Midnight Footer](#-component-9-premium-midnight-footer)
   - [Skeleton Loader & Image Transitions](#-component-10-skeleton-loader--image-transitions)
8. [Motion, Micro-Interactions & Audio Feedback](#8-motion-micro-interactions--audio-feedback)
9. [Iconography & Media Standards](#9-iconography--media-standards)
10. [Teammate Implementation Checklist](#10-teammate-implementation-checklist)

---

## 1. Design Philosophy & Aesthetic Direction

The **D-Coders Squad** web experience balances high-tech developer futurism with crisp, editorial elegance.

### 🌌 The Dual-Atmosphere Model
1. **Cosmic Midnight Tech Zones** (Heroes, Navbars, Banners, Footers, Certificates):
   - Rich deep-space hues (`#0f0a1e`, `#1e1b4b`, `#0d0c18`, `#0f172a`).
   - Radial ambient lighting gradients in violet, indigo, and soft coral.
   - Subtle geometric wireframe grid backgrounds.
   - Ultra-premium glassmorphism (`backdrop-filter: blur(24px - 32px)`).
2. **Crisp Light Editorial Zones** (Content feeds, Blog posts, Member lists, Admin panels):
   - Clean, bright surfaces (`#ffffff`, `#f8fafc`, `#fafafa`).
   - Dark slate typography (`#1e293b`, `#0f172a`) for maximum readability and zero eye fatigue.
   - High-contrast card borders (`#e2e8f0`) with subtle lift on hover.

### ⚡ Visual Signatures
- **Investigation / Crime Scene Caution Tape**: High-voltage yellow diagonal marquee ribbon looping continuously across the screen.
- **Floating Pill Navbar**: Centered, rounded capsule navigation with frosted dark glass.
- **Custom Portugal Orange Selection**: Custom highlight color (`#FF7F62`) for text and custom scrollbar thumb.
- **Perforated Ticket UI**: Event tickets designed with authentic cutouts, barcode notches, and floating drop shadows.
- **Audio Micro-Interactions**: Tactile sound effects on clicks, modal reveals, and success notifications.

---

## 2. Global CSS Variables & Tokens (`:root`)

Drop this into your global stylesheet (e.g., `globals.css` or `shared.css`):

```css
:root {
  /* =========================================
     PRIMARY PALETTE (Soft Indigo)
     ========================================= */
  --primary: #6366f1;          /* Core Indigo - Main buttons, active links, accents */
  --primary-light: #818cf8;    /* Soft Indigo - Hover accents, glows */
  --primary-dark: #4f46e5;     /* Deep Indigo - Pressed states, solid borders */

  /* =========================================
     SECONDARY & ACCENTS
     ========================================= */
  --secondary: #f43f5e;        /* Soft Coral / Rose - Alerts, underlines, live badges */
  --accent-orange: #FF7F62;    /* Portugal Orange - Selection highlight & scrollbars */
  --hazard-yellow: #FFD600;    /* Caution Marquee - Hazard stripes & crime tape */
  --hazard-yellow-light: #ffdc2b;

  /* =========================================
     LIGHT EDITORIAL BACKGROUNDS & SURFACES
     ========================================= */
  --bg-body: #ffffff;
  --bg-surface: #ffffff;
  --bg-alt: #f8fafc;           /* Slate 50 - Subtle section separation */
  --bg-alt-warm: #fafafa;      /* Warm editorial gray for cards */
  --white: #ffffff;

  /* =========================================
     MIDNIGHT & CYBER DARK BACKGROUNDS
     ========================================= */
  --dark-hero-start: #1e1b4b;  /* Deep Indigo-950 */
  --dark-hero-mid: #312e81;    /* Indigo-900 */
  --dark-hero-end: #4338ca;    /* Indigo-700 */
  --dark-deep-space: #0f0a1e;  /* Midnight Black/Purple */
  --dark-footer: #0d0c18;      /* Obsidian Black */
  --dark-surface: #0f172a;     /* Slate 900 */

  /* =========================================
     TEXT COLORS
     ========================================= */
  --text-main: #1e293b;        /* Slate 800 - High-contrast readable body text */
  --text-heading: #0f172a;     /* Slate 900 - Dark title text */
  --text-light: #64748b;       /* Slate 500 - Secondary descriptions, dates, meta */
  --text-lighter: #94a3b8;     /* Slate 400 - Placeholders, disabled text */
  --text-on-dark: #ffffff;
  --text-on-dark-muted: rgba(255, 255, 255, 0.7);
  --text-on-dark-dim: rgba(255, 255, 255, 0.55);

  /* =========================================
     SEMANTIC FEEDBACK
     ========================================= */
  --success: #059669;          /* Emerald 600 */
  --success-light: #10b981;    /* Emerald 500 */
  --warning: #d97706;          /* Amber 600 */
  --warning-light: #f59e0b;    /* Amber 500 */
  --danger: #dc2626;           /* Red 600 */
  --danger-light: #ef4444;     /* Red 500 */
  --info: #0284c7;             /* Sky 600 */

  /* =========================================
     BORDERS & RADIUS
     ========================================= */
  --border-color: #e2e8f0;     /* Slate 200 - Standard light card & input borders */
  --border-dark-glass: rgba(255, 255, 255, 0.1);
  --border-radius-sm: 8px;     /* Small tags, inputs */
  --border-radius: 12px;       /* Cards, modals, buttons */
  --border-radius-lg: 24px;    /* Feature sections, large modules */
  --border-radius-pill: 9999px;/* Pill buttons, search bars, navcapsule */
  --logo-radius: 12px;         /* Uniform club logo curvature */

  /* =========================================
     SHADOWS & ELEVATION
     ========================================= */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  --shadow-soft: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01);
  --shadow-glow: 0 8px 25px rgba(99, 102, 241, 0.25);
  --shadow-glow-lg: 0 15px 40px rgba(99, 102, 241, 0.35);

  /* =========================================
     SIGNATURE GRADIENTS
     ========================================= */
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --gradient-soft: linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%);
  --gradient-hero: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
  --gradient-page-hero: linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #4c1d95 70%, #5b21b6 100%);
  --gradient-glow: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%);

  /* =========================================
     TRANSITIONS & TIMING
     ========================================= */
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.15s ease-out;

  /* =========================================
     LAYOUT OFFSETS
     ========================================= */
  --announcement-height: 75px; /* Height of the caution tape marquee */
}

/* =========================================
   GLOBAL SELECTION & SCROLLBAR
   ========================================= */
::selection {
  background: #FF7F62; /* Portugal Orange */
  color: #ffffff;
}

::-moz-selection {
  background: #FF7F62;
  color: #ffffff;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #FF7F62;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #e0684c;
}
```

---

## 3. Tailwind CSS Configuration (`tailwind.config.js`)

If you are using Tailwind CSS, paste this into your `tailwind.config.js` to ensure 100% theme parity:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1', // Soft Indigo
          light: '#818cf8',
          dark: '#4f46e5',
        },
        secondary: {
          DEFAULT: '#f43f5e', // Coral / Rose
        },
        accent: {
          orange: '#FF7F62',  // Portugal Orange
          yellow: '#FFD600',  // Hazard Yellow
        },
        surface: {
          body: '#ffffff',
          alt: '#f8fafc',
          editorial: '#fafafa',
          dark: '#0f172a',
          space: '#0f0a1e',
          footer: '#0d0c18',
        },
        slateText: {
          main: '#1e293b',
          light: '#64748b',
          lighter: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'Impact', 'Arial Black', 'sans-serif'],
      },
      borderRadius: {
        'logo': '12px',
        'card': '12px',
        'panel': '20px',
        'container': '24px',
      },
      boxShadow: {
        'glow-primary': '0 8px 25px rgba(99, 102, 241, 0.25)',
        'glow-lg': '0 15px 40px rgba(99, 102, 241, 0.35)',
        'soft-lift': '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
        'gradient-page': 'linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #4c1d95 70%, #5b21b6 100%)',
      }
    },
  },
  plugins: [],
};
```

---

## 4. Color System & Semantic Palette

| Token / Color Role | Hex Code | RGB | Visual Role / Intended Usage |
| :--- | :--- | :--- | :--- |
| **Primary Indigo** | `#6366f1` | `rgb(99, 102, 241)` | Main CTA buttons, active links, primary border glows, brand highlights |
| **Primary Light** | `#818cf8` | `rgb(129, 140, 248)` | Button hover states, glowing orb highlights, soft badges |
| **Primary Dark** | `#4f46e5` | `rgb(79, 70, 229)` | Active / pressed states, deep contrast accents |
| **Secondary Coral** | `#f43f5e` | `rgb(244, 63, 94)` | Live indicators, accent underscores, highlight badges, notification pings |
| **Portugal Orange** | `#FF7F62` | `rgb(255, 127, 98)` | Global text selection background (`::selection`), custom scrollbar thumb |
| **Hazard Yellow** | `#FFD600` | `rgb(255, 214, 0)` | Crime scene marquee ribbons, emergency announcement tapes |
| **Purple Accent** | `#8b5cf6` | `rgb(139, 92, 246)` | Gradient transitions, domain badges, card ambient reflections |
| **Background Body** | `#ffffff` | `rgb(255, 255, 255)` | Pure white default page canvas, standard card backgrounds |
| **Background Alt** | `#f8fafc` | `rgb(248, 250, 252)` | Alternating section backgrounds, table headers, skeleton fills |
| **Editorial Gray** | `#fafafa` | `rgb(250, 250, 250)` | Soft about/profile page background, warm card tiles |
| **Midnight Hero 1** | `#1e1b4b` | `rgb(30, 27, 75)` | Dark hero gradient start (deepest indigo) |
| **Midnight Hero 2** | `#312e81` | `rgb(49, 46, 129)` | Dark hero gradient middle |
| **Midnight Hero 3** | `#4338ca` | `rgb(67, 56, 202)` | Dark hero gradient bottom end |
| **Deep Space** | `#0f0a1e` | `rgb(15, 10, 30)` | Under-hero content transition, dark page sections |
| **Obsidian Footer**| `#0d0c18` | `rgb(13, 12, 24)` | Deep, seamless premium footer canvas |
| **Text Main** | `#1e293b` | `rgb(30, 41, 59)` | Standard high-contrast body text on light backgrounds |
| **Text Heading** | `#0f172a` | `rgb(15, 23, 42)` | High-impact headlines, titles, cards on light backgrounds |
| **Text Light** | `#64748b` | `rgb(100, 116, 139)` | Subtitles, meta tags, timestamps, secondary labels |
| **Border Light** | `#e2e8f0` | `rgb(226, 232, 240)` | Clean subtle borders for light cards, inputs, and dividers |
| **Border Glass** | `rgba(255, 255, 255, 0.1)` | — | Dark hero cards, navbar border, pill borders |
| **Status Success** | `#059669` / `#10b981` | `rgb(5, 150, 105)` | Verified tickets, passing quizzes, success toasts |
| **Status Warning** | `#d97706` / `#f59e0b` | `rgb(217, 119, 6)` | Pending review, limited seats warning |
| **Status Danger** | `#dc2626` / `#ef4444` | `rgb(220, 38, 38)` | Closed registrations, quiz timer expiring, errors |

---

## 5. Typography Hierarchy & Font System

### 🔤 Font Families
- **Primary Body & Interface**: `'Inter', system-ui, -apple-system, sans-serif`
  - Weights: `300` (Light), `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold), `800` (ExtraBold), `900` (Black).
- **Code & Technical Identifiers**: `'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace`
  - Weights: `400`, `600`. Used for ticket numbers, certificate verification hashes, quiz terminal code, API keys.
- **Marquee / Display Banner**: `'Inter', 'Impact', 'Arial Black', sans-serif`
  - Weight: `900` uppercase, heavy letter-spacing (`3px`) for high-urgency caution tapes.

### 📏 Typography Scale & Hierarchy

| Level | Size | Weight | Line Height | Letter Spacing | CSS Rule Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Massive Display** | `clamp(3.5rem, 11vw, 8.5rem)` | 900 | `1.1` | `-2px` | White-to-indigo gradient text fill |
| **Page Hero Title** | `clamp(2.2rem, 5vw, 3.5rem)` | 900 | `1.15` | `-1px` | White gradient text fill |
| **Section Title (H2)** | `clamp(2rem, 4vw, 2.75rem)` | 800 | `1.2` | `-0.5px` | `#0f172a` (Light) or `#ffffff` (Dark) |
| **Card / Modal Title (H3)**| `1.25rem - 1.5rem` | 700 | `1.3` | normal | `#0f172a` |
| **Sub-heading / H4** | `1.1rem - 1.2rem` | 600 | `1.4` | normal | `#1e293b` |
| **Lead Subtitle (p.lead)**| `clamp(1rem, 1.5vw, 1.25rem)`| 400 | `1.6` | normal | `rgba(255,255,255,0.8)` on dark / `#64748b` on light |
| **Body Regular (p)** | `1rem` (16px) | 400 | `1.6` | normal | `#1e293b` |
| **Body Small / Meta** | `0.875rem` (14px) | 500 | `1.5` | normal | `#64748b` |
| **Pill / Section Overline**| `0.75rem - 0.85rem` | 700 | `1.2` | `1px - 2.5px` | Uppercase, rounded pill wrapper |
| **Monospace Snippet** | `0.85rem - 0.9rem` | 500-600 | `1.5` | `0.5px` | Dark slate block / rounded border |

---

## 6. Borders, Radii, Shadows & Elevation

### 📐 Corner Radius Guidelines
- **Micro (`8px - 10px`)**: Input elements, dropdown items, filter buttons, badges.
- **Card Default (`12px`)**: All standard content cards, event preview tiles, blog feed cards.
- **Brand Logo (`12px`)**: Specific radius for all official D-Coders logo icons (`--logo-radius: 12px;`).
- **Panels & Glass Wrappers (`20px`)**: Glassmorphism cards on the About page and modals.
- **Large Containers (`24px`)**: Feature showcases, modal containers, hero inner containers.
- **Capsule / Pill (`9999px` or `50px`)**: Action buttons, search inputs, navbar shell, category chips.

### ☁️ Elevation & Glow Hierarchy
```css
/* Standard Subtle Lift */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);

/* Editorial Soft Shadow (for floating cards) */
--shadow-soft: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01);

/* Brand Glows (for hovered CTA buttons & active cards) */
--shadow-glow: 0 8px 25px rgba(99, 102, 241, 0.25);
--shadow-glow-active: 0 15px 40px rgba(99, 102, 241, 0.38);

/* Dark Card Drop Shadow (3D depth) */
--shadow-dark: 0 14px 32px rgba(15, 23, 42, 0.25);
```

---

## 7. Signature Components & UI Code Snippets

### 🚧 Component 1: Crime Scene / Caution Tape Ribbon
*The iconic dual-layer ticker seen at the very top of the platform.*

```html
<div class="crime-tape-banner">
  <!-- Top Tape (Rotated -1.2deg, scrolls Left-to-Right) -->
  <div class="crime-tape crime-tape--top">
    <div class="crime-tape__track crime-tape__track--ltr">
      <a href="/events" class="crime-tape__segment">
        <span class="crime-tape__warn">⚠️</span>
        <span>UPCOMING HACKATHON REGISTRATION LIVE</span>
        <span class="crime-tape__dot"></span>
      </a>
      <!-- Repeat segment 4x for continuous seamless scroll -->
    </div>
  </div>

  <!-- Bottom Tape (Rotated +0.8deg, scrolls Right-to-Left) -->
  <div class="crime-tape crime-tape--bottom">
    <div class="crime-tape__track crime-tape__track--rtl">
      <a href="/events" class="crime-tape__segment">
        <span class="crime-tape__warn">🚨</span>
        <span>LIMITED SEATS • RESERVE YOUR TICKET NOW</span>
        <span class="crime-tape__dot"></span>
      </a>
      <!-- Repeat segment 4x for continuous seamless scroll -->
    </div>
  </div>
</div>
```

```css
.crime-tape-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 75px;
  z-index: 1001;
  overflow: hidden;
  background: rgba(10, 10, 20, 0.4);
  backdrop-filter: blur(20px) saturate(1.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}

.crime-tape {
  position: relative;
  width: 100%;
  height: 40px;
  overflow: hidden;
  background: linear-gradient(180deg, #FFD600 0%, #ffdc2b 50%, #FFD600 100%);
  border-top: 1px solid rgba(0,0,0,0.12);
  border-bottom: 1px solid rgba(0,0,0,0.18);
}

/* Diagonal Hazard Stripes */
.crime-tape::before,
.crime-tape::after {
  content: '';
  position: absolute;
  left: -20px; right: -20px;
  height: 8px;
  background: repeating-linear-gradient(
    -55deg,
    #111 0px, #111 8px,
    #FFD600 8px, #FFD600 16px
  );
  z-index: 4;
}
.crime-tape::before { top: 0; }
.crime-tape::after { bottom: 0; }

.crime-tape--top {
  transform: rotate(-1.2deg) scaleX(1.05);
  transform-origin: left center;
  z-index: 2;
}

.crime-tape--bottom {
  transform: rotate(0.8deg) scaleX(1.05);
  transform-origin: right center;
  margin-top: -5px;
  z-index: 1;
}

.crime-tape__track {
  display: flex;
  align-items: center;
  width: max-content;
  height: 100%;
  will-change: transform;
}

.crime-tape__track--ltr { animation: tape-scroll-ltr 32s linear infinite; }
.crime-tape__track--rtl { animation: tape-scroll-rtl 26s linear infinite; }

.crime-tape__segment {
  display: inline-flex;
  align-items: center;
  gap: 1.4rem;
  white-space: nowrap;
  padding: 0 1.8rem;
  color: #0a0a0a;
  font-family: 'Inter', 'Impact', 'Arial Black', sans-serif;
  font-weight: 900;
  font-size: 0.84rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  text-decoration: none;
}

@keyframes tape-scroll-ltr {
  0% { transform: translateX(-25%); }
  100% { transform: translateX(0%); }
}

@keyframes tape-scroll-rtl {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-25%); }
}
```

---

### 🛸 Component 2: Floating Glass Pill Navbar
*The floating pill capsule centered in the top header.*

```html
<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="logo">
      <img src="/images/logo.webp" alt="D-Coders" class="logo-img" />
      <span class="logo-text">D-Coders<span class="text-gradient">Squad</span></span>
    </a>

    <ul class="nav-menu">
      <li class="nav-item">
        <a href="/" class="nav-link active">Home</a>
      </li>
      <li class="nav-item">
        <a href="/about" class="nav-link">About</a>
      </li>
      <li class="nav-item">
        <a href="/events" class="nav-link">Events</a>
      </li>
      <li class="nav-item">
        <a href="/blog" class="nav-link">Blog</a>
      </li>
    </ul>

    <div class="nav-actions">
      <a href="/login" class="nav-btn-login">Join Squad</a>
    </div>
  </div>
</nav>
```

```css
.navbar {
  position: fixed;
  top: calc(var(--announcement-height, 75px) + 1.2rem);
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  max-width: 1000px;
  z-index: 1000;
  background: rgba(10, 10, 12, 0.75);
  backdrop-filter: blur(32px) saturate(150%);
  -webkit-backdrop-filter: blur(32px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 1.5rem 0 1.2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: #fff;
  text-decoration: none;
}

.logo-img {
  width: 38px;
  height: 38px;
  border-radius: var(--logo-radius, 12px);
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(67, 66, 66, 0.4), 0 0 18px rgba(99, 102, 241, 0.5);
  transition: transform 0.3s ease;
}

.logo:hover .logo-img {
  transform: scale(1.08);
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 0.5rem;
  align-items: center;
  margin: 0; padding: 0;
}

.nav-link {
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-link:hover, .nav-link.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
}

.text-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

### 🌌 Component 3: Cosmic Hero Header with Glowing Orbs
*The signature top section with ambient radial lighting and tech grid.*

```html
<header class="home-hero">
  <div class="container">
    <div class="hero-badge">
      <span>Official Tech Committee</span>
    </div>
    
    <h1>
      INNOVATE.<br />
      COLLABORATE. CREATE.
    </h1>
    
    <p class="hero-desc">
      Join the premier student-led technical community. Master Web Dev, AI/ML, 
      Competitive Coding, and build production-grade projects.
    </p>

    <div class="hero-buttons">
      <a href="/events" class="hero-btn-primary">
        <span>Explore Events</span>
        <i class="fas fa-arrow-right"></i>
      </a>
      <a href="/about" class="hero-btn-secondary">
        <span>Learn More</span>
      </a>
    </div>
  </div>
</header>
```

```css
.home-hero {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
  color: #fff;
  padding: calc(var(--announcement-height, 75px) + 72px + 4rem) 0 6rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

/* Ambient Radial Orbs */
.home-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.25) 0%, transparent 50%),
    radial-gradient(circle at 60% 80%, rgba(244, 63, 94, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

/* Geometric Tech Grid */
.home-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.home-hero .container {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-badge {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.home-hero h1 {
  font-size: clamp(3rem, 9vw, 7.5rem);
  font-weight: 900;
  line-height: 1.05;
  margin-bottom: 1.5rem;
  letter-spacing: -2px;
  background: linear-gradient(135deg, #fff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.hero-desc {
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  color: rgba(255, 255, 255, 0.8);
  max-width: 620px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
}
```

---

### 🔘 Component 4: Buttons & Interactive CTAs

#### 1. Primary Solid Hero Pill Button
```css
.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2.8rem;
  background: #ffffff;
  color: #4f46e5;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  border-radius: 50px;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-btn-primary:hover {
  transform: translateY(-3px) scale(1.02);
  background: #6366f1;
  color: #ffffff;
  box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
}
```

#### 2. Secondary Ghost Glass Pill Button
```css
.hero-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2.8rem;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.hero-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: #ffffff;
  transform: translateY(-2px);
}
```

#### 3. Gradient Brand Action Button (Standard Pages)
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.45);
  color: #ffffff;
}
```

#### 4. Developer Demo & GitHub Interactive Buttons
```css
.btn-demo {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff !important;
  border: 1px solid rgba(99, 102, 241, 0.5);
  padding: 0.7rem 1.4rem;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  transition: all 0.3s ease;
}

.btn-demo:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.4);
}

.btn-github {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0 !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.7rem 1.4rem;
  border-radius: 10px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.btn-github:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff !important;
}
```

---

### 🗂️ Component 5: Card Systems

#### Archetype A: The Editorial Light Card
*Used for blog posts, event listings, domains, and projects.*

```html
<article class="editorial-card">
  <div class="card-image-wrap">
    <img src="/images/event-sample.webp" alt="Card banner" class="card-img" />
    <span class="card-tag">Web Dev</span>
  </div>
  <div class="card-content">
    <span class="card-meta">Oct 24, 2026 • 5 min read</span>
    <h3 class="card-title">Building Scalable Microservices with Next.js 16</h3>
    <p class="card-excerpt">
      Dive deep into modern edge-rendered server actions and persistent Redis caching architectures.
    </p>
    <div class="card-footer">
      <span class="author-name">By Sahil Raj</span>
      <a href="#" class="card-link">Read More &rarr;</a>
    </div>
  </div>
</article>
```

```css
.editorial-card {
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--border-radius, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
  display: flex;
  flex-direction: column;
}

.editorial-card:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.card-image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f1f5f9;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.editorial-card:hover .card-img {
  transform: scale(1.05);
}

.card-tag {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-meta {
  font-size: 0.8rem;
  color: var(--text-light, #64748b);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-heading, #0f172a);
  line-height: 1.35;
  margin-bottom: 0.75rem;
}

.card-excerpt {
  font-size: 0.92rem;
  color: var(--text-light, #64748b);
  line-height: 1.6;
  margin-bottom: 1.25rem;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-color, #e2e8f0);
  padding-top: 1rem;
}

.card-link {
  color: var(--primary, #6366f1);
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: gap 0.2s ease;
}

.card-link:hover {
  color: var(--primary-dark, #4f46e5);
}
```

#### Archetype B: Digital Perforated Event Ticket (`.ticket-card`)
*Authentic perforated ticket with left and right cutouts for registrations.*

```css
.ticket-card {
  --width: 280px;
  --height: 420px;
  --perforation-size: 14px;

  position: relative;
  width: var(--width);
  height: var(--height);
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.15);
  font-family: "Inter", sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* Cutout circles on both edges */
  mask:
    radial-gradient(circle var(--perforation-size) at left 70%, transparent 98%, #000 100%),
    radial-gradient(circle var(--perforation-size) at right 70%, transparent 98%, #000 100%);
  mask-composite: intersect;
  -webkit-mask:
    radial-gradient(circle var(--perforation-size) at left 70%, transparent 98%, #000 100%),
    radial-gradient(circle var(--perforation-size) at right 70%, transparent 98%, #000 100%);
  -webkit-mask-composite: source-in;
}

.ticket-card::after {
  content: '';
  position: absolute;
  top: 70%;
  left: var(--perforation-size);
  right: var(--perforation-size);
  border-top: 2px dashed #cbd5e1;
}

.ticket-id {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--primary, #6366f1);
  font-size: 0.85rem;
  letter-spacing: 1px;
}
```

---

### 🏷️ Component 6: Pills, Badges & Status Indicators

```html
<!-- Live Pulsing Badge -->
<span class="badge-live">
  <span class="live-dot"></span>
  LIVE NOW
</span>

<!-- Domain Tag -->
<span class="badge-domain">AI / Machine Learning</span>

<!-- Verified Badge -->
<span class="badge-verified">
  <i class="fas fa-check-circle"></i>
  Verified Credential
</span>
```

```css
/* Live Pulsing Dot Badge */
.badge-live {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: #f43f5e;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  text-transform: uppercase;
}

.live-dot {
  width: 7px;
  height: 7px;
  background: #f43f5e;
  border-radius: 50%;
  box-shadow: 0 0 8px #f43f5e;
  animation: live-pulse 1.5s infinite ease-in-out;
}

@keyframes live-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
}

/* Category Domain Pill */
.badge-domain {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 50px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

/* Verified Pill */
.badge-verified {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 50px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
```

---

### 📩 Component 7: Input Fields & Newsletter Bar

```html
<form class="newsletter-group">
  <input 
    type="email" 
    placeholder="Enter student / personal email..." 
    class="newsletter-input" 
    required 
  />
  <button type="submit" class="newsletter-btn" aria-label="Subscribe">
    <i class="fas fa-paper-plane"></i>
  </button>
</form>
```

```css
.newsletter-group {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50px;
  padding: 0.35rem 0.35rem 0.35rem 1.25rem;
  max-width: 440px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.newsletter-group:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
}

.newsletter-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 0.92rem;
  font-family: inherit;
}

.newsletter-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.newsletter-btn {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.newsletter-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);
}

/* Standard Editorial Light Input */
.form-input {
  width: 100%;
  padding: 0.85rem 1.2rem;
  background: #ffffff;
  border: 1.5px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  font-size: 0.95rem;
  color: var(--text-main, #1e293b);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}
```

---

### 🔝 Component 8: Expanding Back-to-Top Floating Pill
*Expands dynamically from a circular icon into a text pill upon user hover.*

```html
<button class="back-to-top-button visible" aria-label="Back to Top">
  <svg class="back-to-top-icon" viewBox="0 0 24 24" fill="none">
    <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" fill="currentColor"/>
  </svg>
  <span class="back-to-top-label">BACK TO TOP</span>
</button>
```

```css
.back-to-top-button {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 1000;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.96);
  color: #4f46e5;
  border: 1px solid rgba(99, 102, 241, 0.22);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: width 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, gap 0.3s ease;
}

.back-to-top-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.back-to-top-label {
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  transition: opacity 0.3s ease, max-width 0.3s ease;
}

.back-to-top-button:hover {
  width: 8.75rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%);
  box-shadow: 0 16px 36px rgba(99, 102, 241, 0.35);
  gap: 0.6rem;
}

.back-to-top-button:hover .back-to-top-icon {
  transform: translateY(-2px);
}

.back-to-top-button:hover .back-to-top-label {
  opacity: 1;
  max-width: 6.5rem;
}
```

---

### 🌃 Component 9: Premium Midnight Footer

```html
<footer class="footer-premium">
  <div class="footer-glow-line"></div>
  <div class="container footer-grid">
    <!-- Col 1: Brand -->
    <div class="footer-brand">
      <span class="brand-logo-text">D-Coders<span class="text-gradient">Squad</span></span>
      <p class="footer-desc">
        The premier student technical community of COER University, Roorkee. 
        Mentored by Prof. Dr. Deepak Painuli.
      </p>
      <div class="footer-social-row">
        <a href="https://linkedin.com" class="social-link" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
        <a href="https://github.com" class="social-link" aria-label="GitHub"><i class="fab fa-github"></i></a>
        <a href="https://youtube.com" class="social-link" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        <a href="https://instagram.com" class="social-link" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
      </div>
    </div>

    <!-- Col 2: Committees -->
    <div>
      <h4 class="widget-title">Committees</h4>
      <ul class="footer-links-list">
        <li><a href="/web-development" class="footer-link">Web Development</a></li>
        <li><a href="/app-development" class="footer-link">App Development</a></li>
        <li><a href="/machine-learning" class="footer-link">Machine Learning</a></li>
        <li><a href="/competitive-coding" class="footer-link">Competitive Coding</a></li>
      </ul>
    </div>

    <!-- Col 3: Activities -->
    <div>
      <h4 class="widget-title">Explore</h4>
      <ul class="footer-links-list">
        <li><a href="/events" class="footer-link">Events & Tickets</a></li>
        <li><a href="/blog" class="footer-link">Tech Publications</a></li>
        <li><a href="/quizzes" class="footer-link">Coding Quizzes</a></li>
        <li><a href="/certificate" class="footer-link">Verify Certificate</a></li>
      </ul>
    </div>

    <!-- Col 4: Newsletter -->
    <div>
      <h4 class="widget-title">Stay Connected</h4>
      <p class="footer-desc">Get invited to upcoming workshops and community bootcamps.</p>
      <!-- Insert Component 7 here -->
    </div>
  </div>
</footer>
```

```css
.footer-premium {
  background: #0d0c18;
  color: rgba(255, 255, 255, 0.65);
  padding: 4rem 0 2rem;
  position: relative;
  overflow: hidden;
}

.footer-glow-line {
  height: 1px;
  background: linear-gradient(
    to right, 
    transparent, 
    rgba(99, 102, 241, 0.6) 30%, 
    rgba(139, 92, 246, 0.6) 60%, 
    transparent
  );
  position: absolute;
  top: 0; left: 0; right: 0;
}

.footer-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1.4fr) minmax(160px, 0.9fr) minmax(160px, 0.9fr) minmax(260px, 1.3fr);
  gap: 3rem;
  padding-bottom: 3.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

@media (max-width: 992px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 576px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}

.widget-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1.5rem;
}

.footer-links-list {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.footer-link {
  color: rgba(255, 255, 255, 0.58);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.25s ease;
}

.footer-link:hover {
  color: #ffffff;
  padding-left: 4px;
}

.social-link {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(99, 102, 241, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
  text-decoration: none;
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
}

.social-link:hover {
  transform: translateY(-3px);
  background: rgba(99, 102, 241, 0.15);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
}
```

---

### ⏳ Component 10: Skeleton Loader & Image Transitions

```css
/* Shimmer Skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-alt, #f8fafc) 25%,
    rgba(99, 102, 241, 0.06) 50%,
    var(--bg-alt, #f8fafc) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Progressive Image Fade */
img[loading="lazy"] {
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

img[loading="lazy"].loaded,
img.loaded {
  opacity: 1;
}
```

---

## 8. Motion, Micro-Interactions & Audio Feedback

### 🚀 Lenis Smooth Scrolling
In your root application layout, enable smooth momentum scroll:
```typescript
import Lenis from 'lenis';

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
```

### 💫 Hover & Physics Timing
- Micro-interactions (Buttons, Chips, Links): `all 0.2s ease` or `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
- Hover lifts: Apply `transform: translateY(-2px)` for small items and `translateY(-4px)` for cards.
- Icon nudges: Rotate or shift on parent hover:
  ```css
  .btn-demo:hover i {
    transform: scale(1.1) rotate(-5deg) translateY(-1px);
  }
  ```

### 🔊 Sound Feedback (`SoundContext`)
In `D-Coders-Static`, subtle sound effects accompany key user interactions. If supporting audio, map these sound files:
- `modal-open`: Soft swoosh when dialogs or navigation open.
- `modal-close`: Crisp low pop when dismissed.
- `success`: Dual-tone chime upon form submission or ticket generation.
- `click`: Subtle click on tab switching.

---

## 9. Iconography & Media Standards

1. **Icon Library**:
   - Primary: **Font Awesome 6 Free** (`<i class="fas fa-..."></i>`, `<i class="fab fa-..."></i>`).
   - Alternative: **Lucide React** (`lucide-react`).
2. **Logo Guidelines**:
   - Official Squad logo: Located at `/images/logo.webp` (optimized WebP format).
   - Display size: `38px` to `44px` inside headers; `80px` to `120px` in hero banners.
   - Logo curvature: `border-radius: var(--logo-radius, 12px)`.
   - Ambient glow: `box-shadow: 0 4px 12px rgba(67,66,66,0.4), 0 0 18px rgba(99,102,241,0.5)`.
3. **Imagery Format**:
   - Use `.webp` or `.avif` for banners and profile cards.
   - Standard card aspect ratios: `16:9` for blogs/events, `1:1` (square) for leader profile photos.

---

## 10. Teammate Implementation Checklist

When starting your new website in this design theme, check off each step:

- [ ] **Step 1: Set Google Fonts**  
  Import `Inter` (weights 300 to 900) and `JetBrains Mono` (weights 400, 600).
- [ ] **Step 2: Add Global Styles**  
  Copy Section 2 (`:root`, `::selection`, scrollbars) into your primary CSS file.
- [ ] **Step 3: Setup Header Structure**  
  Add the double-layer caution tape marquee (`.crime-tape-banner`) and the floating glass pill navbar (`.navbar`).
- [ ] **Step 4: Build Hero Section**  
  Use the midnight gradient (`linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)`) with the ambient radial glow orbs.
- [ ] **Step 5: Apply Card & Button Tokens**  
  Use `.editorial-card` (`#ffffff`, border `#e2e8f0`, radius `12px`) and `.btn-primary` (`#6366f1`).
- [ ] **Step 6: Mount Midnight Footer**  
  Mount the `#0d0c18` footer with the gradient top divider line and social squircles.
- [ ] **Step 7: Verify Responsiveness**  
  Check layouts at `<768px` (tablets) and `<480px` (smartphones). Ensure font sizes scale smoothly via `clamp()`.

---

*(c) 2026 D-Coders Squad — COER University, Roorkee. Designed & Engineered with ❤️.*
