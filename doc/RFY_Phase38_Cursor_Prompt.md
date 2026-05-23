# ROOM FOR YOU — Phase 38 Cursor Prompt
## Light Mode Default · Warm Cream · Crimson Accents · Dark Mode Toggle

---

## CONTEXT

Redesign the public site to use a **warm cream light mode as default**, with deep crimson accents. Dark mode (toggled by the existing moon/sun button) becomes the dark cinematic experience.

**Light mode (default):**
- Background: `#FAF7F2` (warm cream)
- Surface: `#F0EBE3` (slightly darker cream for cards/sections)
- Text primary: `#1A1A1A` (deep charcoal)
- Text secondary: `#4A4A4A`
- Text muted: `#8A8A8A`
- Accent: `#8B0000` (deep crimson)
- Accent hover: `#A00000`
- Border: `rgba(0,0,0,0.08)`

**Dark mode:**
- Background: `#0F0F0F`
- Surface: `#141414`
- Text primary: `#F8F8F8`
- Text secondary: `#A0A0A0`
- Text muted: `#585858`
- Accent: `#C0392B` (brighter crimson — more visible on dark)
- Accent hover: `#E74C3C`
- Border: `rgba(255,255,255,0.08)`

---

## TASK 1 — Update CSS Variables

Open `src/app/globals.css`.

Replace the current color variable system with a full light/dark mode system:

```css
/* ── PUBLIC SITE — LIGHT MODE (default) ── */
:root,
.public-light {
  --color-bg: #FAF7F2;
  --color-surface: #F0EBE3;
  --color-surface-2: #E8E0D4;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.15);

  --color-text-primary: #1A1A1A;
  --color-text-secondary: #4A4A4A;
  --color-text-muted: #8A8A8A;
  --color-text-inverse: #FAF7F2;

  --color-accent: #8B0000;
  --color-accent-bright: #A00000;
  --color-accent-dim: #6B0000;
  --color-accent-light: rgba(139, 0, 0, 0.06);
  --color-accent-border: rgba(139, 0, 0, 0.25);
  --color-accent-glow: rgba(139, 0, 0, 0.12);

  /* Hero specific */
  --color-hero-bg: #1A1A1A;
  --color-hero-text: #FAF7F2;

  /* Scripture strip */
  --color-strip-bg: #8B0000;
  --color-strip-text: #FAF7F2;
}

/* ── PUBLIC SITE — DARK MODE ── */
.public-dark,
[data-theme="dark"] .public-site {
  --color-bg: #0F0F0F;
  --color-surface: #141414;
  --color-surface-2: #1A1A1A;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.15);

  --color-text-primary: #F8F8F8;
  --color-text-secondary: #A0A0A0;
  --color-text-muted: #585858;
  --color-text-inverse: #0F0F0F;

  --color-accent: #C0392B;
  --color-accent-bright: #E74C3C;
  --color-accent-dim: #922B21;
  --color-accent-light: rgba(192, 57, 43, 0.08);
  --color-accent-border: rgba(192, 57, 43, 0.3);
  --color-accent-glow: rgba(192, 57, 43, 0.15);

  /* Hero specific — stays dark even in dark mode */
  --color-hero-bg: #0F0F0F;
  --color-hero-text: #F8F8F8;

  /* Scripture strip */
  --color-strip-bg: #C0392B;
  --color-strip-text: #F8F8F8;
}
```

---

## TASK 2 — Update Theme Provider / Toggle

Open the public site theme system — check `src/app/(public)/layout.tsx` and the theme toggle in `src/components/layout/Navbar.tsx`.

The current toggle switches between light/dark. Update so:

1. **Default** is light mode (`public-light` class on the root element)
2. **Toggle** switches to dark mode (`public-dark` class)
3. **localStorage key**: `rfy-public-theme` (separate from admin theme `rfy-admin-theme`)
4. The toggle button: sun icon in dark mode, moon icon in light mode

Update the theme initialization script in `src/app/(public)/layout.tsx`:

```typescript
// In the <head> or at top of body — prevents flash of wrong theme:
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      var saved = localStorage.getItem('rfy-public-theme');
      var theme = saved === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-public-theme', theme);
    })()
  `
}} />
```

Update the root `html` element to apply the theme class:

```typescript
// In public layout, apply theme-aware class:
// The Navbar ThemeProvider handles this client-side
// Default HTML should not have a dark class — light is default
```

---

## TASK 3 — Update Public Layout

Open `src/app/(public)/layout.tsx`.

The public layout body/root should apply the correct theme class:

```typescript
// Wrap public content with theme-aware div:
<div 
  id="public-site-root"
  className="public-site"
  style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', minHeight: '100vh' }}
>
  {children}
</div>
```

The theme toggle in Navbar should toggle `data-public-theme` on `#public-site-root` or `document.documentElement`, and add/remove the `public-dark` class.

---

## TASK 4 — Update Navbar for Light Mode

Open `src/components/layout/Navbar.tsx`.

In light mode, the navbar needs to work on a light background:

```typescript
// Navbar background when scrolled (light mode):
// Scrolled: white/cream with shadow
// Top of page: transparent

// Light mode navbar text: dark (#1A1A1A)
// Dark mode navbar text: light (#F8F8F8)

// Join Us button:
// Light mode: crimson border (#8B0000), crimson text, fill on hover
// Dark mode: crimson border (#C0392B), crimson text, fill on hover

// Hamburger menu:
// Light mode: dark icon
// Dark mode: light icon
```

The logo:
- Light mode: use `/images/logo-dark.png` (dark logo on light background)
- Dark mode: use `/images/logo-white.png` (white logo on dark background)

The navbar scrolled state:
```typescript
// Light mode scrolled:
background: 'rgba(250,247,242,0.95)'
backdropFilter: 'blur(12px)'
borderBottom: '1px solid rgba(0,0,0,0.08)'

// Dark mode scrolled:
background: 'rgba(15,15,15,0.95)'
backdropFilter: 'blur(12px)'
borderBottom: '1px solid rgba(255,255,255,0.08)'
```

---

## TASK 5 — Update Hero Section

Open the Hero component.

The hero section should **always be dark** regardless of light/dark mode — it's the cinematic opening. Use `var(--color-hero-bg)` and `var(--color-hero-text)`.

```typescript
// Hero section — always dark, cinematic:
<section
  style={{
    background: '#1A1A1A',  // Dark even in light mode
    color: '#FAF7F2',
    // ... rest of styles
  }}
>
```

This creates a striking contrast — the dark hero immediately gives way to the warm cream sections below, which feels intentional and editorial.

---

## TASK 6 — Update Content Sections for Light Mode

All sections below the hero need to work in light mode. Update:

**Vision section:**
```typescript
style={{ background: 'var(--color-bg)' }}
// Text: var(--color-text-primary) for headings
// Body text: var(--color-text-secondary)
```

**Confession section:**
```typescript
// Light mode: cream background, dark text with varying opacity
// Dark mode: dark background, light text with varying opacity
style={{ background: 'var(--color-surface)' }}
```

**Shepherd section:**
```typescript
style={{ background: 'var(--color-bg)' }}
// Quote text: var(--color-text-primary)
// Minister Yadah name: var(--color-accent)
```

**Community highlights (4 cards):**
```typescript
// Card background: var(--color-surface)
// Card border: var(--color-border)
// Number: var(--color-border-strong)
// Hover border: var(--color-accent)
// Hover heading: var(--color-accent)
```

**CTA section:**
```typescript
// Always crimson background — works in both modes
style={{ background: 'var(--color-accent)' }}
// Text: white (#FAF7F2)
// Button: dark background, white text
```

---

## TASK 7 — Update Footer

Open `src/components/layout/Footer.tsx`.

Footer should use theme-aware colors:

```typescript
// Light mode footer:
style={{
  background: '#1A1A1A',  // Dark footer on light page — intentional contrast
  color: '#F8F8F8',
  borderTop: '1px solid rgba(255,255,255,0.08)',
}}

// The footer stays dark in both modes — it's a consistent anchor
// Only the top border line changes to crimson (using var(--color-accent))
```

---

## TASK 8 — Update All Public Pages

For all other public pages (`/about`, `/events`, `/gallery`, `/blog`, `/word`, `/study`, `/prayer`, `/testimonies`, `/partner`, `/contact`, `/faq`, `/join`):

Replace hardcoded colors with CSS variables:

```typescript
// Section backgrounds:
style={{ background: 'var(--color-bg)' }}           // main sections
style={{ background: 'var(--color-surface)' }}       // card/alternate sections

// Text:
style={{ color: 'var(--color-text-primary)' }}       // headings
style={{ color: 'var(--color-text-secondary)' }}     // body text
style={{ color: 'var(--color-text-muted)' }}         // labels, captions

// Accents:
style={{ color: 'var(--color-accent)' }}             // accent text
style={{ borderColor: 'var(--color-accent)' }}       // accent borders
style={{ background: 'var(--color-accent)' }}        // accent backgrounds

// Borders:
style={{ borderColor: 'var(--color-border)' }}       // subtle borders
```

**Input fields in light mode** (forms, contact, join, prayer):
```typescript
style={{
  background: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-primary)',
}}
onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
```

---

## TASK 9 — Update Chat Widget

Open `src/components/chat/ChatWidget.tsx`.

The chat window background should adapt:

```typescript
// Chat window:
style={{
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  // ...
}}

// Chat header stays crimson always:
style={{ background: 'var(--color-accent)' }}

// Admin message bubbles:
style={{
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
}}

// Visitor message bubbles:
style={{ background: 'var(--color-accent)', color: '#FAF7F2' }}
```

---

## TASK 10 — Update Reply Page

Open `src/app/(public)/reply/[token]/page.tsx`.

The reply page should also adapt to the theme system — use CSS variables instead of hardcoded `#0F0F0F` and `#F8F8F8`.

---

## TASK 11 — SEO and OG Updates

Open `src/lib/seo.ts` and `src/app/og/route.tsx`.

Update the OG image route to use crimson instead of gold:
```typescript
// In OG image:
background: 'linear-gradient(90deg, #8B0000, #A00000, #8B0000)'  // crimson instead of gold
// Gold top border → crimson
```

---

## COMPLETION CHECKLIST

**CSS Variables**
- [ ] Light mode variables set: cream bg, dark text, crimson accent
- [ ] Dark mode variables set: dark bg, light text, brighter crimson accent
- [ ] Theme toggle works: switches between modes
- [ ] No flash of wrong theme on page load
- [ ] localStorage key `rfy-public-theme` persists preference

**Navbar**
- [ ] Light mode: dark text, cream scrolled background, dark logo
- [ ] Dark mode: light text, dark scrolled background, white logo
- [ ] Join Us button: crimson in both modes (different shades)
- [ ] Theme toggle button visible in both modes

**Hero**
- [ ] Always dark/cinematic regardless of mode
- [ ] Creates intentional contrast with the cream sections below

**Content Sections**
- [ ] Vision, Confession, Shepherd, Cards use CSS variables
- [ ] Look correct in BOTH light and dark mode
- [ ] CTA section stays crimson in both modes

**Footer**
- [ ] Always dark — consistent anchor in both modes

**All Public Pages**
- [ ] Form inputs work in light mode (visible text, visible borders)
- [ ] Cards and surfaces visible in light mode
- [ ] Accent elements (crimson) visible in both modes

**Chat Widget**
- [ ] Adapts to theme mode
- [ ] Header always crimson

**Build**
- [ ] `npm run build` passes
- [ ] No hardcoded `#0F0F0F` or `#F8F8F8` in public components (use CSS vars)
- [ ] Admin dashboard completely unchanged

---

## NOTES FOR CURSOR

- The hero being always dark is intentional — it's the cinematic opening that immediately establishes the weight of the ministry. Visitors enter through darkness, then emerge into the warm cream. This is a deliberate design choice.
- The footer being always dark creates bookends — dark hero opens, dark footer closes. The warm cream content lives between them.
- Crimson `#8B0000` on cream `#FAF7F2` has excellent contrast (well above WCAG AA). It's a classic color combination used in liturgical design, choir robes, and church architecture.
- The brighter crimson `#C0392B` for dark mode is necessary — `#8B0000` on `#0F0F0F` is too dark-on-dark to read well, as you noticed.
- The admin dashboard uses a completely separate CSS variable system (`--a-gold`, `--a-surface`, etc.) and must not be touched.
- Test the theme toggle carefully — when switching from light to dark, ALL sections should update, not just some.
- The `localStorage` key `rfy-public-theme` should default to `'light'` if not set.
