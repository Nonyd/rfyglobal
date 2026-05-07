# ROOM FOR YOU — Phase 19 Cursor Prompt
## Gallery Overhaul — Admin Batch Management · Event Grouping · Multi-Select Delete · Public Masonry + Downloads

---

## CONTEXT

Phase 19 completely rebuilds the gallery system. The current gallery is a flat list of individual images with no batch management, no event grouping, and no download capability.

**New gallery architecture:**
- Images are grouped by **GalleryEvent** — a named event with a city, date, and cover image
- Admin uploads images directly into an event group (new or existing)
- Admin can add more images to any existing event at any time
- Admin can edit image details individually
- Admin can multi-select images and delete them in bulk
- Public gallery shows an immersive masonry grid filtered by month and city
- Community members can download individual images or select multiple for ZIP download

---

## TASK 1 — Prisma Schema Update

Update `prisma/schema.prisma`:

```prisma
model GalleryEvent {
  id          String         @id @default(cuid())
  name        String         // "Abuja Monthly Gathering — March 2026"
  city        String
  date        DateTime
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  images      GalleryImage[]
}

model GalleryImage {
  id            String        @id @default(cuid())
  url           String
  thumbnailUrl  String?       // Cloudinary auto-generated thumbnail
  galleryEventId String?
  galleryEvent  GalleryEvent? @relation(fields: [galleryEventId], references: [id], onDelete: SetNull)
  // Keep legacy fields for backward compatibility
  eventName     String?
  city          String?
  takenAt       DateTime?
  caption       String?
  isActive      Boolean       @default(true)
  order         Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

Run: `npx prisma db push`

---

## TASK 2 — Gallery API Routes

#### Gallery Events CRUD

Create `src/app/api/gallery/events/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const events = await db.galleryEvent.findMany({
    where: { isActive: true },
    orderBy: { date: 'desc' },
    include: {
      _count: { select: { images: true } },
      images: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        take: 1, // cover image
        select: { url: true },
      },
    },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, city, date } = await req.json()
  if (!name || !city || !date) {
    return NextResponse.json({ error: 'Name, city and date required' }, { status: 400 })
  }

  const event = await db.galleryEvent.create({
    data: { name, city, date: new Date(date) },
  })

  return NextResponse.json(event, { status: 201 })
}
```

Create `src/app/api/gallery/events/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const event = await db.galleryEvent.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  return NextResponse.json(event)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete all images in the event first
  await db.galleryImage.deleteMany({ where: { galleryEventId: params.id } })
  await db.galleryEvent.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}

// GET images for a specific event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const images = await db.galleryImage.findMany({
    where: { galleryEventId: params.id },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(images)
}
```

#### Bulk image operations

Create `src/app/api/gallery/images/bulk-delete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No image IDs provided' }, { status: 400 })
  }

  const result = await db.galleryImage.deleteMany({
    where: { id: { in: ids } },
  })

  return NextResponse.json({ deleted: result.count })
}
```

Update existing `src/app/api/gallery/[id]/route.ts` — PATCH to update image details:

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const image = await db.galleryImage.update({
    where: { id: params.id },
    data: {
      ...(body.caption !== undefined && { caption: body.caption }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.galleryEventId !== undefined && { galleryEventId: body.galleryEventId }),
      ...(body.takenAt !== undefined && { takenAt: new Date(body.takenAt) }),
    },
  })

  return NextResponse.json(image)
}
```

#### Public gallery API

Update `src/app/api/gallery/route.ts` GET:

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const month = searchParams.get('month') // format: "2026-03"

  const where: Prisma.GalleryImageWhereInput = { isActive: true }

  if (city && city !== 'all') {
    where.OR = [
      { city },
      { galleryEvent: { city } },
    ]
  }

  if (month) {
    const [year, mon] = month.split('-').map(Number)
    const start = new Date(year, mon - 1, 1)
    const end = new Date(year, mon, 0, 23, 59, 59)
    where.OR = [
      ...(where.OR ?? []),
      { takenAt: { gte: start, lte: end } },
      { createdAt: { gte: start, lte: end } },
    ]
  }

  const images = await db.galleryImage.findMany({
    where,
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      galleryEvent: { select: { name: true, city: true, date: true } },
    },
  })

  return NextResponse.json(images)
}
```

---

## TASK 3 — Admin GalleryManager Rewrite

Rewrite `src/components/admin/gallery/GalleryManager.tsx` completely.

**New admin gallery layout:**

```
HEADER
  "Gallery" title
  "+ New Event" button
  [Select Mode] toggle button

EVENTS LIST (left sidebar or accordion)
  Each event shows:
  - Event name
  - City + date
  - Image count badge
  - "Add Photos" button
  - "Edit Event" button
  - "Delete Event" button

IMAGES GRID (main area)
  When an event is selected: shows images for that event
  When "All" is selected: shows all images

  Each image card:
  - Image thumbnail
  - Checkbox (visible in select mode, or on hover)
  - Caption text overlay on hover
  - Edit button (opens slide-in)
  - Toggle active/hidden button

SELECT MODE BAR (appears at bottom when images selected)
  "{N} images selected"
  "Delete Selected" button (red, with confirm)
  "Deselect All" button
```

```typescript
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, CheckSquare, Square, X,
  Upload, ChevronDown, ChevronRight, Images, Calendar
} from 'lucide-react'
import { UploadZone } from '@/components/shared/UploadZone'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import type { GalleryImage, GalleryEvent } from '@prisma/client'

type EventWithCount = GalleryEvent & {
  _count: { images: number }
  images: { url: string }[]
}

type ImageWithEvent = GalleryImage & {
  galleryEvent?: Pick<GalleryEvent, 'name' | 'city' | 'date'> | null
}

export function GalleryManager() {
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | 'all'>('all')
  const [images, setImages] = useState<ImageWithEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Panels
  const [addPhotosEvent, setAddPhotosEvent] = useState<EventWithCount | null>(null)
  const [editImage, setEditImage] = useState<ImageWithEvent | null>(null)
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<EventWithCount | null>(null)

  // New event form
  const [newEventForm, setNewEventForm] = useState({ name: '', city: '', date: '' })
  const [savingEvent, setSavingEvent] = useState(false)

  // Load events
  useEffect(() => {
    loadEvents()
  }, [])

  // Load images when event selection changes
  useEffect(() => {
    loadImages()
  }, [selectedEventId])

  const loadEvents = async () => {
    const res = await fetch('/api/gallery/events')
    const data = await res.json()
    setEvents(data)
  }

  const loadImages = async () => {
    setLoading(true)
    try {
      const url = selectedEventId === 'all'
        ? '/api/gallery?includeHidden=true'
        : `/api/gallery/events/${selectedEventId}`
      const res = await fetch(url)
      const data = await res.json()
      setImages(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async () => {
    if (!newEventForm.name || !newEventForm.city || !newEventForm.date) {
      toast.error('Please fill in all event fields')
      return
    }
    setSavingEvent(true)
    try {
      const res = await fetch('/api/gallery/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventForm),
      })
      if (!res.ok) throw new Error('Failed to create event')
      const event = await res.json()
      await loadEvents()
      setNewEventOpen(false)
      setNewEventForm({ name: '', city: '', date: '' })
      setSelectedEventId(event.id)
      toast.success('Event created')
    } catch {
      toast.error('Failed to create event')
    } finally {
      setSavingEvent(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event and ALL its photos? This cannot be undone.')) return
    const res = await fetch(`/api/gallery/events/${eventId}`, { method: 'DELETE' })
    if (res.ok) {
      await loadEvents()
      if (selectedEventId === eventId) setSelectedEventId('all')
      await loadImages()
      toast.success('Event deleted')
    } else {
      toast.error('Failed to delete event')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(images.map(i => i.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} image${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return

    const res = await fetch('/api/gallery/images/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success(`${data.deleted} image${data.deleted > 1 ? 's' : ''} deleted`)
      setSelectedIds(new Set())
      setSelectMode(false)
      await loadImages()
      await loadEvents()
    } else {
      toast.error('Failed to delete images')
    }
  }

  const toggleImageActive = async (image: ImageWithEvent) => {
    const res = await fetch(`/api/gallery/${image.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !image.isActive }),
    })
    if (res.ok) {
      setImages(prev => prev.map(i => i.id === image.id ? { ...i, isActive: !i.isActive } : i))
    }
  }

  const saveImageEdit = async (id: string, updates: Partial<ImageWithEvent>) => {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setImages(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i))
      setEditImage(null)
      toast.success('Image updated')
    } else {
      toast.error('Failed to update image')
    }
  }

  return (
    <div className="flex gap-6 h-full min-h-[600px]">

      {/* ── LEFT: Events list ── */}
      <div className="w-72 shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-xs uppercase tracking-widest"
            style={{ color: 'var(--a-text-muted)' }}>
            Events
          </p>
          <button
            onClick={() => setNewEventOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-body font-medium text-white"
            style={{ background: 'var(--a-gold)' }}
          >
            <Plus size={12} /> New Event
          </button>
        </div>

        {/* All images option */}
        <button
          onClick={() => setSelectedEventId('all')}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-body border transition-all text-left"
          style={{
            borderColor: selectedEventId === 'all' ? 'var(--a-gold-border)' : 'var(--a-border)',
            background: selectedEventId === 'all' ? 'var(--a-gold-light)' : 'var(--a-surface)',
            color: selectedEventId === 'all' ? 'var(--a-gold)' : 'var(--a-text-secondary)',
          }}
        >
          <Images size={14} />
          All Photos
          <span className="ml-auto text-xs" style={{ color: 'var(--a-text-muted)' }}>
            {images.length}
          </span>
        </button>

        {/* Event list */}
        {events.map(event => (
          <div key={event.id}
            className="border transition-all"
            style={{
              borderColor: selectedEventId === event.id ? 'var(--a-gold-border)' : 'var(--a-border)',
              background: selectedEventId === event.id ? 'var(--a-gold-light)' : 'var(--a-surface)',
            }}
          >
            <button
              onClick={() => setSelectedEventId(event.id)}
              className="w-full flex items-start gap-2 p-3 text-left"
            >
              {/* Mini cover */}
              {event.images[0] ? (
                <div className="w-10 h-10 shrink-0 relative overflow-hidden">
                  <Image src={event.images[0].url} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 shrink-0 flex items-center justify-center"
                  style={{ background: 'var(--a-bg)' }}>
                  <Images size={14} style={{ color: 'var(--a-text-muted)' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-medium truncate"
                  style={{ color: selectedEventId === event.id ? 'var(--a-gold)' : 'var(--a-text)' }}>
                  {event.name}
                </p>
                <p className="font-body text-[10px] mt-0.5"
                  style={{ color: 'var(--a-text-muted)' }}>
                  {event.city} · {format(new Date(event.date), 'MMM yyyy')}
                </p>
                <p className="font-body text-[10px]" style={{ color: 'var(--a-gold)' }}>
                  {event._count.images} photos
                </p>
              </div>
            </button>
            {/* Event actions */}
            <div className="flex border-t" style={{ borderColor: 'var(--a-border)' }}>
              <button
                onClick={() => setAddPhotosEvent(event)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-body transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
              >
                <Upload size={10} /> Add Photos
              </button>
              <div style={{ width: '1px', background: 'var(--a-border)' }} />
              <button
                onClick={() => setEditEvent(event)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-body transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
              >
                <Pencil size={10} /> Edit
              </button>
              <div style={{ width: '1px', background: 'var(--a-border)' }} />
              <button
                onClick={() => deleteEvent(event.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-body transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
              >
                <Trash2 size={10} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── RIGHT: Images grid ── */}
      <div className="flex-1 min-w-0">
        {/* Images toolbar */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
            {images.length} photos
            {selectedEventId !== 'all' && events.find(e => e.id === selectedEventId) && (
              <span style={{ color: 'var(--a-text-muted)' }}>
                {' '}· {events.find(e => e.id === selectedEventId)?.name}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {selectedEventId !== 'all' && (
              <button
                onClick={() => setAddPhotosEvent(events.find(e => e.id === selectedEventId) ?? null)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-body font-medium text-white"
                style={{ background: 'var(--a-gold)' }}
              >
                <Upload size={12} /> Add Photos
              </button>
            )}
            <button
              onClick={() => {
                setSelectMode(p => !p)
                deselectAll()
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-body border transition-all"
              style={{
                borderColor: selectMode ? 'var(--a-gold-border)' : 'var(--a-border)',
                color: selectMode ? 'var(--a-gold)' : 'var(--a-text-secondary)',
                background: selectMode ? 'var(--a-gold-light)' : 'var(--a-surface)',
              }}
            >
              <CheckSquare size={12} />
              {selectMode ? 'Cancel Select' : 'Select'}
            </button>
            {selectMode && images.length > 0 && (
              <button
                onClick={selectedIds.size === images.length ? deselectAll : selectAll}
                className="px-3 py-2 text-xs font-body border transition-all"
                style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
              >
                {selectedIds.size === images.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* Images masonry grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Loading images…
            </p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed"
            style={{ borderColor: 'var(--a-border)' }}>
            <Images size={32} style={{ color: 'var(--a-text-muted)' }} className="mb-3" />
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              No images yet
            </p>
            {selectedEventId !== 'all' && (
              <button
                onClick={() => setAddPhotosEvent(events.find(e => e.id === selectedEventId) ?? null)}
                className="mt-3 px-4 py-2 text-xs font-body font-medium text-white"
                style={{ background: 'var(--a-gold)' }}
              >
                Upload Photos
              </button>
            )}
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {images.map(image => (
              <div key={image.id}
                className="break-inside-avoid relative group overflow-hidden border"
                style={{ borderColor: 'var(--a-border)' }}
              >
                {/* Checkbox */}
                {(selectMode) && (
                  <button
                    onClick={() => toggleSelect(image.id)}
                    className="absolute top-2 left-2 z-20 w-6 h-6 flex items-center justify-center"
                    style={{
                      background: selectedIds.has(image.id)
                        ? 'var(--a-gold)'
                        : 'rgba(0,0,0,0.6)',
                      border: `2px solid ${selectedIds.has(image.id) ? 'var(--a-gold)' : 'rgba(255,255,255,0.4)'}`,
                    }}
                  >
                    {selectedIds.has(image.id) && (
                      <span className="text-void text-xs font-bold">✓</span>
                    )}
                  </button>
                )}

                {/* Hidden indicator */}
                {!image.isActive && (
                  <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 text-[10px] font-body"
                    style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)' }}>
                    HIDDEN
                  </div>
                )}

                {/* Image */}
                <Image
                  src={image.url}
                  alt={image.caption ?? ''}
                  width={400}
                  height={300}
                  className={`w-full h-auto object-cover transition-opacity ${!image.isActive ? 'opacity-40' : ''}`}
                  style={{ background: 'var(--a-bg)' }}
                  onClick={() => selectMode && toggleSelect(image.id)}
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2"
                  style={{ background: 'rgba(0,0,0,0.65)' }}>
                  {/* Caption */}
                  {image.caption && (
                    <p className="font-body text-[10px] text-white leading-tight line-clamp-2">
                      {image.caption}
                    </p>
                  )}
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 mt-auto">
                    <button
                      onClick={() => setEditImage(image)}
                      className="w-7 h-7 flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--a-gold)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => toggleImageActive(image)}
                      className="w-7 h-7 flex items-center justify-center transition-colors text-xs font-bold"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                      title={image.isActive ? 'Hide image' : 'Show image'}
                    >
                      {image.isActive ? '👁' : '🚫'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BULK SELECT BAR ── */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 shadow-xl"
            style={{
              background: 'var(--a-surface)',
              border: '1px solid var(--a-border)',
              boxShadow: 'var(--a-shadow-md)',
            }}
          >
            <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
              {selectedIds.size} image{selectedIds.size > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-2 px-4 py-2 text-xs font-body font-medium text-white"
              style={{ background: 'var(--a-red)' }}
            >
              <Trash2 size={12} />
              Delete Selected
            </button>
            <button
              onClick={deselectAll}
              className="p-1.5 transition-colors"
              style={{ color: 'var(--a-text-muted)' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NEW EVENT PANEL ── */}
      <AnimatePresence>
        {newEventOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setNewEventOpen(false)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
              style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
            >
              <div className="p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
                    New Gallery Event
                  </h3>
                  <button onClick={() => setNewEventOpen(false)} style={{ color: 'var(--a-text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="h-px" style={{ background: 'var(--a-border)' }} />

                <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
                  Create an event group to organize your gallery photos.
                  You can upload photos directly after creating the event.
                </p>

                {[
                  { label: 'Event Name', key: 'name', placeholder: 'e.g. Abuja Monthly Gathering — May 2026', type: 'text' },
                  { label: 'City', key: 'city', placeholder: 'e.g. Abuja', type: 'text' },
                  { label: 'Event Date', key: 'date', placeholder: '', type: 'date' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
                      style={{ color: 'var(--a-text-secondary)' }}>
                      {field.label} *
                    </label>
                    <input
                      type={field.type}
                      value={(newEventForm as Record<string, string>)[field.key]}
                      onChange={e => setNewEventForm(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
                      style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
                    />
                  </div>
                ))}

                <button
                  onClick={createEvent}
                  disabled={savingEvent}
                  className="w-full py-3 font-body text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
                  style={{ background: 'var(--a-gold)' }}
                >
                  {savingEvent ? 'Creating…' : 'Create Event & Upload Photos'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD PHOTOS TO EVENT PANEL ── */}
      <AnimatePresence>
        {addPhotosEvent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddPhotosEvent(null)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
              style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
            >
              <div className="p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-xs uppercase tracking-widest mb-1"
                      style={{ color: 'var(--a-gold)' }}>
                      Upload Photos
                    </p>
                    <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
                      {addPhotosEvent.name}
                    </h3>
                    <p className="font-body text-xs mt-1" style={{ color: 'var(--a-text-muted)' }}>
                      {addPhotosEvent.city} · {format(new Date(addPhotosEvent.date), 'MMMM yyyy')}
                    </p>
                  </div>
                  <button onClick={() => setAddPhotosEvent(null)} style={{ color: 'var(--a-text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="h-px" style={{ background: 'var(--a-border)' }} />

                <UploadZone
                  folder="gallery"
                  multiple={true}
                  accept="image/*"
                  onComplete={async (urls: string[]) => {
                    // Save each uploaded image to this event
                    const maxOrder = addPhotosEvent._count.images
                    await Promise.all(
                      urls.map((url, idx) =>
                        fetch('/api/gallery', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            url,
                            galleryEventId: addPhotosEvent.id,
                            city: addPhotosEvent.city,
                            takenAt: addPhotosEvent.date,
                            order: maxOrder + idx,
                          }),
                        })
                      )
                    )
                    toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded`)
                    setAddPhotosEvent(null)
                    await loadEvents()
                    await loadImages()
                  }}
                />

                <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                  Photos will be added to "{addPhotosEvent.name}". You can upload multiple images at once.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── EDIT IMAGE PANEL ── */}
      <AnimatePresence>
        {editImage && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditImage(null)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
              style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
            >
              <EditImagePanel
                image={editImage}
                events={events}
                onSave={saveImageEdit}
                onClose={() => setEditImage(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Edit image panel sub-component
function EditImagePanel({
  image,
  events,
  onSave,
  onClose,
}: {
  image: ImageWithEvent
  events: EventWithCount[]
  onSave: (id: string, updates: Partial<ImageWithEvent>) => Promise<void>
  onClose: () => void
}) {
  const [caption, setCaption] = useState(image.caption ?? '')
  const [galleryEventId, setGalleryEventId] = useState(image.galleryEventId ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(image.id, { caption, galleryEventId: galleryEventId || null })
    setSaving(false)
  }

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Edit Image
        </h3>
        <button onClick={onClose} style={{ color: 'var(--a-text-muted)' }}>
          <X size={20} />
        </button>
      </div>
      <div className="h-px" style={{ background: 'var(--a-border)' }} />

      {/* Preview */}
      <div className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4/3', background: 'var(--a-bg)' }}>
        <Image src={image.url} alt="" fill className="object-contain" />
      </div>

      {/* Caption */}
      <div>
        <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
          style={{ color: 'var(--a-text-secondary)' }}>Caption</label>
        <input
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Add a caption…"
          className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
          style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
          onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
        />
      </div>

      {/* Move to event */}
      <div>
        <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
          style={{ color: 'var(--a-text-secondary)' }}>Event Group</label>
        <select
          value={galleryEventId}
          onChange={e => setGalleryEventId(e.target.value)}
          className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
          style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
        >
          <option value="">No event group</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <p className="font-body text-xs mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Move this image to a different event group
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 font-body text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
        style={{ background: 'var(--a-gold)' }}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
```

---

## TASK 4 — Public Gallery Redesign

Rewrite `src/components/gallery/GalleryClient.tsx` (or `GalleryPage`):

**New public gallery design:**
- Immersive full-width masonry grid
- Cinematic dark background
- Filter bar: Month pills + City pills
- Lightbox with download button
- Multi-select mode for ZIP download
- Each image shows caption and event name on hover

```typescript
'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, X, ChevronLeft, ChevronRight,
  CheckSquare, Archive, ZoomIn
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface GalleryImageData {
  id: string
  url: string
  caption?: string | null
  city?: string | null
  takenAt?: string | null
  createdAt: string
  galleryEvent?: {
    name: string
    city: string
    date: string
  } | null
}

interface PublicGalleryClientProps {
  images: GalleryImageData[]
}

export function PublicGalleryClient({ images }: PublicGalleryClientProps) {
  const [cityFilter, setCityFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  // Extract unique cities and months from images
  const cities = useMemo(() => {
    const set = new Set<string>()
    images.forEach(img => {
      const city = img.galleryEvent?.city ?? img.city
      if (city) set.add(city)
    })
    return Array.from(set).sort()
  }, [images])

  const months = useMemo(() => {
    const set = new Set<string>()
    images.forEach(img => {
      const date = img.takenAt ?? img.galleryEvent?.date ?? img.createdAt
      if (date) set.add(format(new Date(date), 'yyyy-MM'))
    })
    return Array.from(set).sort().reverse()
  }, [images])

  // Filter images
  const filtered = useMemo(() => {
    return images.filter(img => {
      const city = img.galleryEvent?.city ?? img.city
      const date = img.takenAt ?? img.galleryEvent?.date ?? img.createdAt
      const month = date ? format(new Date(date), 'yyyy-MM') : null

      const matchCity = cityFilter === 'all' || city === cityFilter
      const matchMonth = monthFilter === 'all' || month === monthFilter

      return matchCity && matchMonth
    })
  }, [images, cityFilter, monthFilter])

  const openLightbox = (index: number) => {
    if (selectMode) return
    setLightboxIndex(index)
  }

  const closeLightbox = () => setLightboxIndex(null)

  const prevImage = () => {
    if (lightboxIndex === null) return
    setLightboxIndex(i => i === 0 ? filtered.length - 1 : (i ?? 1) - 1)
  }

  const nextImage = () => {
    if (lightboxIndex === null) return
    setLightboxIndex(i => ((i ?? 0) + 1) % filtered.length)
  }

  const downloadImage = async (url: string, filename?: string) => {
    try {
      // Use Cloudinary's fl_attachment for direct download
      const downloadUrl = url.includes('cloudinary')
        ? url.replace('/upload/', '/upload/fl_attachment/')
        : url
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename ?? `rfy-photo-${Date.now()}.jpg`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      toast.error('Failed to download image')
    }
  }

  const downloadZip = async () => {
    if (selectedIds.size === 0) return
    setDownloading(true)
    toast.loading('Preparing download…', { id: 'zip-download' })

    try {
      // Download each image individually (ZIP requires server-side processing)
      // For now, download each selected image with a small delay
      const selectedImages = filtered.filter(img => selectedIds.has(img.id))
      for (let i = 0; i < selectedImages.length; i++) {
        await downloadImage(selectedImages[i].url, `rfy-photo-${i + 1}.jpg`)
        await new Promise(r => setTimeout(r, 300))
      }
      toast.success(`${selectedImages.length} photos downloaded`, { id: 'zip-download' })
      setSelectMode(false)
      setSelectedIds(new Set())
    } catch {
      toast.error('Download failed', { id: 'zip-download' })
    } finally {
      setDownloading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const currentImage = lightboxIndex !== null ? filtered[lightboxIndex] : null

  return (
    <div className="min-h-screen bg-void">

      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="label-text mb-1">{filtered.length} photos</p>
          </div>

          {/* Select / Download controls */}
          <div className="flex items-center gap-3">
            {selectMode && selectedIds.size > 0 && (
              <button
                onClick={downloadZip}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 font-body text-xs font-semibold tracking-widest uppercase text-void transition-all disabled:opacity-50"
                style={{ background: '#C9A84C' }}
              >
                <Archive size={12} />
                Download {selectedIds.size} Photo{selectedIds.size > 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => {
                setSelectMode(p => !p)
                setSelectedIds(new Set())
              }}
              className="flex items-center gap-2 px-4 py-2.5 font-body text-xs tracking-widest uppercase border transition-all"
              style={{
                borderColor: selectMode ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.15)',
                color: selectMode ? '#C9A84C' : 'rgba(248,248,248,0.6)',
              }}
            >
              <CheckSquare size={12} />
              {selectMode ? 'Cancel' : 'Select Photos'}
            </button>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className="flex flex-wrap gap-6 mt-6">
          {/* Month filter */}
          {months.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="label-text opacity-40 text-[10px]">Month</p>
              <button
                onClick={() => setMonthFilter('all')}
                className="px-3 py-1 font-body text-xs tracking-wide transition-all"
                style={{
                  background: monthFilter === 'all' ? '#C9A84C' : 'transparent',
                  color: monthFilter === 'all' ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
                  border: monthFilter === 'all' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                All
              </button>
              {months.map(m => (
                <button key={m}
                  onClick={() => setMonthFilter(m)}
                  className="px-3 py-1 font-body text-xs tracking-wide transition-all"
                  style={{
                    background: monthFilter === m ? '#C9A84C' : 'transparent',
                    color: monthFilter === m ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
                    border: monthFilter === m ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {format(new Date(m + '-01'), 'MMM yyyy')}
                </button>
              ))}
            </div>
          )}

          {/* City filter */}
          {cities.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="label-text opacity-40 text-[10px]">City</p>
              <button
                onClick={() => setCityFilter('all')}
                className="px-3 py-1 font-body text-xs tracking-wide transition-all"
                style={{
                  background: cityFilter === 'all' ? '#C9A84C' : 'transparent',
                  color: cityFilter === 'all' ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
                  border: cityFilter === 'all' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                All
              </button>
              {cities.map(city => (
                <button key={city}
                  onClick={() => setCityFilter(city)}
                  className="px-3 py-1 font-body text-xs tracking-wide transition-all"
                  style={{
                    background: cityFilter === city ? '#C9A84C' : 'transparent',
                    color: cityFilter === city ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
                    border: cityFilter === city ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MASONRY GRID ── */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-snow text-2xl mb-3">No photos found</p>
            <p className="font-body text-mist text-sm">Try a different filter</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3">
            {filtered.map((image, index) => {
              const isSelected = selectedIds.has(image.id)
              const eventName = image.galleryEvent?.name ?? image.caption
              const city = image.galleryEvent?.city ?? image.city
              const date = image.takenAt ?? image.galleryEvent?.date ?? image.createdAt

              return (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.5) }}
                  className="break-inside-avoid relative group overflow-hidden cursor-pointer"
                  onClick={() => selectMode ? toggleSelect(image.id) : openLightbox(index)}
                >
                  {/* Checkbox overlay in select mode */}
                  {selectMode && (
                    <div
                      className="absolute top-3 left-3 z-20 w-6 h-6 flex items-center justify-center border-2 transition-all"
                      style={{
                        background: isSelected ? '#C9A84C' : 'rgba(0,0,0,0.6)',
                        borderColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {isSelected && <span className="text-void text-xs font-bold">✓</span>}
                    </div>
                  )}

                  {/* Image */}
                  <Image
                    src={image.url}
                    alt={eventName ?? 'Room For You gallery'}
                    width={600}
                    height={400}
                    className={`w-full h-auto object-cover transition-all duration-500 group-hover:scale-105 ${isSelected ? 'brightness-75' : ''}`}
                  />

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}
                  >
                    {/* Download button */}
                    {!selectMode && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          downloadImage(image.url)
                        }}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#C9A84C')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
                        title="Download photo"
                      >
                        <Download size={14} />
                      </button>
                    )}

                    {/* Caption */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {eventName && (
                        <p className="font-body text-white text-xs font-medium line-clamp-1">
                          {eventName}
                        </p>
                      )}
                      {(city || date) && (
                        <p className="font-body text-white/60 text-[10px] mt-0.5">
                          {city}{city && date ? ' · ' : ''}{date ? format(new Date(date), 'MMM yyyy') : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIndex !== null && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.95)' }}
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#C9A84C')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              <X size={18} />
            </button>

            {/* Download in lightbox */}
            <button
              onClick={e => {
                e.stopPropagation()
                downloadImage(currentImage.url)
              }}
              className="absolute top-6 right-20 z-10 flex items-center gap-2 px-4 py-2.5 font-body text-xs tracking-widest uppercase transition-all"
              style={{ background: '#C9A84C', color: '#0F0F0F' }}
            >
              <Download size={13} />
              Download
            </button>

            {/* Prev */}
            {filtered.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl max-h-[85vh] w-full mx-16"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={currentImage.url}
                alt={currentImage.caption ?? ''}
                width={1200}
                height={900}
                className="w-full h-full object-contain"
                style={{ maxHeight: '85vh' }}
              />

              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 p-4"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                {(currentImage.galleryEvent?.name ?? currentImage.caption) && (
                  <p className="font-body text-white text-sm">
                    {currentImage.galleryEvent?.name ?? currentImage.caption}
                  </p>
                )}
                <p className="font-body text-white/50 text-xs mt-0.5">
                  {lightboxIndex + 1} / {filtered.length}
                </p>
              </div>
            </motion.div>

            {/* Next */}
            {filtered.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## TASK 5 — Update Public Gallery Page

Update `src/app/(public)/gallery/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PublicGalleryClient } from '@/components/gallery/PublicGalleryClient'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      galleryEvent: { select: { name: true, city: true, date: true } },
    },
  })

  return (
    <>
      <Navbar />
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
          <p className="label-text mb-3">Gallery</p>
          <h1 className="font-display text-snow font-bold mb-2"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            Moments.
          </h1>
          <p className="font-body text-mist">
            A record of what God has done in our gatherings.
          </p>
        </div>
        <PublicGalleryClient images={images} />
      </main>
      <Footer />
    </>
  )
}
```

---

## PHASE 19 COMPLETION CHECKLIST

**Schema**
- [ ] `GalleryEvent` model created and pushed to DB
- [ ] `GalleryImage.galleryEventId` relation added

**Admin Gallery**
- [ ] Events list on left sidebar
- [ ] Create new event (name, city, date)
- [ ] Upload photos to event via "Add Photos"
- [ ] Upload more photos to existing event
- [ ] Edit event (name, city, date)
- [ ] Delete event + all its photos (with confirm)
- [ ] Edit individual image (caption, move to different event)
- [ ] Toggle image hidden/visible
- [ ] Select mode — checkbox on each image
- [ ] Select All / Deselect All
- [ ] Bulk delete selected images (with confirm)
- [ ] Bulk select bar appears at bottom when images selected

**Public Gallery**
- [ ] Masonry grid layout
- [ ] Month filter pills
- [ ] City filter pills
- [ ] Hover: download button + caption overlay
- [ ] Single image download works
- [ ] Lightbox opens on click
- [ ] Lightbox prev/next navigation
- [ ] Lightbox download button
- [ ] Select mode for multi-download
- [ ] Multi-download triggers sequential downloads

**General**
- [ ] `npx prisma db push` succeeds
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `GalleryEvent` is separate from the `Event` model (which is for Room For You meetings). `GalleryEvent` is specifically for organizing gallery photos. The names might be similar but they serve different purposes.
- The ZIP download approach uses sequential individual file downloads with a 300ms delay between each — true ZIP requires server-side processing which needs Node streams. The sequential download approach works well for up to ~20 images. Add a note in the UI: "Photos will download individually."
- For Cloudinary downloads, the URL transform `/upload/fl_attachment/` triggers a browser download instead of opening in a new tab. This only works for images stored in Cloudinary. For external URLs (old Unsplash images), use a plain `<a download>` link.
- The `columns-*` CSS approach for masonry does NOT work perfectly with dynamic heights in all browsers. If images don't masonry correctly, switch to a CSS Grid with `grid-auto-rows: 1px` and JavaScript to calculate row spans.
- Keep the old `GalleryManager` as a backup until the new one is verified working. The old gallery images (with `galleryEventId: null`) should still appear in the "All Photos" view.
- Run `npx prisma db push` before deploying — the new `GalleryEvent` model must exist in the DB first.
