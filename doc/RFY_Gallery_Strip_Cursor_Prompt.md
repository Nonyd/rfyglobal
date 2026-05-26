# ROOM FOR YOU — Homepage Gallery Strip Cursor Prompt
## GSAP Horizontal Scroll · Framer Motion Lightbox · RFY Theme Tokens Only

---

## CONTEXT

Add a horizontal scrolling photo gallery strip to the homepage, matching the pattern from the Hallel Community `GalleryStrip` component. The gallery fetches real images from the DB, uses GSAP ScrollTrigger for horizontal parallax scroll, and opens a Framer Motion lightbox on click.

**Critical rule:** Use ONLY existing RFY CSS variables and theme tokens. No hardcoded hex values.

---

## TASK 1 — Install/Verify Dependencies

Check `package.json` for:
- `gsap` — if missing, run `npm install gsap`
- `framer-motion` — if missing, run `npm install framer-motion`
- `lucide-react` — already installed

---

## TASK 2 — Create GalleryStrip Component

Create `src/components/(public)/home/GalleryStrip.tsx`:

```typescript
'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface GalleryImage {
  id: string
  url: string
  caption?: string | null
}

interface GalleryStripProps {
  images: GalleryImage[]
  eyebrow?: string
  titleBefore?: string
  titleItalic?: string
  ctaHref?: string
  ctaLabel?: string
}

// Alternating aspect ratios for visual interest
const ASPECT_RATIOS = [
  { width: 320, height: 420 },  // portrait tall
  { width: 380, height: 300 },  // landscape wide
  { width: 280, height: 380 },  // portrait medium
  { width: 400, height: 320 },  // landscape wide
  { width: 300, height: 420 },  // portrait tall
  { width: 360, height: 290 },  // landscape wide
]

// Alternating vertical stagger
const VERTICAL_OFFSETS = [0, 40, -20, 30, -10, 45, 10, -30]

export function GalleryStrip({
  images,
  eyebrow = 'Gallery',
  titleBefore = 'Moments from',
  titleItalic = 'our gatherings',
  ctaHref = '/gallery',
  ctaLabel = 'View all photos',
}: GalleryStripProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // GSAP horizontal scroll
  useEffect(() => {
    if (!sectionRef.current || !trackRef.current || images.length === 0) return

    gsap.registerPlugin(ScrollTrigger)

    const track = trackRef.current
    const totalWidth = track.scrollWidth - track.offsetWidth

    const ctx = gsap.context(() => {
      // Header fade-up (once)
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            once: true,
          },
        })
      }

      // Horizontal scroll on section scroll
      gsap.to(track, {
        x: () => -totalWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${totalWidth * 1.2}`,
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [images])

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, images.length - 1) : null)
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null)
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, images.length])

  if (images.length === 0) return null

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <>
      {/* Gallery Strip Section */}
      <section
        ref={sectionRef}
        style={{
          background: 'var(--color-bg)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Section padding container */}
        <div style={{ padding: '5rem 0 2rem' }}>
          {/* Header */}
          <div
            ref={headerRef}
            style={{
              padding: '0 clamp(1.5rem, 5vw, 5rem)',
              marginBottom: '3rem',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            {/* Title block */}
            <div>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: '0.75rem',
              }}>
                {eyebrow}
              </p>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}>
                {titleBefore}{' '}
                <em style={{
                  fontStyle: 'italic',
                  color: 'var(--color-accent)',
                }}>
                  {titleItalic}
                </em>
              </h2>
            </div>

            {/* CTA */}
            <Link
              href={ctaHref}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--color-accent)',
                paddingBottom: '2px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'
              }}
            >
              {ctaLabel}
              <span>→</span>
            </Link>
          </div>

          {/* Scrolling track */}
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1rem clamp(1.5rem, 5vw, 5rem)',
              willChange: 'transform',
            }}
          >
            {images.map((image, index) => {
              const ratio = ASPECT_RATIOS[index % ASPECT_RATIOS.length]
              const offset = VERTICAL_OFFSETS[index % VERTICAL_OFFSETS.length]

              return (
                <div
                  key={image.id}
                  onClick={() => setLightboxIndex(index)}
                  style={{
                    flexShrink: 0,
                    width: `${ratio.width}px`,
                    height: `${ratio.height}px`,
                    marginTop: `${offset}px`,
                    position: 'relative',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.35)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                >
                  <Image
                    src={image.url}
                    alt={image.caption ?? `Gallery image ${index + 1}`}
                    fill
                    sizes="400px"
                    style={{ objectFit: 'cover' }}
                  />
                  {/* Bottom gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: '60%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    pointerEvents: 'none',
                  }} />
                  {/* Caption */}
                  {image.caption && (
                    <p style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '0.75rem',
                      right: '0.75rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.72rem',
                      color: 'rgba(255,255,255,0.85)',
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      {image.caption}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {currentImage && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
            }}
          >
            {/* Image container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto',
              }}
            >
              <div style={{
                position: 'relative',
                width: 'min(900px, 90vw)',
                height: 'min(600px, 80vh)',
              }}>
                <Image
                  src={currentImage.url}
                  alt={currentImage.caption ?? 'Gallery image'}
                  fill
                  sizes="900px"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {/* Caption */}
              {currentImage.caption && (
                <p style={{
                  textAlign: 'center',
                  marginTop: '1rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.65)',
                }}>
                  {currentImage.caption}
                </p>
              )}

              {/* Counter */}
              <p style={{
                textAlign: 'center',
                marginTop: '0.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {lightboxIndex + 1} / {images.length}
              </p>
            </motion.div>

            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              <X size={18} />
            </button>

            {/* Prev button */}
            {lightboxIndex > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 1) - 1) }}
                style={{
                  position: 'fixed',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Next button */}
            {lightboxIndex < images.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 0) + 1) }}
                style={{
                  position: 'fixed',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## TASK 3 — Wire into Homepage

Open `src/app/(public)/page.tsx`.

Fetch gallery images server-side and pass to the component:

```typescript
// In the homepage server component:
import { GalleryStrip } from '@/components/(public)/home/GalleryStrip'

// Fetch gallery images:
const galleryImages = await db.galleryImage.findMany({
  where: { isPublished: true },
  orderBy: { order: 'asc' },
  take: 14,
  select: { id: true, url: true, caption: true },
}).catch(() => [])

// In the JSX, place after the community cards section and before the CTA:
<GalleryStrip
  images={galleryImages}
  eyebrow="Gallery"
  titleBefore="Moments from"
  titleItalic="our gatherings"
  ctaHref="/gallery"
  ctaLabel="View all photos →"
/>
```

If `galleryImage` model doesn't exist, use `galleryItem` or whichever is the correct model name — check the Prisma schema.

---

## TASK 4 — next/image Config

Open `next.config.mjs`.

Ensure local uploads path is allowed for `next/image`. Since images are now served locally at `/uploads/...` they are local paths and don't need `remotePatterns`. But verify `next/image` handles `/uploads/` paths correctly — local paths starting with `/` are served as static files and work with `next/image` without any config.

If any gallery images still have Cloudinary URLs in the DB (from before migration), keep `res.cloudinary.com` in `remotePatterns` as a fallback.

---

## COMPLETION CHECKLIST

- [ ] `gsap` installed
- [ ] `framer-motion` installed
- [ ] `GalleryStrip.tsx` created at `src/components/(public)/home/GalleryStrip.tsx`
- [ ] GSAP ScrollTrigger registered in `useEffect`
- [ ] Horizontal scroll driven by ScrollTrigger scrub
- [ ] Section pins during scroll
- [ ] Header (eyebrow + title + CTA) fades up on scroll with Framer Motion
- [ ] Image cards: alternating width/height ratios
- [ ] Image cards: alternating vertical stagger offsets
- [ ] Image cards: border and shadow using CSS variables
- [ ] Image cards: bottom gradient overlay
- [ ] Image cards: caption shown when present
- [ ] Click opens Framer Motion lightbox
- [ ] Lightbox: backdrop closes on click
- [ ] Lightbox: Escape key closes
- [ ] Lightbox: Arrow keys navigate prev/next
- [ ] Lightbox: Prev/Next buttons
- [ ] Lightbox: body scroll lock while open
- [ ] Lightbox: caption shown
- [ ] Lightbox: "1 / n" counter
- [ ] Wired into homepage with real DB data
- [ ] Takes 14 images ordered by `order` asc
- [ ] NO hardcoded hex values — only CSS variables
- [ ] `npm run build` passes

---

## THEME TOKEN REFERENCE

Use ONLY these tokens — no hex values:

```css
var(--color-bg)              /* page background */
var(--color-surface)         /* card/section background */
var(--color-border)          /* borders */
var(--color-text-primary)    /* main text */
var(--color-text-secondary)  /* body text */
var(--color-text-muted)      /* labels, captions */
var(--color-accent)          /* accent — red in dark, crimson in light */
var(--font-display)          /* display/heading font */
var(--font-body)             /* body font */
```

For the lightbox backdrop and overlay gradients, use `rgba(0,0,0,...)` values only — these are not brand colors.

---

## NOTES FOR CURSOR

- The GSAP `ScrollTrigger` must be registered inside `useEffect` to avoid SSR issues — `if (typeof window === 'undefined') return`
- The `ctx.revert()` cleanup in useEffect prevents memory leaks and duplicate ScrollTriggers on hot reload
- `invalidateOnRefresh: true` on ScrollTrigger ensures correct calculation after window resize
- The section must have `overflow: hidden` to clip the horizontal track during scroll
- `anticipatePin: 1` prevents the slight jump when the section starts pinning
- The lightbox uses `position: fixed` with `zIndex: 9999` to appear above everything including the chat widget
- Mobile: on screens narrower than 768px, consider disabling the GSAP pin and showing a simple horizontal scroll container with `overflow-x: auto` instead — add a responsive check in the useEffect
- The `GalleryStrip` is a Client Component (`'use client'`) — data is fetched server-side in the page and passed as props
