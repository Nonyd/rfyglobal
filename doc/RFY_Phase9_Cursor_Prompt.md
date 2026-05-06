# ROOM FOR YOU — Phase 9 Cursor Prompt
## Full Visual Redesign · Dark/Light Mode · Admin Overhaul · Payment Test/Live Toggle

---

## CONTEXT

Phase 9 is a comprehensive visual overhaul of the entire platform — public site and admin dashboard — plus two feature additions: dark/light mode toggle and payment gateway test/live mode.

**What changes:**
1. **Design system** — new fonts (Clash Display + General Sans), new color palette (charcoal + electric gold), completely new feel
2. **Public site** — creative, immersive layouts. Bold. Unique. Not generic.
3. **Dark/Light mode** — charcoal dark (default) ↔ warm cream light, toggle in navbar
4. **Admin dashboard** — full light mode redesign, premium feel, rich home page
5. **Payment Test/Live toggle** — per-gateway in Integrations, warning banner on Partner page

---

## INSTALL DEPENDENCIES

```bash
npm install next-themes
```

Clash Display and General Sans are available via Fontshare (free, high quality):
- Clash Display: https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap
- General Sans: https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600&display=swap

---

## ═══════════════════════════════════════
## MODULE 1 — NEW DESIGN SYSTEM
## ═══════════════════════════════════════

### TASK 1 — Update Fonts

Update `src/app/layout.tsx` — replace Google Fonts with Fontshare:

```typescript
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

// Remove next/font/google imports entirely
// Fontshare fonts are loaded via CSS @import in globals.css

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=general-sans@300,400,500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

### TASK 2 — Theme Provider

Create `src/components/providers/ThemeProvider.tsx`:

```typescript
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}
```

---

### TASK 3 — New Design System (Tailwind + CSS Variables)

Replace `tailwind.config.ts` entirely:

```typescript
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Dark mode palette
        charcoal: {
          DEFAULT: '#141414',
          soft: '#1C1C1C',
          muted: '#242424',
          border: '#2A2A2A',
        },
        // Light mode palette
        cream: {
          DEFAULT: '#F5F0E8',
          soft: '#FAF7F2',
          muted: '#EDE8DF',
          border: '#E0D9CE',
        },
        // Shared
        gold: {
          DEFAULT: '#D4A847',
          light: '#E8C068',
          dark: '#B8902E',
          electric: '#F0BC4A',
          glow: 'rgba(212,168,71,0.15)',
        },
        red: {
          brand: '#D0021B',
        },
        // Semantic tokens (resolved via CSS vars)
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body: ['General Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(3.5rem, 10vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(2.5rem, 7vw, 6rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '4px',
        'lg': '8px',
      },
      animation: {
        'gold-pulse': 'goldPulse 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'slide-in-right': 'slideInRight 0.4s ease forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        goldPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
```

---

### TASK 4 — Global CSS with CSS Variables

Replace `src/app/globals.css` entirely:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── THEME VARIABLES ── */
@layer base {
  :root,
  .dark {
    --color-bg: 20 20 20;           /* #141414 charcoal */
    --color-surface: 28 28 28;      /* #1C1C1C */
    --color-border: 42 42 42;       /* #2A2A2A */
    --color-text-primary: 250 250 250;
    --color-text-secondary: 180 180 180;
    --color-text-muted: 100 100 100;
  }

  .light {
    --color-bg: 245 240 232;        /* #F5F0E8 warm cream */
    --color-surface: 250 247 242;   /* #FAF7F2 */
    --color-border: 224 217 206;    /* #E0D9CE */
    --color-text-primary: 15 15 15;
    --color-text-secondary: 60 55 50;
    --color-text-muted: 120 115 108;
  }
}

@layer base {
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: rgb(var(--color-bg));
    color: rgb(var(--color-text-primary));
    font-family: 'General Sans', sans-serif;
    overflow-x: hidden;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Clash Display', sans-serif;
    font-weight: 600;
  }

  ::selection {
    background-color: rgba(212, 168, 71, 0.3);
    color: rgb(var(--color-text-primary));
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: rgb(var(--color-bg)); }
  ::-webkit-scrollbar-thumb { background: #D4A847; border-radius: 2px; }
}

/* ── UTILITY CLASSES ── */
@layer utilities {
  .text-gradient-gold {
    background: linear-gradient(135deg, #D4A847 0%, #F0BC4A 50%, #B8902E 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .text-gradient-gold-electric {
    background: linear-gradient(135deg, #F0BC4A 0%, #D4A847 40%, #E8C068 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .surface {
    background-color: rgb(var(--color-surface));
  }

  .border-theme {
    border-color: rgb(var(--color-border));
  }

  .gold-border-gradient {
    border-image: linear-gradient(135deg, #D4A847, transparent) 1;
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #D4A847, transparent);
    opacity: 0.4;
  }

  /* Grain texture overlay */
  .grain::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.03;
  }

  /* Section number style */
  .section-number {
    font-family: 'Clash Display', sans-serif;
    font-size: clamp(6rem, 15vw, 12rem);
    font-weight: 700;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1px rgba(212, 168, 71, 0.15);
    user-select: none;
    pointer-events: none;
  }

  /* Bold underline accent */
  .gold-underline {
    position: relative;
    display: inline-block;
  }
  .gold-underline::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #D4A847, #F0BC4A);
  }

  /* Shimmer loading effect */
  .shimmer-bg {
    background: linear-gradient(
      90deg,
      rgb(var(--color-surface)) 25%,
      rgb(var(--color-border)) 50%,
      rgb(var(--color-surface)) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

/* ── TIPTAP PROSE ── */
.prose-rfy h1, .prose-rfy h2, .prose-rfy h3 {
  font-family: 'Clash Display', sans-serif;
  color: rgb(var(--color-text-primary));
}
.prose-rfy p { color: rgb(var(--color-text-secondary)); line-height: 1.8; margin-bottom: 1rem; }
.prose-rfy a { color: #D4A847; text-decoration: underline; }
.prose-rfy blockquote {
  border-left: 3px solid #D4A847;
  padding-left: 1rem;
  color: rgb(var(--color-text-muted));
  font-style: italic;
  margin: 1.5rem 0;
}
.prose-rfy code { background: rgb(var(--color-border)); padding: 0.2em 0.4em; font-size: 0.875em; }
.prose-rfy pre { background: rgb(var(--color-surface)); padding: 1rem; overflow-x: auto; }
.prose-rfy img { max-width: 100%; margin: 1rem 0; }
.prose-rfy hr { border-color: rgba(212,168,71,0.2); margin: 2rem 0; }

/* Tiptap placeholder */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: rgb(var(--color-text-muted));
  pointer-events: none;
  height: 0;
}

/* ── THEME TRANSITION ── */
*, *::before, *::after {
  transition-property: background-color, border-color, color;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
/* Exclude elements that shouldn't transition */
img, video, canvas, svg {
  transition: none;
}
```

---

## ═══════════════════════════════════════
## MODULE 2 — DARK/LIGHT MODE TOGGLE
## ═══════════════════════════════════════

### TASK 5 — Theme Toggle Component

Create `src/components/shared/ThemeToggle.tsx`:

```typescript
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative w-9 h-9 flex items-center justify-center transition-all duration-200',
        'border border-theme hover:border-gold text-text-secondary hover:text-gold',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        size={16}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        )}
      />
      <Moon
        size={16}
        className={cn(
          'absolute transition-all duration-300',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        )}
      />
    </button>
  )
}
```

---

### TASK 6 — Update Navbar with Theme Toggle

Update `src/components/layout/Navbar.tsx`:

- Add `ThemeToggle` component next to the "Join Us" CTA
- Update all color classes to use CSS variable-based tokens
- The navbar background on scroll: dark mode → `bg-charcoal/95 backdrop-blur-md`, light mode → `bg-cream/95 backdrop-blur-md`
- Nav links: `text-text-secondary hover:text-gold`
- Mobile menu: uses `bg` CSS variable so it respects theme

```typescript
// Add to nav links section:
import { ThemeToggle } from '@/components/shared/ThemeToggle'

// In the desktop nav actions:
<ThemeToggle />
<Link href="/forms/join-room-for-you"
  className="hidden md:inline-flex items-center px-5 py-2 border border-gold text-gold font-body text-sm tracking-widest uppercase hover:bg-gold hover:text-charcoal transition-all duration-300">
  Join Us
</Link>

// Update scrolled navbar background:
className={cn(
  'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
  scrolled
    ? 'bg-bg/95 backdrop-blur-md border-b border-theme py-3'
    : 'bg-transparent py-5'
)}
```

---

## ═══════════════════════════════════════
## MODULE 3 — PUBLIC SITE REDESIGN
## ═══════════════════════════════════════

### TASK 7 — Hero Section Redesign

Rewrite `src/components/landing/Hero.tsx`:

**New hero concept:** Full-screen with an oversized bold statement. The headline dominates the entire viewport. The design should feel like a magazine cover — not a typical ministry hero.

```
Layout:
- Background: bg CSS variable (charcoal dark / cream light)
- Large background text watermark: "RFY" in section-number style (barely visible)
- Top left: eyebrow label "WORSHIP · PRAYER · COMMUNITY" — small, tracked, gold
- Center-left aligned (not centered):
  - Giant headline in Clash Display, display-2xl size:
    "THERE IS" (white/dark text, full weight)
    "ROOM" (text-gradient-gold-electric, largest)  
    "FOR YOU." (white/dark, outlined style — use -webkit-text-stroke)
- Right side: a vertical gold line + small descriptor text rotated 90deg
- Bottom: scroll indicator + stat strip showing "100M+ Streams · 600K+ Followers · Jesus to Nations"
- Two CTAs: gold filled "Join the Community" + ghost "Our Story"
```

Key CSS for the outlined text effect:
```css
.text-outlined {
  color: transparent;
  -webkit-text-stroke: 2px currentColor;
}
```

---

### TASK 8 — Vision Section Redesign

Rewrite `src/components/landing/VisionSection.tsx`:

**New concept:** Asymmetric layout with oversized section number.

```
- Background: surface (slightly offset from bg)
- Top left: giant "01" in section-number style
- Left 60%: Large bold text — the vision statement broken into 2-3 impactful lines
  Each key phrase gets its own line. No paragraph wall of text.
  Example treatment:
  "Building a community" — large, white
  "of young men & women" — medium, text-secondary  
  "singing songs of salvation." — large, gold gradient
- Right 40%: Mission block
  "JESUS TO NATIONS" in Clash Display, very bold
  "2 Cor 5:17-21" in gold italic below
  A list of community activities with gold bullet dots
- Bottom: thin gold section divider
```

---

### TASK 9 — Confession Reveal Redesign

Rewrite `src/components/landing/ConfessionReveal.tsx`:

**New concept:** Each confession line appears with a bold typographic treatment — not just fade in, but a distinct visual moment.

```
- Background: pure bg color (darkest/lightest depending on theme)
- "THE CONFESSION" label — tracked wide, tiny, gold
- Lines animate in one by one on scroll (keep existing GSAP logic)
- Current line: Clash Display, large, full color, with a gold left border accent
- Past lines: smaller, text-muted
- The section has a bold "02" section number watermark
- Final line "till his return!" — bold, gold gradient, larger than others
```

---

### TASK 10 — From The Shepherd Redesign

Rewrite `src/components/landing/FromTheShepherd.tsx`:

**New concept:** Full-bleed editorial layout.

```
- Full width section, no max-width container on the image
- Left half: Yadah's portrait — full height, edge to edge, no border radius
- Right half: content panel with generous padding
  - "03" section number watermark top right
  - "FROM THE SHEPHERD" — tiny gold label
  - Quote in Clash Display, large, italic treatment
  - "Minister Yadah" — bold, gold
  - "Founder · Room For You" — small, text-muted
  - Gold underline accent
  - Link to yadahworld.com
- On mobile: stacked, portrait on top full width
```

---

### TASK 11 — Community Highlights Redesign

Rewrite `src/components/landing/CommunityHighlights.tsx`:

**New concept:** Horizontal scroll strip on mobile, bold grid on desktop.

```
- "04" section number watermark
- "WHAT WE DO" — tiny gold label
- 4 cards in a 2x2 grid (desktop) or horizontal scroll (mobile)
- Each card:
  - Large bold number (01, 02, 03, 04) in gold — top left
  - Title in Clash Display, large
  - Description in General Sans
  - No border radius — sharp edges
  - Dark mode: charcoal-soft bg, gold border on hover
  - Light mode: cream-muted bg, gold border on hover
  - Hover: card lifts + gold left border appears
```

---

### TASK 12 — CTA Section Redesign

Rewrite `src/components/landing/CTASection.tsx`:

**New concept:** Full-bleed bold typographic moment.

```
- Background: gold gradient (from gold-dark to gold-electric)
- Text color: charcoal (dark text on gold bg — inverted from rest of site)
- Giant text: "THE DOOR IS OPEN." in Clash Display, display-2xl, charcoal
- Sub: "Step in. There is room for you." in General Sans
- CTA button: charcoal bg, white text — inverted from all other CTAs
- This section should feel like a disruption — different from everything else on the page
```

---

### TASK 13 — Footer Redesign

Rewrite `src/components/layout/Footer.tsx`:

```
- Background: charcoal-DEFAULT (stays dark even in light mode — intentional)
- Top: thick gold horizontal rule
- Three column layout:
  Left: Logo + tagline + "Jesus to Nations"
  Center: Nav links in two rows
  Right: Social icons + "A SonsHub Media Initiative"
- Bottom strip: copyright line, center aligned, text-muted
- All text stays light (white/cream) regardless of theme — footer is always dark
```

---

### TASK 14 — Apply Theme-Aware Classes Across All Public Pages

Go through every public page and component and replace hardcoded color classes:

| Old class | New class |
|---|---|
| `bg-black` / `bg-[#0A0A0A]` | `bg-bg` |
| `bg-[#111111]` | `bg-surface` |
| `text-white` | `text-text-primary` |
| `text-white/60` | `text-text-secondary` |
| `text-white/30` | `text-text-muted` |
| `border-white/10` | `border-theme` |
| `text-[#C9A84C]` / `text-gold` | `text-gold` (keep — gold is same in both themes) |
| `font-display` | `font-display` (now Clash Display) |
| `font-body` | `font-body` (now General Sans) |

**Pages to update:**
- All landing sections (Hero, Vision, Confession, Shepherd, Highlights, CTA)
- `/about`, `/blog`, `/blog/[slug]`, `/word`, `/study`, `/events`, `/gallery`
- `/partner`, `/confession`, `/forms/[slug]`
- All shared components (AudioPlayer, ShareButton, PublicFormRenderer)
- Navbar, Footer

---

## ═══════════════════════════════════════
## MODULE 4 — ADMIN DASHBOARD REDESIGN
## ═══════════════════════════════════════

### TASK 15 — Admin Design System

The admin dashboard is always light — it does NOT follow the public site theme toggle. Admin is independently styled.

**Admin color palette:**
```css
/* Admin-specific CSS vars — add to globals.css */
.admin-layout {
  --admin-bg: #FAFAFA;
  --admin-surface: #FFFFFF;
  --admin-sidebar: #F5F0E8;
  --admin-border: #E8E2D9;
  --admin-text: #1A1A1A;
  --admin-text-muted: #6B6560;
  --admin-gold: #D4A847;
  --admin-gold-light: rgba(212, 168, 71, 0.1);
}
```

---

### TASK 16 — Admin Sidebar Redesign

Rewrite `src/components/admin/AdminSidebar.tsx`:

```
Design:
- Background: #F5F0E8 (warm cream)
- Right border: 1px solid #E8E2D9
- Logo at top — use the white version on a small charcoal pill background
- Nav items:
  - Inactive: text #6B6560, no background
  - Active: gold left border (3px), text #D4A847, background rgba(212,168,71,0.08)
  - Hover: text #1A1A1A, background rgba(0,0,0,0.04)
- Section groupings with tiny labels:
  "CONTENT" — Scripture, Blog, Study, Events, Gallery, Forms
  "COMMUNITY" — Dashboard (home)
  "SETTINGS" — Site CMS, Integrations, Partnership
- Bottom: user email display + sign out button
- Width: 260px
```

```typescript
const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Scripture', href: '/admin/scripture', icon: BookOpen },
      { label: 'Blog', href: '/admin/blog', icon: FileText },
      { label: 'Study', href: '/admin/study', icon: GraduationCap },
      { label: 'Events', href: '/admin/events', icon: Calendar },
      { label: 'Gallery', href: '/admin/gallery', icon: Images },
      { label: 'Forms', href: '/admin/forms', icon: ClipboardList },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Site CMS', href: '/admin/cms', icon: Settings2 },
      { label: 'Integrations', href: '/admin/integrations', icon: Plug },
      { label: 'Partnership', href: '/admin/partner', icon: Heart },
    ],
  },
]
```

---

### TASK 17 — Admin Topbar Redesign

Rewrite `src/components/admin/AdminTopbar.tsx`:

```
- Background: #FFFFFF
- Bottom border: 1px solid #E8E2D9
- Left: Page title in Clash Display, dark text
- Right: 
  - Live indicator dot (green pulse) + "rfyglobal.org" link
  - Admin user avatar (initials circle in gold)
- Height: 64px
```

---

### TASK 18 — Admin Dashboard Home Redesign

Rewrite `src/app/admin/(dashboard)/page.tsx`:

This is the most important admin page — it should feel like a control center.

**Layout:**

```
TOP ROW — Greeting + Date
"Good morning, Nony." in Clash Display, large, dark text
Today's date in General Sans, text-muted

STAT CARDS ROW (6 cards in 3x2 grid):
Each card:
- White background, subtle shadow, gold left border (3px)
- Icon (Lucide) in gold circle
- Large number in Clash Display
- Label in General Sans, text-muted
- Trend indicator: ↑ +12% this month (green) or ↓ -3% (red)

Cards:
1. Total Community Members (count of form submissions from join form)
2. Total Forms (active forms count)  
3. Total Submissions (all form submissions)
4. Published Posts (blog)
5. Upcoming Events
6. Total Gifts Received (sum of successful giving records in ₦)

QUICK ACTIONS ROW:
"Quick Actions" label
6 action buttons in a row:
+ New Scripture | + New Post | + New Event | + Upload Photos | + New Form | View Partners
Each: white card, gold icon, label

TODAY'S SCRIPTURE CARD:
Full width card, cream background, gold left border
"TODAY'S WORD" — tiny gold label
Scripture reference in Clash Display, gold
Scripture text in General Sans, italic
Audio indicator if audio exists

RECENT ACTIVITY FEED:
"Recent Activity" label + "View All" link
List of last 10 activity items across all modules:
- New form submission (which form, when)
- New registration (join form, name, location)
- New gift received (amount, gateway)
- New blog post published
Each item: avatar icon (colored by type) + description + time ago
```

```typescript
import { db } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Fetch all stats in parallel
  const [
    memberCount,
    formCount,
    submissionCount,
    postCount,
    eventCount,
    giftStats,
    todayScripture,
    recentSubmissions,
    recentGifts,
  ] = await Promise.all([
    // Community members — count submissions from join form
    db.formSubmission.count({
      where: { form: { slug: { contains: 'join' } } },
    }),
    db.form.count({ where: { isActive: true } }),
    db.formSubmission.count(),
    db.post.count({ where: { isPublished: true } }),
    db.event.count({ where: { isActive: true, date: { gte: now } } }),
    db.givingRecord.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Today's scripture
    db.scripture.findFirst({
      where: {
        scheduledAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        isActive: true,
      },
    }),
    // Recent submissions
    db.formSubmission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { form: { select: { title: true } } },
    }),
    // Recent gifts
    db.givingRecord.findMany({
      take: 5,
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const stats = [
    {
      label: 'Community Members',
      value: memberCount.toLocaleString(),
      icon: 'Users',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Active Forms',
      value: formCount.toLocaleString(),
      icon: 'ClipboardList',
      trend: null,
    },
    {
      label: 'Form Submissions',
      value: submissionCount.toLocaleString(),
      icon: 'Inbox',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Published Posts',
      value: postCount.toLocaleString(),
      icon: 'FileText',
      trend: null,
    },
    {
      label: 'Upcoming Events',
      value: eventCount.toLocaleString(),
      icon: 'Calendar',
      trend: null,
    },
    {
      label: 'Total Gifts (₦)',
      value: `₦${((giftStats._sum.amount ?? 0)).toLocaleString()}`,
      icon: 'Heart',
      trend: `${giftStats._count.id} gifts`,
      trendUp: true,
    },
  ]

  // Build activity feed
  const activity = [
    ...recentSubmissions.map((s) => ({
      type: 'submission' as const,
      label: `New submission on "${s.form.title}"`,
      time: s.createdAt,
    })),
    ...recentGifts.map((g) => ({
      type: 'gift' as const,
      label: `₦${g.amount.toLocaleString()} gift via ${g.gateway}`,
      time: g.createdAt,
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl" style={{ color: 'var(--admin-text)' }}>
          {greeting}, Nony.
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }} className="font-body text-sm mt-1">
          {now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label}
            className="bg-white p-5 border-l-4 shadow-sm"
            style={{ borderLeftColor: 'var(--admin-gold)', borderTop: '1px solid var(--admin-border)', borderRight: '1px solid var(--admin-border)', borderBottom: '1px solid var(--admin-border)' }}>
            <p className="font-body text-xs uppercase tracking-widest mb-3"
              style={{ color: 'var(--admin-text-muted)' }}>
              {stat.label}
            </p>
            <p className="font-display text-3xl" style={{ color: 'var(--admin-text)' }}>
              {stat.value}
            </p>
            {stat.trend && (
              <p className={`font-body text-xs mt-2 ${stat.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                {stat.trendUp ? '↑' : '↓'} {stat.trend}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="font-body text-xs uppercase tracking-widest mb-4"
          style={{ color: 'var(--admin-text-muted)' }}>
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '+ New Scripture', href: '/admin/scripture' },
            { label: '+ New Post', href: '/admin/blog/new' },
            { label: '+ New Event', href: '/admin/events' },
            { label: '+ Upload Photos', href: '/admin/gallery' },
            { label: '+ New Form', href: '/admin/forms/new' },
            { label: 'View Partners', href: '/admin/partner' },
          ].map((action) => (
            <a key={action.href} href={action.href}
              className="px-4 py-2 font-body text-sm border transition-all"
              style={{
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text)',
                background: 'white',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = 'var(--admin-gold)'
                ;(e.target as HTMLElement).style.color = 'var(--admin-gold)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = 'var(--admin-border)'
                ;(e.target as HTMLElement).style.color = 'var(--admin-text)'
              }}>
              {action.label}
            </a>
          ))}
        </div>
      </div>

      {/* Today's scripture */}
      {todayScripture && (
        <div className="p-6 border-l-4"
          style={{
            borderLeftColor: 'var(--admin-gold)',
            background: 'var(--admin-sidebar)',
            borderTop: '1px solid var(--admin-border)',
            borderRight: '1px solid var(--admin-border)',
            borderBottom: '1px solid var(--admin-border)',
          }}>
          <p className="font-body text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--admin-gold)' }}>
            Today's Word
          </p>
          <p className="font-display text-xl mb-2" style={{ color: 'var(--admin-text)' }}>
            {todayScripture.reference}
          </p>
          <p className="font-body text-sm italic leading-relaxed"
            style={{ color: 'var(--admin-text-muted)' }}>
            "{todayScripture.text}"
          </p>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-xs uppercase tracking-widest"
            style={{ color: 'var(--admin-text-muted)' }}>
            Recent Activity
          </p>
        </div>
        <div className="space-y-2">
          {activity.length === 0 ? (
            <p className="font-body text-sm" style={{ color: 'var(--admin-text-muted)' }}>
              No recent activity yet.
            </p>
          ) : (
            activity.map((item, i) => (
              <div key={i}
                className="flex items-center gap-3 p-3 border"
                style={{ borderColor: 'var(--admin-border)', background: 'white' }}>
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: item.type === 'gift' ? '#D4A847' : '#6B6560' }} />
                <p className="font-body text-sm flex-1" style={{ color: 'var(--admin-text)' }}>
                  {item.label}
                </p>
                <p className="font-body text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                  {formatDistanceToNow(item.time, { addSuffix: true })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

---

### TASK 19 — Apply Light Admin Theme to All Admin Components

Update every admin component to use admin CSS variables instead of dark theme classes:

**Pattern for all admin components:**
```typescript
// BEFORE (dark):
<div className="bg-black border border-white/10 text-white">

// AFTER (light admin):
<div style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}>
```

**Key admin components to update:**
- `AdminSidebar.tsx` — cream sidebar
- `AdminTopbar.tsx` — white topbar
- `FormCard.tsx` — white cards
- `FormBuilderEditor.tsx` — light inputs
- `SortableFieldCard.tsx` — light cards
- `PostCard.tsx` — light cards
- `BlogPostEditor.tsx` — light panels
- `ScriptureManager.tsx` — light panels
- `StudyManager.tsx` — light panels
- `GalleryManager.tsx` — light panels
- `CMSEditor.tsx` — light panels
- `IntegrationsManager.tsx` — light panels
- `FormEntriesTable.tsx` — light table
- Admin page files — light backgrounds

**For all admin inputs:**
```typescript
// Standard admin input class:
className="w-full border font-body text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors"
style={{
  background: 'var(--admin-surface)',
  borderColor: 'var(--admin-border)',
  color: 'var(--admin-text)',
}}
```

**For all admin buttons:**
```typescript
// Primary gold button:
className="px-5 py-2.5 font-body text-sm font-medium transition-colors"
style={{ background: 'var(--admin-gold)', color: 'white' }}

// Secondary outline button:
className="px-5 py-2.5 font-body text-sm border transition-colors"
style={{ borderColor: 'var(--admin-gold)', color: 'var(--admin-gold)' }}
```

---

## ═══════════════════════════════════════
## MODULE 5 — PAYMENT TEST/LIVE TOGGLE
## ═══════════════════════════════════════

### TASK 20 — Update Credential Schema

Update `src/lib/credentials.ts` — add `mode` to payment credentials:

```typescript
export interface PaystackCredentials {
  secretKey: string
  publicKey: string
  webhookSecret: string
  monthlyPlanCode: string
  annualPlanCode: string
  isActive: boolean
  mode: 'test' | 'live'  // ADD THIS
}

export interface FlutterwaveCredentials {
  secretKey: string
  publicKey: string
  webhookSecret: string
  monthlyPlanId: string
  annualPlanId: string
  isActive: boolean
  mode: 'test' | 'live'  // ADD THIS
}

export interface PayazaCredentials {
  secretKey: string
  publicKey: string
  isActive: boolean
  mode: 'test' | 'live'  // ADD THIS
}
```

---

### TASK 21 — Update IntegrationsManager with Test/Live Toggle

Update `src/components/admin/integrations/IntegrationsManager.tsx`:

Add a `TEST | LIVE` mode toggle to Paystack, Flutterwave, and Payaza service cards.

For each payment gateway card, add below the active toggle:

```typescript
// Add mode field to payment service configs
const PAYMENT_SERVICE_IDS = ['paystack', 'flutterwave', 'payaza']

// In the card header, add mode toggle for payment services:
{PAYMENT_SERVICE_IDS.includes(service.id) && (
  <div className="flex items-center gap-1 mr-2">
    <button
      onClick={() => updateValue(service.id, 'mode', 'test')}
      className={cn(
        'px-2.5 py-1 text-[10px] font-body font-medium tracking-widest transition-all',
        values[service.id]?.mode !== 'live'
          ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/40'
          : 'text-admin-text-muted border border-admin-border'
      )}
      style={{
        background: values[service.id]?.mode !== 'live' ? 'rgba(234,179,8,0.15)' : 'transparent',
        color: values[service.id]?.mode !== 'live' ? '#CA8A04' : 'var(--admin-text-muted)',
        borderColor: values[service.id]?.mode !== 'live' ? 'rgba(234,179,8,0.4)' : 'var(--admin-border)',
      }}
    >
      TEST
    </button>
    <button
      onClick={() => updateValue(service.id, 'mode', 'live')}
      className="px-2.5 py-1 text-[10px] font-body font-medium tracking-widest transition-all"
      style={{
        background: values[service.id]?.mode === 'live' ? 'rgba(34,197,94,0.15)' : 'transparent',
        color: values[service.id]?.mode === 'live' ? '#16A34A' : 'var(--admin-text-muted)',
        borderColor: values[service.id]?.mode === 'live' ? 'rgba(34,197,94,0.4)' : 'var(--admin-border)',
        border: '1px solid',
      }}
    >
      LIVE
    </button>
  </div>
)}
```

Default mode to `'test'` when creating new credentials.

---

### TASK 22 — Test Mode Warning on Partner Page

Update `src/app/(public)/partner/page.tsx` to check if any active gateway is in test mode:

```typescript
const isTestMode =
  (paystack?.isActive && paystack?.mode === 'test') ||
  (flutterwave?.isActive && flutterwave?.mode === 'test') ||
  (payaza?.isActive && payaza?.mode === 'test')

// Pass to client:
<PartnershipClientPage
  ...
  isTestMode={isTestMode}
/>
```

Update `PartnershipClientPage` to show a warning banner when `isTestMode` is true:

```typescript
{isTestMode && (
  <div className="bg-yellow-500/10 border border-yellow-500/30 px-6 py-3 text-center">
    <p className="text-yellow-600 font-body text-sm">
      ⚠️ Payment gateways are in <strong>TEST MODE</strong> — no real charges will be made.
      Admin: switch to Live mode in Integrations when ready.
    </p>
  </div>
)}
```

---

## PHASE 9 COMPLETION CHECKLIST

**Design System**
- [ ] Clash Display + General Sans fonts loading from Fontshare
- [ ] CSS variables resolving correctly in dark and light mode
- [ ] Tailwind config updated with new tokens
- [ ] `bg-bg`, `bg-surface`, `text-text-primary` etc. working across all pages

**Dark/Light Mode**
- [ ] `next-themes` ThemeProvider wrapping the app
- [ ] Theme toggle in Navbar — sun/moon animation works
- [ ] Dark mode (default): charcoal `#141414` backgrounds
- [ ] Light mode: warm cream `#F5F0E8` backgrounds
- [ ] Smooth transition between modes
- [ ] Theme persists on page refresh

**Public Site Redesign**
- [ ] Hero has bold asymmetric layout with outlined text effect
- [ ] Vision section has oversized section number
- [ ] CTA section is gold background with dark text (inverted)
- [ ] Footer stays dark in both modes
- [ ] All pages use theme-aware classes

**Admin Dashboard**
- [ ] Admin is always light — does not follow public theme
- [ ] Sidebar is warm cream with grouped nav items
- [ ] Dashboard home shows all 6 stat cards
- [ ] Quick actions row working
- [ ] Today's scripture card showing
- [ ] Recent activity feed populated
- [ ] All admin inputs/buttons use admin CSS variables

**Payment Test/Live**
- [ ] TEST | LIVE toggle on Paystack, Flutterwave, Payaza cards
- [ ] Mode saves correctly with other credentials
- [ ] Yellow test mode banner on public Partner page when any gateway is in test mode

**General**
- [ ] `npm run build` completes without errors
- [ ] No hydration errors from theme switching
- [ ] Mobile responsive in both themes

---

## NOTES FOR CURSOR

- `suppressHydrationWarning` on `<html>` is **required** when using `next-themes` — without it you'll get hydration mismatch errors from the theme class being applied server vs client.
- Fontshare fonts are loaded via `<link>` in the `<head>` — not via `next/font`. This means no font variable CSS — reference them directly as `'Clash Display'` and `'General Sans'` in the Tailwind config fontFamily.
- The admin layout (`src/app/admin/(dashboard)/layout.tsx`) should add `className="admin-layout"` to its wrapper div so admin CSS variables apply only within the admin routes.
- The footer intentionally stays dark in light mode — it has hardcoded charcoal background, not `bg-bg`. This is a deliberate design decision.
- The CTA section (gold background) also ignores the theme — it always has a gold background. These two sections are "theme-immune" by design.
- When updating admin components, use inline `style` prop with CSS variables rather than Tailwind classes — this keeps admin styles decoupled from the public site theme system.
- `next-themes` default theme is `'dark'` — users who have never visited get the dark charcoal experience. Their preference is then stored in `localStorage` and respected on return visits.
- The `mode` field defaults to `'test'` in credentials — this is intentional. No admin should accidentally go live without explicitly switching to live mode.
