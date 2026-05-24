# ROOM FOR YOU — Phase 40 Cursor Prompt
## Full Public Site Redesign — Antonio Font · Red System · Stats CMS · Theme Toggle

---

## CONTEXT

Redesign the public site visual layer to match the provided HTML concept (`doc/rfy-global.html`). Keep all existing functionality, admin wiring, CMS, and backend. Only replace the visual/design layer.

**Dark mode (default):** Black `#000000`, bright red `#E8001C`, Antonio display font
**Light mode (toggle):** Warm cream `#FAF5EE`, deep crimson `#8B0000`, same Antonio font — a dignified inverse

**What to take from the HTML:**
- Antonio + Inter font pairing
- Color system and CSS tokens
- Diagonal red accent panel in hero area
- Custom cursor (red dot + lagging ring, desktop only)
- Marquee/scrolling red band
- Card designs (4 community cards)
- Counter stats section (wired to admin CMS)
- CTA band layout
- Footer layout
- Button styles (shimmer sweep on primary)
- Scroll reveal animations

**What to keep from current site:**
- Hero section layout and content (current arrangement — just update colors/fonts)
- Confession section with current staggered reveal — DO NOT CHANGE
- Theme toggle button
- ALL admin/CMS wiring — every piece of content must still come from CMS

**What NOT to include from HTML:**
- NO grain overlay
- NOT the HTML stats numbers — stats come from admin CMS

---

## TASK 1 — Install Antonio Font

Open `src/app/layout.tsx` or `src/app/(public)/layout.tsx`.

Add Antonio from Google Fonts. Add to `globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Antonio:wght@100;300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-antonio: 'Antonio', sans-serif;
  --font-inter: 'Inter', sans-serif;
}
```

Update `tailwind.config.ts`:
```typescript
fontFamily: {
  display: ['Antonio', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
}
```

---

## TASK 2 — CSS Color System

Open `src/app/globals.css`. Replace public site color variables:

```css
/* ── DARK MODE (default) ── */
:root,
[data-public-theme="dark"] {
  --color-bg: #000000;
  --color-surface: #111111;
  --color-surface-2: #1A1A1A;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-strong: rgba(255, 255, 255, 0.12);
  --color-text-primary: #FFFFFF;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-muted: rgba(255, 255, 255, 0.35);
  --color-text-inverse: #000000;
  --color-accent: #E8001C;
  --color-accent-hover: #C0001A;
  --color-accent-light: rgba(232, 0, 28, 0.08);
  --color-accent-border: rgba(232, 0, 28, 0.3);
  --color-accent-glow: rgba(232, 0, 28, 0.4);
  --color-hero-bg: #000000;
  --color-footer-bg: #111111;
  --color-strip-bg: #E8001C;
  --color-strip-text: #FFFFFF;
  --glass: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}

/* ── LIGHT MODE ── */
[data-public-theme="light"] {
  --color-bg: #FAF5EE;
  --color-surface: #F2EBE0;
  --color-surface-2: #E8DDD0;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.15);
  --color-text-primary: #111111;
  --color-text-secondary: rgba(0, 0, 0, 0.65);
  --color-text-muted: rgba(0, 0, 0, 0.4);
  --color-text-inverse: #FAF5EE;
  --color-accent: #8B0000;
  --color-accent-hover: #6B0000;
  --color-accent-light: rgba(139, 0, 0, 0.06);
  --color-accent-border: rgba(139, 0, 0, 0.2);
  --color-accent-glow: rgba(139, 0, 0, 0.2);
  /* Hero and footer always dark */
  --color-hero-bg: #111111;
  --color-footer-bg: #111111;
  --color-strip-bg: #8B0000;
  --color-strip-text: #FAF5EE;
  --glass: rgba(0, 0, 0, 0.04);
  --glass-border: rgba(0, 0, 0, 0.08);
}
```

---

## TASK 3 — Theme Provider

Update theme system:
- **Default: dark**
- localStorage key: `rfy-public-theme`
- Inline script in `<head>` prevents flash:

```typescript
<script dangerouslySetInnerHTML={{
  __html: `(function(){var t=localStorage.getItem('rfy-public-theme')||'dark';document.documentElement.setAttribute('data-public-theme',t);})()`,
}} />
```

Toggle button: sun icon in dark mode, moon icon in light mode.
Set `data-public-theme` on `document.documentElement`.

---

## TASK 4 — Custom Cursor (Desktop Only)

Create `src/components/layout/PublicCursor.tsx`:

```typescript
'use client'
import { useEffect, useRef } from 'react'

export function PublicCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only on desktop
    if (window.innerWidth < 1024) return

    let mx = 0, my = 0, rx = 0, ry = 0
    let frame: number

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = mx + 'px'
        dotRef.current.style.top = my + 'px'
      }
    }

    const animate = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px'
        ringRef.current.style.top = ry + 'px'
      }
      frame = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove)
    frame = requestAnimationFrame(animate)

    const grow = () => {
      if (dotRef.current) { dotRef.current.style.width = '20px'; dotRef.current.style.height = '20px' }
      if (ringRef.current) { ringRef.current.style.width = '56px'; ringRef.current.style.height = '56px' }
    }
    const shrink = () => {
      if (dotRef.current) { dotRef.current.style.width = '12px'; dotRef.current.style.height = '12px' }
      if (ringRef.current) { ringRef.current.style.width = '36px'; ringRef.current.style.height = '36px' }
    }

    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', grow)
      el.addEventListener('mouseleave', shrink)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} style={{
        position: 'fixed', width: '12px', height: '12px',
        background: 'var(--color-accent)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        transform: 'translate(-50%,-50%)',
        transition: 'width 0.3s, height 0.3s',
        mixBlendMode: 'difference',
      }} />
      <div ref={ringRef} style={{
        position: 'fixed', width: '36px', height: '36px',
        border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9998,
        transform: 'translate(-50%,-50%)',
        transition: 'width 0.3s, height 0.3s',
      }} />
    </>
  )
}
```

Add to public layout. In globals.css:
```css
@media (min-width: 1024px) {
  .public-site * { cursor: none !important; }
}
```

---

## TASK 5 — Marquee Band

Update the scripture strip to a full marquee band:

```css
@keyframes marquee {
  from { transform: translateX(0) }
  to { transform: translateX(-50%) }
}
```

```typescript
<div style={{
  background: 'var(--color-strip-bg)',
  padding: '0.9rem 0', overflow: 'hidden',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
}}>
  <div style={{
    display: 'flex', whiteSpace: 'nowrap',
    animation: 'marquee 28s linear infinite',
  }}>
    {[0, 1].map(i => (
      <div key={i} style={{ display: 'flex', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'var(--font-antonio)',
          fontSize: '0.9rem', fontWeight: 500,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--color-strip-text)', padding: '0 2.5rem',
        }}>{scriptureText}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '0 1rem' }}>✦</span>
      </div>
    ))}
  </div>
</div>
```

---

## TASK 6 — Hero Updates (Keep Layout, Update Visuals)

Keep current hero layout and CMS content. Update visuals only:

**Hero background:**
```typescript
style={{ background: `
  radial-gradient(ellipse 70% 60% at 70% 40%, rgba(232,0,28,0.18) 0%, transparent 60%),
  radial-gradient(ellipse 50% 50% at 20% 80%, rgba(10,22,40,0.9) 0%, transparent 60%),
  linear-gradient(160deg, #1C1C1C 0%, #0a0000 60%, #0A1628 100%)
` }}
```

**Diagonal red panel (absolute positioned inside hero):**
```typescript
// Panel:
<div style={{
  position: 'absolute', top: 0, right: 0,
  width: '42vw', height: '100%',
  background: 'linear-gradient(180deg, #E8001C 0%, #FF4500 100%)',
  clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
  opacity: 0.07, zIndex: 1, pointerEvents: 'none',
}} />
// Thin line:
<div style={{
  position: 'absolute', top: 0,
  right: 'calc(42vw - 3.24vw - 2px)',
  width: '3px', height: '100%',
  background: 'linear-gradient(180deg, transparent, #E8001C, #FF4500, transparent)',
  opacity: 0.6, zIndex: 2, pointerEvents: 'none',
}} />
```

**Hero typography:**
- Font: Antonio
- "THERE IS": `color: rgba(248,248,248,0.25)`
- "ROOM": `color: transparent; WebkitTextStroke: '2px var(--color-accent)'`
- "FOR YOU.": `color: #FFFFFF`
- Size: `clamp(5rem, 14vw, 14rem)`, weight 700, `text-transform: uppercase`, `letter-spacing: -0.02em`

**Primary button (shimmer):**
```css
.btn-primary {
  background: var(--color-accent);
  color: white;
  padding: 0.85rem 2.2rem;
  font-family: var(--font-antonio);
  font-size: 1rem; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  position: relative; overflow: hidden;
  transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
}
.btn-primary::after {
  content: ''; position: absolute; inset: 0;
  background: rgba(255,255,255,0.12);
  transform: translateX(-100%) skewX(-15deg);
  transition: transform 0.4s;
}
.btn-primary:hover::after { transform: translateX(110%) skewX(-15deg) }
.btn-primary:hover { box-shadow: 0 8px 32px var(--color-accent-glow); transform: translateY(-2px) }
```

**Hero scroll indicator (bottom center):**
```typescript
<div style={{
  position: 'absolute', bottom: '2.5rem', left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
}}>
  <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Scroll</span>
  <div style={{ width: '1px', height: '48px', background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)', animation: 'scroll-pulse 2s ease-in-out infinite' }} />
</div>
```

```css
@keyframes scroll-pulse {
  0%, 100% { opacity: 0.4 }
  50% { opacity: 1 }
}
```

---

## TASK 7 — Stats Section (CMS Wired)

Add stats section between hero and vision. Wire to admin CMS.

**Add CMS keys** to `src/lib/content.ts` defaults:
```typescript
'stats.stat1.number': '100',
'stats.stat1.suffix': 'M+',
'stats.stat1.label': 'Streams',
'stats.stat2.number': '600',
'stats.stat2.suffix': 'K+',
'stats.stat2.label': 'Followers',
'stats.stat3.number': '5',
'stats.stat3.suffix': '+',
'stats.stat3.label': 'Years',
'stats.stat4.number': '24',
'stats.stat4.suffix': '+',
'stats.stat4.label': 'Gatherings',
```

**Add stats editor to admin CMS** under the landing section.

**Stats UI:**
```typescript
// 4-column grid, Antonio numbers, accent suffix, animated count-up on scroll
// Number: Antonio, clamp(3rem, 6vw, 5rem), weight 700
// Suffix: color var(--color-accent)
// Label: Inter, 0.75rem, 0.2em tracking, uppercase, muted color
```

Use IntersectionObserver to trigger count animation when stats enter viewport.

---

## TASK 8 — Community Cards

Update the 4 cards to match HTML style:

```typescript
// Card: border, background var(--color-surface), 2.5rem padding, relative overflow hidden
// On hover: translateY(-4px), border-color var(--color-accent)

// Card number: Antonio 3.5rem, color var(--color-border-strong) → on hover rgba(232,0,28,0.2)
// Card title: Antonio 1.4rem, uppercase, 0.05em spacing → on hover var(--color-accent)
// Card desc: Inter, 0.9rem, secondary color

// Card bar (bottom): absolute, 3px height, full width, accent color
// Default: scaleX(0), transform-origin left
// Hover: scaleX(1), transition 0.4s ease
```

---

## TASK 9 — CTA Band

Two-column layout. Left: small label + large Antonio heading. Right: white button + dark button.

CTA background: `var(--color-accent)` (red in dark, crimson in light).
Heading: Antonio, `clamp(3rem, 7vw, 6rem)`, white, uppercase.
Label: Inter, 0.7rem, 0.25em tracking, `rgba(255,255,255,0.6)`.
Content comes from CMS.

---

## TASK 10 — Footer

Always dark `#111111` in both themes. 4-column grid.

Top: thin accent line `linear-gradient(90deg, var(--color-accent), transparent)`.

Columns: Brand | Community | Resources | Organisation.

Brand: Antonio logo name, Inter description from CMS, social icons.

Column headings: Antonio, 0.85rem, 0.15em tracking, uppercase.
Links: Inter, 0.875rem, `rgba(255,255,255,0.55)`, hover white.

Bottom bar: copyright left, Privacy/Cookies/Refund links right.

---

## TASK 11 — Scroll Reveal

```css
.reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease, transform 0.7s ease }
.reveal-left { opacity: 0; transform: translateX(-40px); transition: opacity 0.7s ease, transform 0.7s ease }
.reveal-right { opacity: 0; transform: translateX(40px); transition: opacity 0.7s ease, transform 0.7s ease }
.reveal.visible, .reveal-left.visible, .reveal-right.visible { opacity: 1; transform: translate(0) }
```

Use IntersectionObserver (threshold 0.15) to add `.visible` class on scroll.

---

## TASK 12 — Navbar

- Scrolled dark: `rgba(0,0,0,0.85)`, `blur(18px)`, `border-bottom: 1px solid rgba(255,255,255,0.06)`
- Scrolled light: `rgba(250,245,238,0.9)`, `blur(18px)`, `border-bottom: 1px solid rgba(0,0,0,0.06)`
- Join Us: accent background, white text, Antonio
- Nav links: Inter, 0.75rem, uppercase, 0.12em tracking
- Logo: dark mode → white logo, light mode → dark logo

---

## TASK 13 — Typography Across Public Pages

Apply Antonio to all display headings on public pages:
```css
.public-site h1,
.public-site h2,
.public-site .font-display {
  font-family: var(--font-antonio);
  letter-spacing: -0.01em;
}
```

Inter for all body text.

---

## COMPLETION CHECKLIST

- [ ] Antonio font loaded and applied to display headings
- [ ] Dark mode: `#000000` bg, `#E8001C` accent
- [ ] Light mode: `#FAF5EE` bg, `#8B0000` accent
- [ ] Dark is default; toggle switches modes; no flash on load
- [ ] Custom cursor on desktop only (dot + ring)
- [ ] Diagonal red panel in hero
- [ ] "ROOM" outlined with red stroke
- [ ] Shimmer on primary buttons
- [ ] Scroll indicator in hero
- [ ] Marquee band replacing scripture strip
- [ ] Stats section: 4 CMS-driven stats with count animation
- [ ] Stats editable in `/admin/cms`
- [ ] Cards: Antonio number/title, red bar on hover
- [ ] CTA band: two-column, Antonio heading
- [ ] Footer: always dark, 4-column, accent top line
- [ ] Scroll reveal on all sections
- [ ] NO grain overlay
- [ ] Confession section UNCHANGED
- [ ] Admin dashboard UNCHANGED
- [ ] All CMS wiring INTACT
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Reference file: `doc/rfy-global.html` — read the CSS carefully for exact values
- NO grain overlay — deliberately excluded
- Confession section: keep exactly as it is — only update colors to use CSS variables
- The diagonal panel uses exactly: `clip-path: polygon(18% 0, 100% 0, 100% 100%, 0% 100%)`
- Custom cursor `mix-blend-mode: difference` inverts against any background automatically
- Mobile: `cursor: auto` — custom cursor is desktop only
- Stats come from CMS, not hardcoded numbers
- Footer is always dark (`#111111`) in both light and dark mode — hero too
- In light mode, "ROOM" outlined stroke changes to `#8B0000` (crimson) since bright red on cream works better at that weight
- Admin CSS variables (`--a-gold`, `--a-surface` etc.) must remain completely untouched
