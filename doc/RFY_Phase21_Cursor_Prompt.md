# ROOM FOR YOU — Phase 21 Cursor Prompt
## Public Site Light Mode Fixes

---

## CONTEXT

The public site has a dark/light mode toggle. Dark mode looks correct. Light mode has contrast and visibility issues on several pages. This prompt fixes all light mode issues across the public site.

**Pages with issues:**
1. Landing page — hero text, confession section, shepherd section
2. About page — "We Declare" section, shepherd section blank
3. Events listing — event card titles invisible

**Pages that look good already — leave unchanged:**
- Blog ✅, Study ✅, Word ✅, Partner ✅
- Gallery — intentionally stays dark (cinematic design)
- Footer — always dark (intentional)
- CTA section — gold background unchanged

**Root cause:** Components use hardcoded dark color values (`text-snow`, `#F8F8F8`, `rgba(248,248,248,...)`) instead of CSS variable tokens that respond to theme.

---

## TASK 1 — Global CSS Light Mode Overrides

Open `src/app/globals.css`. Add at the very end:

```css
/* ══════════════════════════════════════════════
   LIGHT MODE — Public site overrides
   Fixes components using hardcoded dark colors
══════════════════════════════════════════════ */

.light .bg-void { background-color: #F5F0E8 !important; }
.light .bg-ink  { background-color: #EDE7DB !important; }
.light .bg-smoke { background-color: #E5DFD4 !important; }

.light .text-snow { color: #0F0C08 !important; }
.light .text-mist { color: #3D3530 !important; }
.light .text-fog  { color: #7A7066 !important; }

.light .text-outline {
  color: transparent !important;
  -webkit-text-stroke: 1px rgba(15,12,8,0.35) !important;
}
.light .text-outline-gold {
  color: transparent !important;
  -webkit-text-stroke: 1px rgba(139,90,0,0.5) !important;
}

/* Section dividers */
.light .section-divider {
  background: linear-gradient(90deg, transparent, #8B5A00, transparent);
  opacity: 0.3;
}
```

---

## TASK 2 — Fix Hero Section

Open `src/components/landing/Hero.tsx`.

Add `useTheme` hook and make the hero theme-aware:

```typescript
'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function Hero() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  
  const isDark = !mounted || resolvedTheme === 'dark'

  // Background orb
  // style={{ background: isDark
  //   ? 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)'
  //   : 'radial-gradient(circle, rgba(139,90,0,0.05) 0%, transparent 70%)' }}

  // "THERE IS" — outlined text
  // className={isDark ? 'text-outline' : 'text-outline-gold'}
  // (text-outline and text-outline-gold already defined — just switch class)

  // "FOR YOU." — solid text
  // style={{ color: isDark ? '#F8F8F8' : '#0F0C08' }}

  // Subtext paragraph
  // style={{ color: isDark ? '#A0A0A0' : '#3D3530' }}

  // Stat values
  // style={{ color: isDark ? '#F8F8F8' : '#0F0C08' }}

  // Stat labels — label-text class already handles via CSS var

  // Right side portrait overlay — keep as-is (portrait image works in both modes)

  // Scroll indicator line
  // style={{ background: isDark
  //   ? 'linear-gradient(to bottom, transparent, #C9A84C)'
  //   : 'linear-gradient(to bottom, transparent, #8B5A00)' }}
}
```

Apply these changes inline throughout the existing Hero component JSX.

---

## TASK 3 — Fix ConfessionReveal

Open `src/components/landing/ConfessionReveal.tsx`.

```typescript
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ConfessionReveal() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <section style={{ background: isDark ? '#1A1A1A' : '#EDE7DB' }}>

      {/* Each confession line */}
      {EXCERPT_LINES.map((line, i) => (
        <motion.p
          key={i}
          style={{
            fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
            lineHeight: '1.2',
            // Light: dark text with slight fade for older lines
            // Dark: white text with slight fade for older lines
            color: isDark
              ? `rgba(248,248,248,${Math.max(0.4, 0.85 - i * 0.08)})`
              : `rgba(15,12,8,${Math.max(0.5, 0.9 - i * 0.06)})`,
          }}
        >
          {line}
        </motion.p>
      ))}

      {/* Separator + CTA */}
      {/* gold-line class already adapts — keep as-is */}

      {/* Description text */}
      <p style={{ color: isDark ? '#A0A0A0' : '#5C5248' }}>
        This is the declaration of every member of Room For You.
      </p>

      {/* Link */}
      <Link href="/confession"
        style={{ color: '#8B5A00' }}  {/* gold works in both modes */}
      >
        Read the full confession →
      </Link>
    </section>
  )
}
```

---

## TASK 4 — Fix FromTheShepherd

Open `src/components/landing/FromTheShepherd.tsx`.

```typescript
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function FromTheShepherd({ content }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <section style={{ background: isDark ? '#0F0F0F' : '#E8E2D6', position: 'relative' }}>

      {/* Background image — show in both modes but adjust opacity */}
      {content['shepherd.portrait'] || content['shepherd.image'] ? (
        <div className="absolute inset-0">
          <Image
            src={content['shepherd.portrait'] || content['shepherd.image']}
            alt="Minister Yadah"
            fill
            className="object-cover object-top"
            style={{ opacity: isDark ? 0.2 : 0.08 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? 'linear-gradient(to right, #0F0F0F 0%, rgba(15,15,15,0.8) 60%, rgba(15,15,15,0.4) 100%)'
                : 'linear-gradient(to right, #E8E2D6 0%, rgba(232,226,214,0.8) 60%, rgba(232,226,214,0.4) 100%)',
            }}
          />
        </div>
      ) : null}

      <div className="relative z-10 ...">
        {/* Quote */}
        <blockquote
          style={{
            color: isDark ? '#F8F8F8' : '#0F0C08',
            fontSize: 'clamp(1.3rem, 3vw, 2.2rem)',
            lineHeight: '1.5',
            fontStyle: 'italic',
            fontFamily: 'Cormorant Garamond, serif',
          }}
        >
          "{content['shepherd.quote'] || 'There is room for you here.'}"
        </blockquote>

        {/* Name — gold works in both modes */}
        <p className="font-display text-2xl text-gold mb-1">
          {content['shepherd.name'] || 'Minister Yadah'}
        </p>

        {/* Title */}
        <p className="label-text mb-8"
          style={{ opacity: isDark ? 0.5 : 0.7 }}>
          {content['shepherd.title'] || 'Founder · Room For You'}
        </p>

        {/* Link — gold */}
        <Link href={content['shepherd.link'] || 'https://yadahworld.com'}
          className="font-body text-[11px] tracking-[0.2em] uppercase text-gold hover:opacity-70 transition-opacity">
          Visit yadahworld.com →
        </Link>
      </div>
    </section>
  )
}
```

---

## TASK 5 — Fix VisionSection

Open `src/components/landing/VisionSection.tsx`.

Replace hardcoded `text-snow` and `text-mist` with CSS variable approach:

```typescript
{/* Vision heading */}
<h2
  className="font-display leading-tight mb-8"
  style={{
    fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
    color: 'rgb(var(--color-text-primary))',
  }}
>

{/* Description text */}
<p
  className="font-body leading-relaxed text-lg max-w-md"
  style={{ color: 'rgb(var(--color-text-secondary))' }}
>

{/* Activity items */}
<p className="font-body text-sm leading-relaxed"
  style={{ color: 'rgb(var(--color-text-secondary))' }}>
  {item}
</p>

{/* Section background */}
<section style={{ background: 'rgb(var(--color-bg))' }}>
```

---

## TASK 6 — Fix CommunityHighlights

Open `src/components/landing/CommunityHighlights.tsx`.

```typescript
{/* Section background */}
<section style={{ background: 'rgb(var(--color-bg))' }}>

{/* Grid — use color-bg instead of bg-void */}
<div
  className="p-10 hover-lift group cursor-default"
  style={{ background: 'rgb(var(--color-bg))' }}
>
  {/* Number */}
  <p style={{ color: 'rgb(var(--color-border))' }}
    className="font-display text-6xl font-bold mb-8">

  {/* Title */}
  <h3 style={{ color: 'rgb(var(--color-text-primary))' }}
    className="font-display text-2xl mb-3 group-hover:text-gold transition-colors">

  {/* Description */}
  <p style={{ color: 'rgb(var(--color-text-secondary))' }}
    className="font-body text-sm leading-relaxed">
```

---

## TASK 7 — Fix ScriptureStrip

Open `src/components/landing/ScriptureStrip.tsx`.

```typescript
{/* Section */}
<section style={{ background: 'rgb(var(--color-surface))' }}>

{/* Scripture text */}
<blockquote
  style={{ color: 'rgb(var(--color-text-primary))' }}
  className="font-display text-xl lg:text-2xl italic leading-relaxed mb-10">

{/* Translation badge */}
<p style={{ color: 'rgb(var(--color-text-muted))' }}
  className="label-text mb-6 opacity-60">
```

---

## TASK 8 — Fix Events Listing Cards

Open `src/components/events/EventsClientPage.tsx`.

```typescript
{/* Card container */}
<div
  style={{
    borderColor: 'rgb(var(--color-border))',
    background: 'rgb(var(--color-bg))',
  }}
>

{/* Image area background */}
<div style={{ background: 'rgb(var(--color-surface))' }}>

{/* City label */}
<p style={{ color: 'rgb(var(--color-text-muted))' }}
  className="label-text opacity-40 mb-1.5">

{/* Event title */}
<h3 style={{ color: 'rgb(var(--color-text-primary))' }}
  className="font-display text-lg leading-tight group-hover:text-gold transition-colors mb-2">

{/* Time */}
<p style={{ color: 'rgb(var(--color-text-secondary))' }}
  className="font-body text-xs mb-2">

{/* Description */}
<p style={{ color: 'rgb(var(--color-text-secondary))' }}
  className="font-body text-xs leading-relaxed line-clamp-2">

{/* Filter tabs */}
<button style={{
  background: activeCity === city ? '#C9A84C' : 'transparent',
  color: activeCity === city ? '#0F0F0F' : 'rgb(var(--color-text-secondary))',
  borderColor: activeCity === city ? 'transparent' : 'rgb(var(--color-border))',
}}>
```

---

## TASK 9 — Fix About Page

Open the About page client component.

**"We Declare" / confession section:**
```typescript
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

// Inside component:
const { resolvedTheme } = useTheme()
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
const isDark = !mounted || resolvedTheme === 'dark'

{/* Confession/declaration text */}
<p style={{
  color: isDark ? 'rgba(248,248,248,0.7)' : '#2C2520',
  fontStyle: 'italic',
}}>
  {confessionText}
</p>

{/* Section background */}
<section style={{ background: isDark ? '#0F0F0F' : '#EDE7DB' }}>
```

**Shepherd section on About:**
Apply the same `isDark` pattern as Task 4.

**Vision/Mission text:**
```typescript
// Replace text-mist, text-fog classes with:
style={{ color: 'rgb(var(--color-text-secondary))' }}

// Replace text-snow classes with:
style={{ color: 'rgb(var(--color-text-primary))' }}
```

---

## PHASE 21 COMPLETION CHECKLIST

**Landing Page**
- [ ] Hero "THERE IS" visible in light mode (dark stroke)
- [ ] Hero "FOR YOU." dark text on cream
- [ ] Hero subtext and stats readable
- [ ] Scripture strip readable
- [ ] Vision section all text readable
- [ ] Confession lines clearly visible (dark text on cream)
- [ ] From the Shepherd quote and name readable
- [ ] Community highlights card text readable
- [ ] CTA gold section unchanged ✅

**Other Pages**
- [ ] About "We Declare" text visible
- [ ] About Shepherd section shows text
- [ ] Events cards show titles and details
- [ ] Blog ✅ unchanged
- [ ] Study ✅ unchanged
- [ ] Word ✅ unchanged
- [ ] Partner ✅ unchanged

**Non-changes (intentional)**
- [ ] Gallery stays dark in light mode ✅
- [ ] Footer stays dark ✅
- [ ] CTA section stays gold ✅
- [ ] Dark mode has zero regressions ✅

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Always use the `mounted` + `useEffect` pattern with `useTheme` to prevent hydration mismatch. Return the dark version before mount (`!mounted || resolvedTheme === 'dark'`).
- The CSS variable approach (`rgb(var(--color-text-primary))`) is preferable to `useTheme` checks because it's simpler and has no hydration issues. Use it for text, backgrounds, and borders wherever possible.
- `useTheme` conditional rendering is needed only for cases where the structural layout changes between modes (like the shepherd section background treatment).
- The gallery (`PublicGalleryClient`) stays dark — do not add light mode overrides to it.
- Do NOT change dark mode colors — only add light mode handling for elements that currently have hardcoded dark values.
