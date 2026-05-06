# ROOM FOR YOU — Phase 14 Cursor Prompt
## Events Single Page · Admin Roles & User Management · Activity Log · Light Mode Fixes

---

## CONTEXT

Phase 14 covers four areas:

1. **Light mode fixes** — Study Portal, Gallery, and Scripture upload zone contrast issues
2. **Events single page** — `/events/[slug]` with split layout (image left, details right), full event details, registration via join form
3. **Admin roles & user management** — 4 roles with full permissions matrix, SUPER_ADMIN can create/manage admin users
4. **Activity log** — every admin action logged and visible at `/admin/activity`

---

## PERMISSIONS MATRIX

| Feature | SUPER_ADMIN | ADMIN | EDITOR | MEDIA_ADMIN |
|---|---|---|---|---|
| Dashboard | ✅ (with finance) | ✅ (no finance) | ✅ (minimal) | ✅ (minimal) |
| Scripture | ✅ | ✅ | ✅ | ❌ |
| Blog | ✅ | ✅ | ✅ | ❌ |
| Study | ✅ | ✅ | ✅ | ❌ |
| Events | ✅ | ✅ | ❌ | ❌ |
| Gallery | ✅ | ✅ | ❌ | ✅ |
| Forms | ✅ | ✅ | ❌ | ❌ |
| Members | ✅ | ✅ | ❌ | ❌ |
| Site CMS | ✅ | ❌ | ❌ | ❌ |
| Integrations | ✅ | ❌ | ❌ | ❌ |
| Automation | ✅ | ❌ | ❌ | ❌ |
| Partnership | ✅ | ❌ | ❌ | ❌ |
| Demo Data | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Activity Log | ✅ | ✅ | ❌ | ❌ |
| Delete anything | ✅ | ❌ | ❌ | ❌ |
| Total Gifts card | ✅ | ❌ | ❌ | ❌ |

---

## ═══════════════════════════════════════
## MODULE 1 — LIGHT MODE FIXES
## ═══════════════════════════════════════

### TASK 1 — Fix StudyManager Light Mode

Open `src/components/admin/study/StudyManager.tsx`.

Replace ALL hardcoded dark color classes and values with `--a-*` variables:

```typescript
// Series accordion card
<div className="border transition-all"
  style={{
    background: 'var(--a-surface)',
    borderColor: 'var(--a-border)',
    boxShadow: 'var(--a-shadow)',
  }}>

// Series title
<h3 className="font-display text-lg font-semibold"
  style={{ color: 'var(--a-text)' }}>

// Series description
<p className="font-body text-sm"
  style={{ color: 'var(--a-text-secondary)' }}>

// Section labels (Materials, Tasks)
<p className="text-xs uppercase tracking-widest font-semibold mb-3"
  style={{ color: 'var(--a-gold)' }}>

// Material/task item rows
<div className="flex items-center gap-3 p-3 border"
  style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>

// Item text
<p className="font-body text-sm"
  style={{ color: 'var(--a-text-secondary)' }}>

// Slide-in panel background
style={{
  background: 'var(--a-surface)',
  borderLeft: '1px solid var(--a-border)',
  boxShadow: 'var(--a-shadow-md)',
}}

// All inputs in panels
style={{
  background: 'var(--a-bg)',
  borderColor: 'var(--a-border)',
  color: 'var(--a-text)',
}}
```

---

### TASK 2 — Fix GalleryManager Light Mode

Open `src/components/admin/gallery/GalleryManager.tsx`.

**Problem 1: Images not showing** — The gallery images use `next/image` but the Unsplash URLs may not be in `remotePatterns`. Open `next.config.mjs` and add:
```javascript
{ protocol: 'https', hostname: 'images.unsplash.com' },
```

**Problem 2: Hover overlay hardcoded dark** — The hover overlay on gallery cards is hardcoded `bg-black/70`. This is fine for the gallery grid (images need a dark overlay regardless of theme). Keep it as is.

**Problem 3: Upload panel and controls** — Fix the slide-in panel and all control elements:
```typescript
// Upload panel
style={{
  background: 'var(--a-surface)',
  borderLeft: '1px solid var(--a-border)',
}}

// Panel inputs
style={{
  background: 'var(--a-bg)',
  borderColor: 'var(--a-border)',
  color: 'var(--a-text)',
}}

// Panel labels
style={{ color: 'var(--a-text-secondary)' }}

// Header title/subtitle
style={{ color: 'var(--a-text)' }}
style={{ color: 'var(--a-text-muted)' }}
```

---

### TASK 3 — Fix UploadZone in Light Mode

Open `src/components/shared/UploadZone.tsx`.

The upload zone droparea and file state items are hardcoded dark. Fix:

```typescript
// Drop zone label/container — remove hardcoded dark border, use themed
className={cn(
  'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed cursor-pointer transition-all duration-200',
  isDragging ? 'border-gold' : 'border-theme'  // use CSS var
)}
style={{
  borderColor: isDragging ? 'var(--a-gold, #C9A84C)' : 'var(--a-border, rgba(255,255,255,0.15))',
  background: isDragging ? 'var(--a-gold-light, rgba(201,168,76,0.08))' : 'transparent',
}}

// Upload icon circle
style={{
  borderColor: isDragging ? 'var(--a-gold, #C9A84C)' : 'var(--a-border, rgba(255,255,255,0.2))',
  color: isDragging ? 'var(--a-gold, #C9A84C)' : 'var(--a-text-muted, rgba(255,255,255,0.3))',
}}

// Label text
style={{ color: 'var(--a-text-secondary, rgba(255,255,255,0.6))' }}

// Sub-label
style={{ color: 'var(--a-text-muted, rgba(255,255,255,0.25))' }}

// File state items
style={{
  borderColor: 'var(--a-border, rgba(255,255,255,0.1))',
  background: 'var(--a-surface, transparent)',
}}

// File name text
style={{ color: 'var(--a-text-secondary, rgba(255,255,255,0.7))' }}

// Status text
style={{ color: f.status === 'done' ? 'var(--a-gold, #C9A84C)' :
         f.status === 'error' ? 'var(--a-red, #F85149)' :
         'var(--a-text-muted, rgba(255,255,255,0.3))' }}

// "Upload more" button
style={{ color: 'var(--a-text-muted)' }}
onMouseEnter={e => e.currentTarget.style.color = 'var(--a-gold)'}
onMouseLeave={e => e.currentTarget.style.color = 'var(--a-text-muted)'}
```

The fallback values (after the comma) ensure the component still works on the public site (dark background) where `--a-*` vars are not defined.

---

## ═══════════════════════════════════════
## MODULE 2 — EVENTS SINGLE PAGE
## ═══════════════════════════════════════

### TASK 4 — Add Slug to Event Model

Update `prisma/schema.prisma` — add slug to Event:

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique  // ADD THIS
  description String?  @db.Text
  city        String
  venue       String
  date        DateTime
  time        String?
  imageUrl    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run: `npx prisma db push`

Also add a migration helper — when creating/updating events, auto-generate slug from title + city:

Add to `src/lib/utils.ts`:
```typescript
export function eventSlug(title: string, city: string): string {
  return slugify(`${title}-${city}`)
}
```

---

### TASK 5 — Update Events API to Include Slug

Update `src/app/api/events/route.ts` POST handler:

```typescript
import { eventSlug } from '@/lib/utils'

// In POST:
const slug = eventSlug(parsed.data.title, parsed.data.city)

// Check slug uniqueness
const existingSlug = await db.event.findUnique({ where: { slug } })
const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

const event = await db.event.create({
  data: {
    ...parsed.data,
    slug: finalSlug,
    date: new Date(parsed.data.date),
  },
})
```

Update PATCH handler to regenerate slug if title or city changes:
```typescript
if (body.title || body.city) {
  const current = await db.event.findUnique({ where: { id: params.id } })
  if (current) {
    body.slug = eventSlug(
      body.title ?? current.title,
      body.city ?? current.city
    )
  }
}
```

Also add a public GET by slug route:

Create `src/app/api/events/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const event = await db.event.findUnique({
    where: { slug: params.slug, isActive: true },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}
```

---

### TASK 6 — Update Demo Data with Slugs

Open `prisma/seed.ts` and `src/app/api/admin/demo/route.ts`.

Add slugs to all demo events:
```typescript
{ slug: 'abuja-monthly-gathering-abuja', title: 'Room For You — Abuja Monthly Gathering', ... },
{ slug: 'lagos-monthly-gathering-lagos', ... },
{ slug: 'port-harcourt-gathering-port-harcourt', ... },
{ slug: 'online-prayer-night-online', ... },
{ slug: 'abuja-outreach-abuja', ... },
{ slug: 'lagos-bible-study-marathon-lagos', ... },
```

---

### TASK 7 — Single Event Page

Create `src/app/(public)/events/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SingleEventClient } from '@/components/events/SingleEventClient'
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const event = await db.event.findUnique({
    where: { slug: params.slug, isActive: true },
  })
  return {
    title: event ? `${event.title} — Room For You` : 'Event',
    description: event?.description ?? undefined,
    openGraph: event?.imageUrl ? { images: [event.imageUrl] } : undefined,
  }
}

export default async function SingleEventPage({
  params,
}: {
  params: { slug: string }
}) {
  const event = await db.event.findUnique({
    where: { slug: params.slug, isActive: true },
  })

  if (!event) notFound()

  // Get other upcoming events (excluding this one)
  const otherEvents = await db.event.findMany({
    where: {
      isActive: true,
      date: { gte: new Date() },
      id: { not: event.id },
    },
    orderBy: { date: 'asc' },
    take: 3,
  })

  return (
    <>
      <Navbar />
      <SingleEventClient event={event} otherEvents={otherEvents} />
      <Footer />
    </>
  )
}
```

---

### TASK 8 — SingleEventClient Component

Create `src/components/events/SingleEventClient.tsx`:

**Design: Split layout — image left, all details right. Bold, cinematic, premium.**

```typescript
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Calendar, ArrowLeft, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import type { Event } from '@prisma/client'

interface SingleEventClientProps {
  event: Event
  otherEvents: Event[]
}

export function SingleEventClient({ event, otherEvents }: SingleEventClientProps) {
  const dateFormatted = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const monthShort = format(new Date(event.date), 'MMM').toUpperCase()
  const dayNum = format(new Date(event.date), 'dd')
  const isPast = new Date(event.date) < new Date()

  return (
    <main className="min-h-screen bg-void">
      {/* ── HERO SPLIT ── */}
      <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* Left — Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative min-h-[50vh] lg:min-h-screen lg:sticky lg:top-0"
        >
          {event.imageUrl ? (
            <>
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
              {/* Dark overlay */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, rgba(15,15,15,0.3), rgba(15,15,15,0.1))' }} />
            </>
          ) : (
            /* Placeholder with gold RFY monogram */
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)' }}>
              <div className="text-center">
                <p className="font-display text-[8rem] font-bold leading-none"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '1px rgba(201,168,76,0.3)',
                  }}>
                  RFY
                </p>
                <div className="gold-line w-24 mx-auto mt-4 opacity-30" />
              </div>
            </div>
          )}

          {/* Date badge — overlaid on image */}
          <div className="absolute top-8 left-8 lg:top-12 lg:left-12 z-10">
            <div className="border border-gold/40 bg-void/80 backdrop-blur-sm px-4 py-3 text-center">
              <p className="font-display text-4xl text-gold font-bold leading-none">{dayNum}</p>
              <p className="label-text opacity-70 mt-1">{monthShort}</p>
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/events"
            className="absolute bottom-8 left-8 lg:bottom-12 lg:left-12 z-10 flex items-center gap-2 font-body text-xs tracking-widest uppercase transition-colors"
            style={{ color: 'rgba(248,248,248,0.5)' }}
          >
            <ArrowLeft size={14} />
            All Events
          </Link>
        </motion.div>

        {/* Right — Details */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-24 lg:py-32"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* City tag */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-2 mb-6"
          >
            <MapPin size={12} className="text-gold" />
            <p className="label-text">{event.city}</p>
            {isPast && (
              <span className="ml-2 text-[10px] px-2 py-0.5 border font-body tracking-widest"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>
                PAST EVENT
              </span>
            )}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-snow font-bold mb-8"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.05' }}
          >
            {event.title}
          </motion.h1>

          {/* Gold divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="gold-line-left w-16 mb-10 origin-left"
          />

          {/* Event details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="space-y-5 mb-10"
          >
            {/* Date */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 border flex items-center justify-center shrink-0"
                style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
                <Calendar size={14} className="text-gold" />
              </div>
              <div>
                <p className="label-text mb-1 opacity-50">Date</p>
                <p className="font-body text-snow">{dateFormatted}</p>
              </div>
            </div>

            {/* Time */}
            {event.time && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 border flex items-center justify-center shrink-0"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
                  <Clock size={14} className="text-gold" />
                </div>
                <div>
                  <p className="label-text mb-1 opacity-50">Time</p>
                  <p className="font-body text-snow">{event.time}</p>
                </div>
              </div>
            )}

            {/* Venue */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 border flex items-center justify-center shrink-0"
                style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
                <MapPin size={14} className="text-gold" />
              </div>
              <div>
                <p className="label-text mb-1 opacity-50">Venue</p>
                <p className="font-body text-snow">{event.venue}</p>
                <p className="font-body text-mist text-sm">{event.city}</p>
              </div>
            </div>
          </motion.div>

          {/* Description */}
          {event.description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="font-body text-mist leading-relaxed mb-12"
            >
              {event.description}
            </motion.p>
          )}

          {/* CTA */}
          {!isPast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-8 py-4 font-body text-xs font-semibold tracking-widest uppercase transition-all duration-300"
                style={{ background: '#C9A84C', color: '#0F0F0F' }}
              >
                Register to Attend →
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-4 font-body text-xs tracking-widest uppercase border transition-all duration-300"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(248,248,248,0.6)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                  e.currentTarget.style.color = '#C9A84C'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.color = 'rgba(248,248,248,0.6)'
                }}
              >
                View All Events
              </Link>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── OTHER EVENTS ── */}
      {otherEvents.length > 0 && (
        <section className="py-24 px-6 lg:px-16"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="label-text mb-2">More Events</p>
                <h2 className="font-display text-snow text-3xl">Coming up</h2>
              </div>
              <Link href="/events"
                className="flex items-center gap-2 font-body text-xs tracking-widest uppercase text-gold hover:opacity-70 transition-opacity">
                All Events <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherEvents.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={`/events/${e.slug}`}
                    className="block border group transition-all duration-300 hover-lift"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={el => (el.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                    onMouseLeave={el => (el.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  >
                    {/* Image or placeholder */}
                    <div className="h-40 relative overflow-hidden"
                      style={{ background: '#1A1A1A' }}>
                      {e.imageUrl ? (
                        <Image src={e.imageUrl} alt={e.title} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="font-display text-3xl font-bold"
                            style={{ color: 'transparent', WebkitTextStroke: '1px rgba(201,168,76,0.2)' }}>
                            RFY
                          </span>
                        </div>
                      )}
                      {/* Date badge */}
                      <div className="absolute top-3 left-3 bg-void/90 border border-gold/30 px-2 py-1.5 text-center">
                        <p className="font-display text-xl text-gold font-bold leading-none">
                          {format(new Date(e.date), 'dd')}
                        </p>
                        <p className="label-text opacity-60 text-[9px]">
                          {format(new Date(e.date), 'MMM').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="label-text opacity-50 mb-2">{e.city}</p>
                      <h3 className="font-display text-snow text-lg leading-tight group-hover:text-gold transition-colors">
                        {e.title}
                      </h3>
                      {e.time && (
                        <p className="font-body text-mist text-xs mt-2">{e.time}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
```

---

### TASK 9 — Update EventsClientPage with Clickable Cards

Open `src/components/events/EventsClientPage.tsx`.

Wrap each event card in a `Link` to `/events/[slug]`:

```typescript
import Link from 'next/link'

// Wrap the card:
<Link
  key={event.id}
  href={`/events/${event.slug}`}
  className="block border border-white/10 hover:border-gold/30 transition-all duration-300 group cursor-pointer"
>
  {/* ... existing card content ... */}
</Link>
```

Remove the `onClick` or div wrapper if present. The entire card is now a link.

---

## ═══════════════════════════════════════
## MODULE 3 — ADMIN ROLES & USER MANAGEMENT
## ═══════════════════════════════════════

### TASK 10 — Update Prisma Schema

Update `prisma/schema.prisma`:

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  EDITOR
  MEDIA_ADMIN
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  password     String
  name         String?
  role         Role          @default(ADMIN)
  isActive     Boolean       @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  activityLogs ActivityLog[]
}

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action      String   // e.g. "Created post: You Are Not Your Past"
  module      String   // e.g. "Blog", "Scripture", "Events"
  targetId    String?  // ID of the affected resource
  targetTitle String?  // Human-readable title
  ipAddress   String?
  createdAt   DateTime @default(now())
}
```

Run: `npx prisma db push`

---

### TASK 11 — Activity Logger Helper

Create `src/lib/activity.ts`:

```typescript
import { db } from '@/lib/db'

export type ActivityModule =
  | 'Blog' | 'Scripture' | 'Study' | 'Events' | 'Gallery'
  | 'Forms' | 'Members' | 'CMS' | 'Integrations' | 'Automation'
  | 'Partnership' | 'Users' | 'Settings'

export async function logActivity({
  userId,
  action,
  module,
  targetId,
  targetTitle,
  ipAddress,
}: {
  userId: string
  action: string
  module: ActivityModule
  targetId?: string
  targetTitle?: string
  ipAddress?: string
}) {
  try {
    await db.activityLog.create({
      data: { userId, action, module, targetId, targetTitle, ipAddress },
    })
  } catch (err) {
    // Never let activity logging break the main action
    console.error('[ActivityLog] Failed to log:', err)
  }
}
```

---

### TASK 12 — Update Auth to Include Role

Update `src/lib/auth.ts` — ensure the session includes the user's role:

```typescript
// In the session callback:
callbacks: {
  async session({ session, token }) {
    if (session.user && token.sub) {
      const user = await db.user.findUnique({
        where: { id: token.sub },
        select: { id: true, role: true, name: true, email: true },
      })
      if (user) {
        session.user.id = user.id
        session.user.role = user.role
        session.user.name = user.name ?? undefined
      }
    }
    return session
  },
  async jwt({ token, user }) {
    if (user) token.sub = user.id
    return token
  },
},
```

Update `src/types/next-auth.d.ts` (create if not exists):

```typescript
import type { DefaultSession } from 'next-auth'
import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }
}
```

---

### TASK 13 — Role Permission Helper

Create `src/lib/permissions.ts`:

```typescript
import type { Role } from '@prisma/client'

type Permission =
  | 'scripture' | 'blog' | 'study' | 'events' | 'gallery'
  | 'forms' | 'members' | 'cms' | 'integrations' | 'automation'
  | 'partnership' | 'demo' | 'users' | 'activity'
  | 'delete' | 'finance'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'scripture', 'blog', 'study', 'events', 'gallery', 'forms',
    'members', 'cms', 'integrations', 'automation', 'partnership',
    'demo', 'users', 'activity', 'delete', 'finance',
  ],
  ADMIN: [
    'scripture', 'blog', 'study', 'events', 'gallery',
    'forms', 'members', 'activity',
  ],
  EDITOR: ['scripture', 'blog', 'study'],
  MEDIA_ADMIN: ['gallery'],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAccess(role: Role, module: string): boolean {
  const moduleMap: Record<string, Permission> = {
    scripture: 'scripture',
    blog: 'blog',
    study: 'study',
    events: 'events',
    gallery: 'gallery',
    forms: 'forms',
    members: 'members',
    cms: 'cms',
    integrations: 'integrations',
    automation: 'automation',
    partner: 'partnership',
    demo: 'demo',
    users: 'users',
    activity: 'activity',
  }
  const permission = moduleMap[module]
  if (!permission) return false
  return hasPermission(role, permission)
}
```

---

### TASK 14 — Update Middleware for Role-Based Access

Update `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Route → required permission mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/cms': 'cms',
  '/admin/integrations': 'integrations',
  '/admin/automation': 'automation',
  '/admin/partner': 'partnership',
  '/admin/demo': 'demo',
  '/admin/users': 'users',
  '/admin/events': 'events',
  '/admin/forms': 'forms',
  '/admin/members': 'members',
  '/admin/gallery': 'gallery',
  '/admin/scripture': 'scripture',
  '/admin/blog': 'blog',
  '/admin/study': 'study',
  '/admin/activity': 'activity',
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin/login')) return NextResponse.next()
  if (pathname.startsWith('/api/auth')) return NextResponse.next()
  if (pathname.startsWith('/api/webhooks')) return NextResponse.next()
  if (pathname.startsWith('/api/cron')) return NextResponse.next()

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!req.auth) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check role-based access
    const role = req.auth.user?.role as string
    for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        const { canAccess } = require('./lib/permissions')
        if (!canAccess(role, permission.replace('/admin/', ''))) {
          return NextResponse.redirect(new URL('/admin?unauthorized=1', req.url))
        }
        break
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

---

### TASK 15 — Admin Users API Routes

Create `src/app/api/admin/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, role: true,
      isActive: true, lastLoginAt: true, createdAt: true,
    },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, name, password, role } = await req.json()

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Email, password and role required' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: { email, name, password: hashed, role, isActive: true },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  })

  await logActivity({
    userId: session.user.id,
    action: `Created admin user: ${email} (${role})`,
    module: 'Users',
    targetId: user.id,
    targetTitle: email,
  })

  return NextResponse.json(user, { status: 201 })
}
```

Create `src/app/api/admin/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Cannot demote self
  if (params.id === session.user.id && body.role && body.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.role !== undefined) updateData.role = body.role
  if (body.isActive !== undefined) updateData.isActive = body.isActive
  if (body.password) updateData.password = await bcrypt.hash(body.password, 12)

  const user = await db.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })

  await logActivity({
    userId: session.user.id,
    action: `Updated admin user: ${user.email}`,
    module: 'Users',
    targetId: user.id,
    targetTitle: user.email,
  })

  return NextResponse.json(user)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: { email: true },
  })

  await db.user.delete({ where: { id: params.id } })

  await logActivity({
    userId: session.user.id,
    action: `Deleted admin user: ${user?.email}`,
    module: 'Users',
    targetId: params.id,
    targetTitle: user?.email,
  })

  return NextResponse.json({ success: true })
}
```

---

### TASK 16 — Activity Log API Route

Create `src/app/api/admin/activity/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(session.user.role, 'activity')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const module = searchParams.get('module')
  const userId = searchParams.get('userId')

  const where: Record<string, unknown> = {}
  if (module) where.module = module
  if (userId) where.userId = userId

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.activityLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
}
```

---

### TASK 17 — Wire Activity Logging into Key API Routes

Add `logActivity` calls to the most important API routes:

#### Blog (`src/app/api/blog/route.ts` and `[id]/route.ts`):
```typescript
import { logActivity } from '@/lib/activity'

// In POST (create):
await logActivity({
  userId: session.user.id,
  action: `Created post: ${parsed.data.title}`,
  module: 'Blog',
  targetId: post.id,
  targetTitle: parsed.data.title,
})

// In PATCH (update):
await logActivity({
  userId: session.user.id,
  action: `Updated post: ${post.title}`,
  module: 'Blog',
  targetId: params.id,
  targetTitle: post.title,
})

// In DELETE:
await logActivity({
  userId: session.user.id,
  action: `Deleted post: ${post.title}`,
  module: 'Blog',
  targetId: params.id,
  targetTitle: post.title,
})
```

Apply the same pattern to:
- `src/app/api/scripture/route.ts` — module: 'Scripture'
- `src/app/api/events/route.ts` — module: 'Events'
- `src/app/api/forms/route.ts` — module: 'Forms'
- `src/app/api/gallery/[id]/route.ts` (DELETE) — module: 'Gallery'
- `src/app/api/credentials/route.ts` (POST) — module: 'Integrations', action: 'Updated credentials: [service]'
- `src/app/api/join/fields/route.ts` (POST) — module: 'Members', action: 'Added field to join form'

---

### TASK 18 — Admin Users Page

Add Users to admin sidebar — SUPER_ADMIN only sees it (handle in sidebar render logic):

```typescript
// In AdminSidebar, filter nav items by role:
// Only show 'Users' item if role === 'SUPER_ADMIN'
```

Create `src/app/admin/(dashboard)/users/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UsersManager } from '@/components/admin/users/UsersManager'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/admin')

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, role: true,
      isActive: true, lastLoginAt: true, createdAt: true,
    },
  })

  return <UsersManager initialUsers={users} currentUserId={session.user.id} />
}
```

Create `src/components/admin/users/UsersManager.tsx`:

This component includes:

**Header:** "Admin Users" title + "+ Invite User" button

**Users Table:**
- Columns: Name/Email, Role (badge), Status, Last Login, Created, Actions
- Role badge colors: SUPER_ADMIN (gold), ADMIN (blue), EDITOR (green), MEDIA_ADMIN (purple)
- Actions: Edit role, Toggle active/inactive, Reset password, Delete (with confirmation)
- Current user row is highlighted, cannot be deleted

**Invite User Panel (slide-in):**
- Name input
- Email input
- Role selector (dropdown)
- Temporary password input
- "Create User" button → POST `/api/admin/users`

**Edit User Panel:**
- Name input
- Role selector
- Active toggle
- New password input (optional — leave blank to keep current)
- Save button → PATCH `/api/admin/users/[id]`

Style all elements using `--a-*` variables consistently.

---

### TASK 19 — Activity Log Admin Page

Add Activity to sidebar (SUPER_ADMIN + ADMIN only):

Create `src/app/admin/(dashboard)/activity/page.tsx`:

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ActivityLogViewer } from '@/components/admin/ActivityLogViewer'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const session = await auth()
  if (!session || !hasPermission(session.user.role, 'activity')) redirect('/admin')

  const [logs, users] = await Promise.all([
    db.activityLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.user.findMany({
      select: { id: true, name: true, email: true },
    }),
  ])

  return <ActivityLogViewer initialLogs={logs} users={users} />
}
```

Create `src/components/admin/ActivityLogViewer.tsx`:

This component shows:

**Header:** "Activity Log" + filter controls

**Filters:**
- Module filter dropdown (All, Blog, Scripture, Events etc.)
- User filter dropdown (All, then each admin user)
- These filter the log live (client-side for the loaded batch)

**Log table:**
- Columns: Action, Module (badge), User, Time
- Module badges with distinct colors per module
- Time shown as "X minutes/hours/days ago" using `date-fns formatDistanceToNow`
- Alternating row backgrounds
- Load more button for pagination

```typescript
'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityLog, User } from '@prisma/client'

type LogWithUser = ActivityLog & {
  user: Pick<User, 'name' | 'email' | 'role'>
}

const MODULE_COLORS: Record<string, string> = {
  Blog: '#3B82F6',
  Scripture: '#8B5CF6',
  Events: '#F59E0B',
  Gallery: '#EC4899',
  Forms: '#14B8A6',
  Members: '#22C55E',
  CMS: '#F97316',
  Integrations: '#EF4444',
  Users: '#C9A84C',
  Settings: '#6B7280',
}

interface ActivityLogViewerProps {
  initialLogs: LogWithUser[]
  users: Pick<User, 'id' | 'name' | 'email'>[]
}

export function ActivityLogViewer({ initialLogs, users }: ActivityLogViewerProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [moduleFilter, setModuleFilter] = useState('All')
  const [userFilter, setUserFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const modules = ['All', ...Array.from(new Set(logs.map(l => l.module)))]

  const filtered = useMemo(() => logs.filter(log => {
    const matchModule = moduleFilter === 'All' || log.module === moduleFilter
    const matchUser = userFilter === 'All' || log.userId === userFilter
    return matchModule && matchUser
  }), [logs, moduleFilter, userFilter])

  const loadMore = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        ...(moduleFilter !== 'All' && { module: moduleFilter }),
        ...(userFilter !== 'All' && { userId: userFilter }),
      })
      const res = await fetch(`/api/admin/activity?${params}`)
      const data = await res.json()
      setLogs(prev => [...prev, ...data.logs])
      setPage(p => p + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-semibold"
            style={{ color: 'var(--a-text)' }}>Activity Log</h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
            All admin actions across the platform
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
          className="border px-3 py-2 font-body text-sm focus:outline-none"
          style={{
            background: 'var(--a-surface)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
        >
          {modules.map(m => <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>)}
        </select>

        <select
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          className="border px-3 py-2 font-body text-sm focus:outline-none"
          style={{
            background: 'var(--a-surface)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
        >
          <option value="All">All Users</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      <div className="border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr style={{ background: 'var(--a-sidebar)', borderBottom: `1px solid var(--a-border)` }}>
                {['Action', 'Module', 'User', 'When'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest"
                    style={{ color: 'var(--a-gold)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id}
                  style={{
                    borderBottom: `1px solid var(--a-border)`,
                    background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)',
                  }}>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text)' }}>
                    {log.action}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase text-white"
                      style={{ background: MODULE_COLORS[log.module] ?? '#6B7280' }}>
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {log.user.name ?? log.user.email}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-muted)' }}>
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              No activity found
            </p>
          </div>
        )}

        <div className="p-4 border-t text-center" style={{ borderColor: 'var(--a-border)' }}>
          <button
            onClick={loadMore}
            disabled={loading}
            className="font-body text-sm transition-colors disabled:opacity-40"
            style={{ color: 'var(--a-gold)' }}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### TASK 20 — Update Admin Sidebar for Role-Based Nav

Update `src/components/admin/AdminSidebar.tsx` to filter nav items based on the current user's role:

```typescript
interface AdminSidebarProps {
  theme: 'light' | 'dark'
  userRole: string  // ADD THIS
}

// Filter nav items by role:
const visibleGroups = NAV_GROUPS.map(group => ({
  ...group,
  items: group.items.filter(item => {
    // Import canAccess from permissions
    const moduleKey = item.href.replace('/admin/', '').split('/')[0]
    return canAccess(userRole, moduleKey)
  }),
})).filter(group => group.items.length > 0)

// Use visibleGroups instead of NAV_GROUPS when rendering
```

Pass `userRole` from `AdminDashboardShell` → `AdminThemeWrapper` → `layout.tsx` via the session.

Update `AdminThemeWrapper` to fetch session and pass role:

```typescript
// In AdminThemeWrapper, get role from session:
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
const userRole = session?.user?.role ?? 'ADMIN'

// Pass to AdminDashboardShell:
<AdminDashboardShell toggleTheme={toggleTheme} theme={theme} userRole={userRole}>
```

---

### TASK 21 — Update Admin Dashboard Home for Role-Based Cards

Open `src/app/admin/(dashboard)/page.tsx`.

The Total Gifts card should only show for SUPER_ADMIN:

```typescript
const session = await auth()
const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

// In stats array, conditionally include finance card:
const stats = [
  { label: 'Community Members', value: memberCount.toLocaleString(), ... },
  { label: 'Active Forms', value: formCount.toLocaleString(), ... },
  { label: 'Form Submissions', value: submissionCount.toLocaleString(), ... },
  { label: 'Published Posts', value: postCount.toLocaleString(), ... },
  { label: 'Upcoming Events', value: eventCount.toLocaleString(), ... },
  ...(isSuperAdmin ? [{
    label: 'Total Gifts (₦)',
    value: `₦${((giftStats._sum.amount ?? 0)).toLocaleString()}`,
    icon: 'Heart',
    trend: `${giftStats._count.id} gifts`,
    trendUp: true,
  }] : []),
]
```

---

## PHASE 14 COMPLETION CHECKLIST

**Light Mode Fixes**
- [ ] Study Portal — series titles and descriptions visible in light mode
- [ ] Gallery — images loading correctly (Unsplash in remotePatterns)
- [ ] Upload zone — text visible in both light and dark modes

**Events Single Page**
- [ ] `slug` field added to Event model and pushed to DB
- [ ] All existing events have slugs (update demo data seed)
- [ ] `/events/[slug]` loads with split layout
- [ ] Image left, details right on desktop
- [ ] Stacked on mobile
- [ ] Date badge overlaid on image
- [ ] Register CTA links to `/join`
- [ ] "Other Events" section shows 3 upcoming events
- [ ] Event cards on `/events` are clickable links

**Admin Roles**
- [ ] `Role` enum updated with all 4 roles
- [ ] `ActivityLog` model created
- [ ] Session includes user role
- [ ] `permissions.ts` helper working
- [ ] Middleware blocks unauthorized role access
- [ ] Sidebar filters nav items by role
- [ ] Dashboard home hides Total Gifts from non-SUPER_ADMIN

**User Management**
- [ ] `/admin/users` accessible only to SUPER_ADMIN
- [ ] Can create new admin user with role
- [ ] Can edit role and active status
- [ ] Can delete users (not self)
- [ ] Cannot delete or demote self

**Activity Log**
- [ ] `ActivityLog` model in DB
- [ ] `logActivity` helper created
- [ ] Key API routes log actions
- [ ] `/admin/activity` shows log with filters
- [ ] Module filter works
- [ ] User filter works

**General**
- [ ] `npx prisma db push` succeeds
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `canAccess` function in middleware uses `require()` because Next.js middleware runs on the Edge runtime by default, but importing from `@/lib/permissions` should work fine as it has no Node-only dependencies. If it causes issues, inline the permission check directly in middleware.
- The `slug` field on `Event` is `@unique` — when generating slugs for existing events during migration, use `eventSlug(title, city)`. If two events have the same title+city combination, append the cuid to make it unique.
- `useSession` in `AdminThemeWrapper` requires `SessionProvider` wrapping the admin layout. Add `SessionProvider` from `next-auth/react` to the admin layout or root layout if not already present.
- The activity log never blocks the main action — `logActivity` has a try/catch that swallows errors. This is intentional.
- For the event single page, `event.slug` must be populated before the link on the events listing page works. If existing events don't have slugs, the link will 404. The demo data seed update (Task 6) handles this for seeded data; existing manually-created events will need slugs added via the admin events manager.
- `MEDIA_ADMIN` and `EDITOR` roles see a simplified dashboard — no finance cards, no settings. Their sidebar only shows their permitted modules. If they try to access a restricted URL directly, middleware redirects them to `/admin?unauthorized=1`. Add an "unauthorized" banner on the dashboard home that shows when `?unauthorized=1` is in the URL.
