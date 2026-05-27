# ROOM FOR YOU — Homepage Featured Upcoming Event Section Cursor Prompt
## Single Featured Event · Event Flyer · Description · Register Button

---

## CONTEXT

Add a beautiful featured upcoming event section to the homepage, placed **after the hero section and ticker** (marquee band) and **before** whatever section currently follows.

It shows only the **next single upcoming event** — the one closest to today's date that hasn't passed yet. If no upcoming events exist, the section is hidden entirely.

---

## TASK 1 — Fetch Next Upcoming Event (Server Side)

Open `src/app/(public)/page.tsx`.

Add a server-side fetch for the next upcoming event:

```typescript
// Fetch next upcoming event
const now = new Date()
const nextEvent = await db.event.findFirst({
  where: {
    isPublished: true,
    startDate: { gte: now },
  },
  orderBy: { startDate: 'asc' },
  select: {
    id: true,
    title: true,
    description: true,
    startDate: true,
    endDate: true,
    location: true,
    imageUrl: true,
    slug: true,
    isFree: true,
    price: true,
    currency: true,
  },
}).catch(() => null)
```

Check the actual field names in `prisma/schema.prisma` for the `Event` model — adapt field names accordingly (`imageUrl` may be `image`, `isPublished` may be `published`, `startDate` may be `date`, etc.).

Pass the event to the new component:

```typescript
{nextEvent && <FeaturedEvent event={nextEvent} />}
```

---

## TASK 2 — Create FeaturedEvent Component

Create `src/components/(public)/home/FeaturedEvent.tsx`:

```typescript
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react'

interface EventData {
  id: string
  title: string
  description?: string | null
  startDate: Date
  endDate?: Date | null
  location?: string | null
  imageUrl?: string | null
  slug?: string | null
  isFree?: boolean
  price?: number | null
  currency?: string | null
}

interface Props {
  event: EventData
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

function getDaysUntil(date: Date): number {
  const now = new Date()
  const diff = new Date(date).getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function FeaturedEvent({ event }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const daysUntil = getDaysUntil(event.startDate)
  const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event.id}`

  const urgencyLabel =
    daysUntil === 0 ? 'Today' :
    daysUntil === 1 ? 'Tomorrow' :
    daysUntil <= 7 ? `In ${daysUntil} days` :
    null

  return (
    <section
      style={{
        background: 'var(--color-bg)',
        padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Section label */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ marginBottom: '3rem' }}
      >
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.7rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          margin: '0 0 0.5rem',
        }}>
          Upcoming Event
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: 0,
          lineHeight: 1.1,
        }}>
          Don't Miss{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>
            What's Next
          </em>
        </h2>
      </motion.div>

      {/* Event card — two column layout */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(2rem, 5vw, 4rem)',
          alignItems: 'center',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {/* LEFT — Event flyer image */}
        <div style={{
          position: 'relative',
          aspectRatio: '3/4',
          background: 'var(--color-surface)',
          overflow: 'hidden',
          minHeight: '320px',
        }}>
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            // Placeholder when no flyer
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '4rem',
                  opacity: 0.1,
                  margin: 0,
                }}>✦</p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  Event Flyer
                </p>
              </div>
            </div>
          )}

          {/* Urgency badge */}
          {urgencyLabel && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              background: 'var(--color-accent)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.35rem 0.85rem',
            }}>
              {urgencyLabel}
            </div>
          )}
        </div>

        {/* RIGHT — Event details */}
        <div style={{
          padding: 'clamp(1.5rem, 4vw, 3rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Free/price badge */}
          <div>
            <span style={{
              display: 'inline-block',
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              border: '1px solid var(--color-accent)',
              padding: '0.25rem 0.75rem',
            }}>
              {event.isFree ? 'Free Entry' : event.price ? `${event.currency ?? '₦'}${event.price.toLocaleString()}` : 'Register'}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.05,
          }}>
            {event.title}
          </h3>

          {/* Meta info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
              }}>
                {formatEventDate(event.startDate)}
              </span>
            </div>

            {/* Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
              }}>
                {formatEventTime(event.startDate)}
                {event.endDate && ` – ${formatEventTime(event.endDate)}`}
              </span>
            </div>

            {/* Location */}
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  {event.location}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              lineHeight: 1.75,
              color: 'var(--color-text-secondary)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {event.description}
            </p>
          )}

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'var(--color-border)',
          }} />

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {/* Primary — Register */}
            <Link
              href={`${eventUrl}#register`}
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
                transition: 'all 0.25s',
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
              Register Now <ArrowRight size={14} />
            </Link>

            {/* Secondary — Learn more */}
            <Link
              href={eventUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '2px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.color = 'var(--color-accent)'
                el.style.borderColor = 'var(--color-accent)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.color = 'var(--color-text-secondary)'
                el.style.borderColor = 'var(--color-border)'
              }}
            >
              View event details
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
```

---

## TASK 3 — Wire into Homepage

Open `src/app/(public)/page.tsx`.

Import the component:
```typescript
import { FeaturedEvent } from '@/components/(public)/home/FeaturedEvent'
```

Place it after the hero/ticker section and before the next section:
```typescript
{/* Hero */}
<Hero content={content} />

{/* Ticker/marquee — if exists */}
{/* ... ticker component ... */}

{/* Featured upcoming event */}
{nextEvent && <FeaturedEvent event={nextEvent} />}

{/* Rest of homepage sections */}
```

---

## COMPLETION CHECKLIST

**Data**
- [ ] `db.event.findFirst` fetches next upcoming published event
- [ ] Orders by `startDate asc`, filters `startDate >= now`
- [ ] Returns null if no upcoming events → section hidden
- [ ] Correct field names used from actual Prisma schema

**FeaturedEvent Component**
- [ ] Section label — eyebrow "Upcoming Event" + heading
- [ ] Two-column grid — flyer left, details right
- [ ] Stacks to single column on mobile
- [ ] Event flyer image fills left column (3:4 aspect ratio)
- [ ] Placeholder shown when no flyer image
- [ ] Urgency badge — "Today" / "Tomorrow" / "In X days" (only when ≤7 days)
- [ ] Free/price badge on right panel
- [ ] Event title — large display font
- [ ] Date, time, location with icons
- [ ] Description (truncated to 4 lines)
- [ ] "Register Now" primary CTA → `/events/[slug]#register`
- [ ] "View event details" secondary link → `/events/[slug]`
- [ ] Framer Motion fade-up entrance animation on scroll
- [ ] Section hidden entirely when no upcoming events
- [ ] No hardcoded hex values — CSS variables only

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Check the actual `Event` model field names in `prisma/schema.prisma` before writing the query — common variations: `image` vs `imageUrl`, `date` vs `startDate`, `published` vs `isPublished`, `registrationUrl` vs `slug`.
- The `isEventStillActive` utility already exists in `src/lib/event-utils.ts` — use it or reference it for the "upcoming" filter logic.
- The Register CTA links to `#register` anchor on the event page — this assumes the event detail page has a registration form section with that ID. If not, link directly to `/events/[slug]`.
- `useInView` from framer-motion with `once: true` means the animation plays once when the section scrolls into view — it doesn't re-animate on scroll up.
- The urgency badge only shows when the event is 7 days or fewer away — for events further out, no badge is shown (cleaner look).
- The component is a Client Component because of `useInView` — but the data is fetched server-side in the page and passed as a prop, keeping data fetching fast.
