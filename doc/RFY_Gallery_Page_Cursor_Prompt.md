# ROOM FOR YOU — Gallery Page Redesign Cursor Prompt
## Masonry Grid · Infinite Scroll · Event Filters · Framer Motion Lightbox

---

## CONTEXT

Redesign the `/gallery` page to handle large numbers of images (900+) with excellent performance and UX. The page currently loads all images at once which is slow and overwhelming.

**Target experience:**
- Masonry grid layout (Pinterest-style)
- Load 24 images at a time, infinite scroll for more
- Filter by gallery event/album
- Framer Motion entrance animations on each batch
- Click opens full lightbox with prev/next navigation

---

## TASK 1 — Gallery API with Pagination and Filtering

Open `src/app/api/gallery/route.ts` or create it.

Update the GET handler to support pagination and event filtering:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '24')
  const eventId = searchParams.get('eventId') ?? undefined

  const skip = (page - 1) * limit

  const where = {
    ...(eventId ? { galleryEventId: eventId } : {}),
  }

  const [images, total] = await Promise.all([
    db.galleryImage.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      select: {
        id: true,
        url: true,
        caption: true,
        galleryEventId: true,
        galleryEvent: {
          select: { id: true, name: true },
        },
      },
    }),
    db.galleryImage.count({ where }),
  ])

  return NextResponse.json({
    images,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  })
}
```

Also create `GET /api/gallery/events` to return all gallery events for the filter:

```typescript
// src/app/api/gallery/events/route.ts
export async function GET() {
  const events = await db.galleryEvent.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, _count: { select: { images: true } } },
  })
  return NextResponse.json(events)
}
```

Check the actual model names in `prisma/schema.prisma` — it may be `GalleryImage` with `eventId` or similar. Adapt field names accordingly.

---

## TASK 2 — Gallery Page (Server Component Shell)

Update `src/app/(public)/gallery/page.tsx`:

```typescript
import { GalleryClient } from '@/components/(public)/gallery/GalleryClient'
import { db } from '@/lib/db'

export const metadata = {
  title: 'Gallery | Room For You',
  description: 'Photos from our gatherings, events and community moments.',
}

export default async function GalleryPage() {
  // Server-side: fetch first page + events list for instant render
  const [initialData, events] = await Promise.all([
    db.galleryImage.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: 24,
      select: {
        id: true,
        url: true,
        caption: true,
        galleryEventId: true,
      },
    }).catch(() => []),
    db.galleryEvent.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, _count: { select: { images: true } } },
    }).catch(() => []),
  ])

  const total = await db.galleryImage.count().catch(() => 0)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Page header */}
      <div style={{
        padding: 'clamp(5rem, 12vw, 8rem) clamp(1.5rem, 5vw, 5rem) 3rem',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.7rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: '0.75rem',
        }}>
          Gallery
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 7vw, 5rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: 0,
          lineHeight: 1.05,
        }}>
          Our <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>moments</em>
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: 'var(--color-text-secondary)',
          marginTop: '1rem',
          maxWidth: '480px',
        }}>
          Photos from our gatherings, worship nights, and community moments.
        </p>
      </div>

      <GalleryClient
        initialImages={initialData}
        initialTotal={total}
        events={events}
      />
    </main>
  )
}
```

---

## TASK 3 — GalleryClient Component

Create `src/components/(public)/gallery/GalleryClient.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface GalleryImage {
  id: string
  url: string
  caption?: string | null
  galleryEventId?: string | null
}

interface GalleryEvent {
  id: string
  name: string
  _count?: { images: number }
}

interface Props {
  initialImages: GalleryImage[]
  initialTotal: number
  events: GalleryEvent[]
}

export function GalleryClient({ initialImages, initialTotal, events }: Props) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialImages.length < initialTotal)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Load more images
  const loadMore = useCallback(async (eventId?: string | null, nextPage?: number) => {
    if (loading) return
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(nextPage ?? page + 1),
        limit: '24',
        ...(eventId ? { eventId } : {}),
      })

      const res = await fetch(`/api/gallery?${params}`)
      const data = await res.json()

      setImages(prev => nextPage === 1 ? data.images : [...prev, ...data.images])
      setTotal(data.total)
      setPage(data.page)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('[gallery] load failed', err)
    } finally {
      setLoading(false)
    }
  }, [loading, page])

  // Filter by event
  const handleEventFilter = async (eventId: string | null) => {
    setActiveEvent(eventId)
    setPage(1)
    setLoading(true)

    try {
      const params = new URLSearchParams({ page: '1', limit: '24' })
      if (eventId) params.set('eventId', eventId)

      const res = await fetch(`/api/gallery?${params}`)
      const data = await res.json()

      setImages(data.images)
      setTotal(data.total)
      setPage(1)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('[gallery] filter failed', err)
    } finally {
      setLoading(false)
    }
  }

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore(activeEvent)
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore, activeEvent])

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

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <>
      <div style={{ padding: 'clamp(1.5rem, 5vw, 5rem)' }}>

        {/* Event filter tabs */}
        {events.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '2.5rem',
          }}>
            {/* All photos */}
            <button
              onClick={() => handleEventFilter(null)}
              style={{
                padding: '0.5rem 1.25rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
                border: '1px solid',
                borderColor: activeEvent === null ? 'var(--color-accent)' : 'var(--color-border)',
                background: activeEvent === null ? 'var(--color-accent)' : 'transparent',
                color: activeEvent === null ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              All ({total})
            </button>

            {events.map(event => (
              <button
                key={event.id}
                onClick={() => handleEventFilter(event.id)}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  border: '1px solid',
                  borderColor: activeEvent === event.id ? 'var(--color-accent)' : 'var(--color-border)',
                  background: activeEvent === event.id ? 'var(--color-accent)' : 'transparent',
                  color: activeEvent === event.id ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {event.name}
                {event._count && (
                  <span style={{ opacity: 0.6, marginLeft: '0.35rem' }}>
                    ({event._count.images})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Image count */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          marginBottom: '2rem',
          letterSpacing: '0.05em',
        }}>
          Showing {images.length} of {total} photos
        </p>

        {/* Masonry grid */}
        <div style={{
          columns: 'var(--gallery-cols, 3)',
          columnGap: '1rem',
          '--gallery-cols': '3',
        } as React.CSSProperties}
          className="gallery-masonry"
        >
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: (index % 24) * 0.03,
                ease: [0.32, 0.72, 0, 1],
              }}
              onClick={() => setLightboxIndex(index)}
              style={{
                breakInside: 'avoid',
                marginBottom: '1rem',
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                display: 'block',
              }}
            >
              <div style={{ position: 'relative', width: '100%' }}>
                <Image
                  src={image.url}
                  alt={image.caption ?? `Gallery photo ${index + 1}`}
                  width={600}
                  height={0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'transform 0.4s ease',
                  }}
                  className="gallery-img"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div
                  className="gallery-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0)',
                    transition: 'background 0.3s ease',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '1rem',
                  }}
                >
                  {image.caption && (
                    <p
                      className="gallery-caption"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0)',
                        margin: 0,
                        lineHeight: 1.4,
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {image.caption}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Infinite scroll loader */}
        <div ref={loaderRef} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Loading more photos…
              </span>
            </div>
          )}
          {!hasMore && images.length > 0 && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              All {total} photos loaded
            </p>
          )}
        </div>
      </div>

      {/* CSS for masonry hover effects */}
      <style>{`
        @media (max-width: 640px) {
          .gallery-masonry { --gallery-cols: 1 !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .gallery-masonry { --gallery-cols: 2 !important; }
        }
        @media (min-width: 1025px) {
          .gallery-masonry { --gallery-cols: 3 !important; }
        }
        .gallery-masonry > div:hover .gallery-img {
          transform: scale(1.04);
        }
        .gallery-masonry > div:hover .gallery-overlay {
          background: rgba(0,0,0,0.35) !important;
        }
        .gallery-masonry > div:hover .gallery-caption {
          color: rgba(255,255,255,0.85) !important;
        }
      `}</style>

      {/* Lightbox */}
      <AnimatePresence>
        {currentImage && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.93)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                width: 'min(900px, 90vw)',
                height: 'min(600px, 85vh)',
              }}
            >
              <Image
                src={currentImage.url}
                alt={currentImage.caption ?? 'Gallery photo'}
                fill
                sizes="900px"
                style={{ objectFit: 'contain' }}
              />

              {currentImage.caption && (
                <p style={{
                  position: 'absolute',
                  bottom: '-2.5rem',
                  left: 0, right: 0,
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0,
                }}>
                  {currentImage.caption}
                </p>
              )}

              <p style={{
                position: 'absolute',
                bottom: '-4.5rem',
                left: 0, right: 0,
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.35)',
                margin: 0,
              }}>
                {lightboxIndex + 1} / {images.length}
              </p>
            </motion.div>

            {/* Close */}
            <button
              onClick={() => setLightboxIndex(null)}
              style={{
                position: 'fixed', top: '1.5rem', right: '1.5rem',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 1) - 1) }}
                style={{
                  position: 'fixed', left: '1.5rem', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Next */}
            {lightboxIndex < images.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 0) + 1) }}
                style={{
                  position: 'fixed', right: '1.5rem', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
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

## COMPLETION CHECKLIST

**API**
- [ ] `GET /api/gallery?page=1&limit=24&eventId=xxx` works
- [ ] Returns `{ images, total, page, totalPages, hasMore }`
- [ ] `GET /api/gallery/events` returns all events with image counts

**Gallery Page**
- [ ] Server component fetches first 24 images + events list
- [ ] Page header with eyebrow, large heading, description
- [ ] `GalleryClient` receives `initialImages`, `initialTotal`, `events`

**Masonry Grid**
- [ ] CSS columns masonry layout
- [ ] 3 columns desktop, 2 tablet, 1 mobile
- [ ] Images load naturally at their own height
- [ ] `loading="lazy"` on all images
- [ ] Framer Motion fade-up stagger on each batch (delay based on index % 24)

**Filters**
- [ ] "All" button shows total count
- [ ] Event filter buttons show event name + count
- [ ] Active filter highlighted with accent color
- [ ] Filtering resets to page 1 and replaces images

**Infinite Scroll**
- [ ] IntersectionObserver watches loader div at bottom
- [ ] Loads next 24 when loader enters viewport
- [ ] Loading spinner shown while fetching
- [ ] "All X photos loaded" shown when complete
- [ ] Count "Showing X of Y" shown

**Lightbox**
- [ ] Click any image opens lightbox
- [ ] Backdrop click closes
- [ ] Escape key closes
- [ ] Arrow keys navigate
- [ ] Prev/Next buttons
- [ ] Caption shown
- [ ] "X / Y" counter
- [ ] Body scroll lock

**Build**
- [ ] `npm run build` passes
- [ ] No hardcoded hex values — CSS variables only

---

## NOTES FOR CURSOR

- CSS columns masonry is the simplest approach — no JavaScript layout calculation needed. `columns: 3; column-gap: 1rem` with `break-inside: avoid` on each item.
- `Image` with `width={600} height={0}` and `style={{ height: 'auto' }}` lets the image render at its natural aspect ratio — essential for masonry.
- The stagger delay `(index % 24) * 0.03` resets for each new page load so new batches animate in fresh.
- IntersectionObserver fires when the loader div (80px tall, at the bottom of the grid) enters the viewport — this triggers the next page load automatically.
- Filter buttons use `var(--color-accent)` for active state background and `var(--color-text-inverse)` for text — works in both light and dark mode.
- The lightbox is shared between gallery strip and gallery page — consider extracting it to `src/components/shared/ImageLightbox.tsx` if both components need it.
- Check actual Prisma model field names — it may be `GalleryImage.eventId` instead of `galleryEventId`, or `GalleryEvent` may be named differently.
