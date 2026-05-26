# ROOM FOR YOU — Hero Section Redesign Cursor Prompt
## Cinematic Full-Width Video/Image Background · CMS-Controlled · All Existing Text Preserved

---

## CONTEXT

Redesign the hero section in `src/components/landing/Hero.tsx` to a **cinematic full-width background** style — either a video or image fills the entire hero, with text overlaid on top with a gradient overlay for readability.

**Critical rules:**
- Preserve ALL existing text exactly — eyebrow, headline, subheading, CTAs
- Text still comes from CMS (`content` prop) — no changes to data flow
- Admin can upload hero background image OR video from the CMS admin panel
- No hardcoded colors — use existing CSS variables only

---

## RECOMMENDED ASSET DIMENSIONS

Tell your graphics designer:

**Hero Background Image:**
- Size: **1920 × 1080px** (Full HD, 16:9)
- Minimum: **1440 × 900px**
- Format: JPG (optimized) — target under 500KB
- Content: Dark worship/community atmosphere — people in worship, hands raised, gathered community. Dark tones work best since white text overlays it.
- Safe zone for text: Keep center-left area clear of busy details — text sits left-aligned over this area

**Hero Background Video:**
- Size: **1920 × 1080px**
- Format: MP4 (H.264) — target under 8MB for web
- Duration: **15–30 seconds**, loops seamlessly
- Content: Slow cinematic footage — worship atmosphere, crowd in prayer, gentle camera movement
- No audio needed (video is muted and autoplay)
- Fallback: The hero image is used as poster/fallback when video fails to load

---

## TASK 1 — Add CMS Keys for Hero Background

Open `src/lib/cms-keys.ts`.

Add to `HOME_CMS_KEYS`:
```typescript
'landing.hero.bg_image',   // URL of hero background image
'landing.hero.bg_video',   // URL of hero background video (optional)
'landing.hero.bg_overlay', // overlay opacity — default "0.55"
```

Open `src/lib/content.ts`.

Add defaults:
```typescript
'landing.hero.bg_image': '',
'landing.hero.bg_video': '',
'landing.hero.bg_overlay': '0.55',
```

---

## TASK 2 — Redesign Hero.tsx

Replace the current hero implementation with the cinematic version below.

**Preserve exactly:**
- `content['landing.hero.eyebrow']` — eyebrow text
- `heroHeadlineLines()` logic — headline line 1 and line 2
- `content['landing.hero.subtext']` — subheading
- `content['landing.hero.cta.primary']` — primary CTA button
- `content['landing.hero.cta.secondary']` — secondary CTA button
- The `Scroll` hint at the bottom
- The `Navbar` rendered inside the hero

```typescript
'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navbar } from '@/components/layout/Navbar'

interface HeroProps {
  content: Record<string, string>
}

function heroHeadlineLines(h1: string, h2: string) {
  // Preserve existing headline split logic exactly
  const words1 = h1.trim().split(/\s+/)
  const lastWord = words1.pop() ?? ''
  const firstPart = words1.join(' ')
  return { firstPart, lastWord, line2: h2 }
}

export function Hero({ content }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  const eyebrow = content['landing.hero.eyebrow'] || 'Worship · Prayer · Study · Community'
  const subtext = content['landing.hero.subtext'] || 'A community of young men and women singing songs of salvation, studying the Word, and getting others saved. Jesus to nations.'
  const ctaPrimary = content['landing.hero.cta.primary'] || 'Join the Community'
  const ctaSecondary = content['landing.hero.cta.secondary'] || 'Our Story'
  const bgImage = content['landing.hero.bg_image'] || ''
  const bgVideo = content['landing.hero.bg_video'] || ''
  const overlayOpacity = parseFloat(content['landing.hero.bg_overlay'] || '0.55')

  const h1 = content['landing.hero.headline1'] || 'There Is Room'
  const h2 = content['landing.hero.headline2'] || 'For You.'
  const { firstPart, lastWord, line2 } = heroHeadlineLines(h1, h2)

  // GSAP text entrance animation
  useEffect(() => {
    if (!textRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 })

      tl.from('[data-hero-eyebrow]', {
        y: 20, opacity: 0, duration: 0.7, ease: 'power3.out',
      })
      .from('[data-hero-line1]', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      }, '-=0.4')
      .from('[data-hero-line2]', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      }, '-=0.6')
      .from('[data-hero-line3]', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      }, '-=0.6')
      .from('[data-hero-sub]', {
        y: 20, opacity: 0, duration: 0.7, ease: 'power3.out',
      }, '-=0.4')
      .from('[data-hero-ctas]', {
        y: 20, opacity: 0, duration: 0.7, ease: 'power3.out',
      }, '-=0.4')
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#000000', // fallback if no bg set
      }}
    >
      {/* Background Video */}
      {bgVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={bgImage || undefined}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
      )}

      {/* Background Image (shown when no video, or as video fallback) */}
      {bgImage && !bgVideo && (
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', zIndex: 0 }}
        />
      )}

      {/* Gradient overlay — darkens background for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: `linear-gradient(
            105deg,
            rgba(0,0,0,${Math.min(overlayOpacity + 0.2, 0.85)}) 0%,
            rgba(0,0,0,${overlayOpacity}) 50%,
            rgba(0,0,0,${Math.max(overlayOpacity - 0.1, 0.2)}) 100%
          )`,
        }}
      />

      {/* Bottom gradient fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          zIndex: 2,
          background: 'linear-gradient(to top, var(--color-bg), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
      </div>

      {/* Hero text content */}
      <div
        ref={textRef}
        style={{
          position: 'relative',
          zIndex: 5,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: 'clamp(2rem, 8vw, 6rem) clamp(1.5rem, 5vw, 5rem)',
          paddingBottom: '6rem',
        }}
      >
        <div style={{ maxWidth: '720px' }}>

          {/* Eyebrow */}
          <p
            data-hero-eyebrow
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '1.5rem',
              margin: '0 0 1.5rem',
            }}
          >
            {eyebrow}
          </p>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 9vw, 7rem)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              margin: '0 0 1.75rem',
              textTransform: 'uppercase',
            }}
          >
            {/* Line 1 — muted first words */}
            {firstPart && (
              <span
                data-hero-line1
                style={{
                  display: 'block',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {firstPart.toUpperCase()}
              </span>
            )}

            {/* Line 2 — last word of headline1, accent outline style */}
            <span
              data-hero-line2
              style={{
                display: 'block',
                color: 'transparent',
                WebkitTextStroke: '2px var(--color-accent)',
                letterSpacing: '-0.01em',
              }}
            >
              {lastWord.toUpperCase()}
            </span>

            {/* Line 3 — headline2, solid white */}
            <span
              data-hero-line3
              style={{
                display: 'block',
                color: '#FFFFFF',
              }}
            >
              {line2.toUpperCase()}
            </span>
          </h1>

          {/* Subheading */}
          <p
            data-hero-sub
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              lineHeight: 1.75,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '520px',
              margin: '0 0 2.5rem',
            }}
          >
            {subtext}
          </p>

          {/* CTAs */}
          <div
            data-hero-ctas
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            {/* Primary CTA */}
            <Link
              href="/join"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 2rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'var(--color-accent)',
                color: '#FFFFFF',
                textDecoration: 'none',
                border: '2px solid var(--color-accent)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'transparent'
                el.style.color = 'var(--color-accent)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'var(--color-accent)'
                el.style.color = '#FFFFFF'
              }}
            >
              {ctaPrimary} →
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/about"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 2rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'transparent',
                color: 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                border: '2px solid rgba(255,255,255,0.3)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.7)'
                el.style.color = '#FFFFFF'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.3)'
                el.style.color = 'rgba(255,255,255,0.85)'
              }}
            >
              {ctaSecondary}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: 0.4,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, #FFFFFF, transparent)',
            animation: 'scrollLine 2s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes scrollLine {
            0%, 100% { opacity: 0.4; transform: scaleY(1); }
            50% { opacity: 0.8; transform: scaleY(0.6); }
          }
        `}</style>
      </div>
    </section>
  )
}
```

---

## TASK 3 — Admin CMS — Add Hero Background Upload

Open the admin CMS page for the landing page hero section.

Find where `landing.hero.*` keys are edited. Add two new fields:

**Hero Background Image**
```typescript
{
  key: 'landing.hero.bg_image',
  label: 'Hero Background Image',
  type: 'image',
  description: 'Recommended: 1920×1080px JPG, under 500KB. Dark worship/community atmosphere works best.',
}
```

**Hero Background Video** (optional)
```typescript
{
  key: 'landing.hero.bg_video',
  label: 'Hero Background Video (optional)',
  type: 'image', // uses same upload flow as image
  description: 'MP4 format, 1920×1080px, under 8MB, 15–30 seconds, loops seamlessly. Leave empty to use image only.',
}
```

**Overlay Opacity**
```typescript
{
  key: 'landing.hero.bg_overlay',
  label: 'Background Overlay Darkness',
  type: 'text',
  description: 'Number between 0 (fully transparent) and 1 (fully dark). Default: 0.55. Increase if text is hard to read.',
}
```

---

## TASK 4 — next/image Remote Patterns

The hero background image will be uploaded to local server storage at `/uploads/...` — local paths work with `next/image` without remotePatterns.

However if admin pastes a Cloudinary or external URL, ensure `next.config.mjs` has `https:` as a wildcard in `remotePatterns` for the Image component. Check current config — if `remotePatterns` already has a broad `https:` pattern, no change needed.

---

## COMPLETION CHECKLIST

**CMS Keys**
- [ ] `landing.hero.bg_image` added to `HOME_CMS_KEYS`
- [ ] `landing.hero.bg_video` added to `HOME_CMS_KEYS`
- [ ] `landing.hero.bg_overlay` added to `HOME_CMS_KEYS`
- [ ] Defaults set in `content.ts`

**Hero Component**
- [ ] Full-width, min-height 100vh section
- [ ] Background video plays when `bg_video` is set (autoplay, muted, loop, playsInline)
- [ ] Background image shows when `bg_image` is set and no video
- [ ] Gradient overlay with configurable opacity
- [ ] Bottom gradient fade to page background
- [ ] Navbar renders inside hero at z-index 10
- [ ] GSAP staggered text entrance animation
- [ ] Eyebrow text preserved from CMS
- [ ] Headline 3-line treatment preserved (muted / outline / solid)
- [ ] Subheading preserved from CMS
- [ ] Primary CTA button preserved from CMS
- [ ] Secondary CTA button preserved from CMS
- [ ] `Scroll` hint with animated line at bottom
- [ ] Hero always dark (black/video bg) regardless of light/dark mode toggle
- [ ] No hardcoded hex values except rgba overlays

**Admin CMS**
- [ ] Hero background image upload field in CMS
- [ ] Hero background video upload field in CMS
- [ ] Overlay opacity text field in CMS
- [ ] Description/hint text for graphics designer dimensions shown

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The hero section should ALWAYS be dark — regardless of the site's light/dark mode toggle — because it has a dark video/image background. The text colors inside the hero use `#FFFFFF` and `rgba(255,255,255,...)` directly, not CSS variables that change with theme.
- The bottom gradient `linear-gradient(to top, var(--color-bg), transparent)` uses the page bg variable so it blends seamlessly into whatever section comes next — works in both light and dark mode.
- `playsInline` is critical for video autoplay on iOS.
- When no bg_image and no bg_video is set, the hero falls back to a solid `#000000` background — still looks good with the white text.
- The `overlayOpacity` is configurable so admin can dial up the darkness if they upload a lighter image and text becomes hard to read.
- Keep the `heroHeadlineLines()` function logic exactly the same as it currently exists — just move it into the new file or preserve it as-is. The 3-line headline treatment (muted first words / accent outline last word / solid line 2) is the signature visual of the hero.
- The CTA `href` values should check the current Hero.tsx for the actual links being used — preserve them exactly. If they're CMS-driven, keep them CMS-driven.
