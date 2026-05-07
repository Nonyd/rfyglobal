'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  CheckSquare,
  X,
  Upload,
  Images,
} from 'lucide-react'
import { UploadZone, type UploadedFile } from '@/components/shared/UploadZone'
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

type EventForm = {
  name: string
  city: string
  date: string
}

const EMPTY_EVENT_FORM: EventForm = { name: '', city: '', date: '' }

export function GalleryManager() {
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | 'all'>('all')
  const [images, setImages] = useState<ImageWithEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [addPhotosEvent, setAddPhotosEvent] = useState<EventWithCount | null>(null)
  const [editImage, setEditImage] = useState<ImageWithEvent | null>(null)
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<EventWithCount | null>(null)

  const [newEventForm, setNewEventForm] = useState<EventForm>(EMPTY_EVENT_FORM)
  const [savingEvent, setSavingEvent] = useState(false)

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/gallery/events')
      if (!res.ok) throw new Error('Failed to load events')
      const data = (await res.json()) as EventWithCount[]
      setEvents(data)
    } catch {
      toast.error('Failed to load events')
    }
  }, [])

  const loadImages = useCallback(async () => {
    setLoading(true)
    try {
      const url =
        selectedEventId === 'all'
          ? '/api/gallery?includeHidden=true'
          : `/api/gallery/events/${selectedEventId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load images')
      const data = (await res.json()) as ImageWithEvent[]
      setImages(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load images')
      setImages([])
    } finally {
      setLoading(false)
    }
  }, [selectedEventId])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  useEffect(() => {
    void loadImages()
  }, [loadImages])

  const createEvent = async () => {
    if (!newEventForm.name.trim() || !newEventForm.city.trim() || !newEventForm.date) {
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
      const event = (await res.json()) as GalleryEvent
      await loadEvents()
      setNewEventOpen(false)
      setNewEventForm(EMPTY_EVENT_FORM)
      setSelectedEventId(event.id)
      toast.success('Event created')
    } catch {
      toast.error('Failed to create event')
    } finally {
      setSavingEvent(false)
    }
  }

  const updateEvent = async (eventId: string, updates: Partial<EventForm> & { isActive?: boolean }) => {
    const res = await fetch(`/api/gallery/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      toast.error('Failed to update event')
      return
    }
    toast.success('Event updated')
    await loadEvents()
    setEditEvent(null)
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event and ALL its photos? This cannot be undone.')) return
    const res = await fetch(`/api/gallery/events/${eventId}`, { method: 'DELETE' })
    if (res.ok) {
      await loadEvents()
      if (selectedEventId === eventId) {
        setSelectedEventId('all')
      } else {
        await loadImages()
      }
      toast.success('Event deleted')
    } else {
      toast.error('Failed to delete event')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(images.map((i) => i.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    if (!confirm(`Delete ${count} image${count > 1 ? 's' : ''}? This cannot be undone.`)) return

    const res = await fetch('/api/gallery/images/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })

    if (res.ok) {
      const data = (await res.json()) as { deleted: number }
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
      setImages((prev) =>
        prev.map((i) => (i.id === image.id ? { ...i, isActive: !i.isActive } : i)),
      )
    } else {
      toast.error('Failed to update image')
    }
  }

  const saveImageEdit = async (id: string, updates: Partial<ImageWithEvent>) => {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = (await res.json()) as ImageWithEvent
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)))
      setEditImage(null)
      await loadEvents()
      toast.success('Image updated')
    } else {
      toast.error('Failed to update image')
    }
  }

  const handleAddPhotosUpload = async (files: UploadedFile[]) => {
    if (!addPhotosEvent || files.length === 0) return
    const baseOrder = addPhotosEvent._count.images
    const isoDate = new Date(addPhotosEvent.date).toISOString()
    try {
      await Promise.all(
        files.map((file, idx) =>
          fetch('/api/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: file.url,
              galleryEventId: addPhotosEvent.id,
              city: addPhotosEvent.city,
              takenAt: isoDate,
              order: baseOrder + idx,
            }),
          }),
        ),
      )
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded`)
      setAddPhotosEvent(null)
      await loadEvents()
      await loadImages()
    } catch {
      toast.error('Failed to attach uploaded photos')
    }
  }

  const currentEvent = events.find((e) => e.id === selectedEventId) ?? null
  const allSelected = images.length > 0 && selectedIds.size === images.length

  return (
    <div className="relative flex min-h-[600px] flex-col gap-6 lg:flex-row">
      {/* ── LEFT: Events list ── */}
      <aside className="w-full shrink-0 space-y-2 lg:w-72">
        <div className="mb-4 flex items-center justify-between">
          <p
            className="font-body text-xs uppercase tracking-widest"
            style={{ color: 'var(--a-text-muted)' }}
          >
            Events
          </p>
          <button
            type="button"
            onClick={() => setNewEventOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 font-body text-xs font-medium text-white"
            style={{ background: 'var(--a-gold)' }}
          >
            <Plus size={12} /> New Event
          </button>
        </div>

        {/* All photos */}
        <button
          type="button"
          onClick={() => setSelectedEventId('all')}
          className="flex w-full items-center gap-2 border px-3 py-2.5 text-left font-body text-sm transition-all"
          style={{
            borderColor:
              selectedEventId === 'all' ? 'var(--a-gold-border)' : 'var(--a-border)',
            background:
              selectedEventId === 'all' ? 'var(--a-gold-light)' : 'var(--a-surface)',
            color:
              selectedEventId === 'all' ? 'var(--a-gold)' : 'var(--a-text-secondary)',
          }}
        >
          <Images size={14} />
          All Photos
        </button>

        {/* Event list */}
        {events.map((event) => {
          const isSelected = selectedEventId === event.id
          return (
            <div
              key={event.id}
              className="border transition-all"
              style={{
                borderColor: isSelected ? 'var(--a-gold-border)' : 'var(--a-border)',
                background: isSelected ? 'var(--a-gold-light)' : 'var(--a-surface)',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className="flex w-full items-start gap-2 p-3 text-left"
              >
                {event.images[0] ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden">
                    <Image src={event.images[0].url} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center"
                    style={{ background: 'var(--a-bg)' }}
                  >
                    <Images size={14} style={{ color: 'var(--a-text-muted)' }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate font-body text-xs font-medium"
                    style={{ color: isSelected ? 'var(--a-gold)' : 'var(--a-text)' }}
                  >
                    {event.name}
                  </p>
                  <p
                    className="mt-0.5 font-body text-[10px]"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    {event.city} · {format(new Date(event.date), 'MMM yyyy')}
                  </p>
                  <p className="font-body text-[10px]" style={{ color: 'var(--a-gold)' }}>
                    {event._count.images} photo{event._count.images === 1 ? '' : 's'}
                  </p>
                </div>
              </button>

              <div className="flex border-t" style={{ borderColor: 'var(--a-border)' }}>
                <button
                  type="button"
                  onClick={() => setAddPhotosEvent(event)}
                  className="flex flex-1 items-center justify-center gap-1 py-1.5 font-body text-[10px] transition-colors"
                  style={{ color: 'var(--a-text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                >
                  <Upload size={10} /> Add Photos
                </button>
                <div style={{ width: '1px', background: 'var(--a-border)' }} />
                <button
                  type="button"
                  onClick={() => setEditEvent(event)}
                  className="flex flex-1 items-center justify-center gap-1 py-1.5 font-body text-[10px] transition-colors"
                  style={{ color: 'var(--a-text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                >
                  <Pencil size={10} /> Edit
                </button>
                <div style={{ width: '1px', background: 'var(--a-border)' }} />
                <button
                  type="button"
                  onClick={() => void deleteEvent(event.id)}
                  className="flex flex-1 items-center justify-center gap-1 py-1.5 font-body text-[10px] transition-colors"
                  style={{ color: 'var(--a-text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>
          )
        })}

        {events.length === 0 && (
          <div
            className="border border-dashed p-4 text-center"
            style={{ borderColor: 'var(--a-border)' }}
          >
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
              No events yet. Create one to organize photos.
            </p>
          </div>
        )}
      </aside>

      {/* ── RIGHT: Images grid ── */}
      <section className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
            {images.length} photo{images.length === 1 ? '' : 's'}
            {currentEvent && (
              <span style={{ color: 'var(--a-text-muted)' }}> · {currentEvent.name}</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {currentEvent && (
              <button
                type="button"
                onClick={() => setAddPhotosEvent(currentEvent)}
                className="flex items-center gap-1.5 px-3 py-2 font-body text-xs font-medium text-white"
                style={{ background: 'var(--a-gold)' }}
              >
                <Upload size={12} /> Add Photos
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectMode((p) => !p)
                deselectAll()
              }}
              className="flex items-center gap-1.5 border px-3 py-2 font-body text-xs transition-all"
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
                type="button"
                onClick={allSelected ? deselectAll : selectAll}
                className="border px-3 py-2 font-body text-xs transition-all"
                style={{
                  borderColor: 'var(--a-border)',
                  color: 'var(--a-text-secondary)',
                  background: 'var(--a-surface)',
                }}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Loading images…
            </p>
          </div>
        ) : images.length === 0 ? (
          <div
            className="flex h-48 flex-col items-center justify-center border border-dashed"
            style={{ borderColor: 'var(--a-border)' }}
          >
            <Images size={32} className="mb-3" style={{ color: 'var(--a-text-muted)' }} />
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              No images yet
            </p>
            {currentEvent && (
              <button
                type="button"
                onClick={() => setAddPhotosEvent(currentEvent)}
                className="mt-3 px-4 py-2 font-body text-xs font-medium text-white"
                style={{ background: 'var(--a-gold)' }}
              >
                Upload Photos
              </button>
            )}
          </div>
        ) : (
          <div className="columns-2 gap-3 space-y-3 md:columns-3 lg:columns-4">
            {images.map((image) => {
              const isSelected = selectedIds.has(image.id)
              return (
                <div
                  key={image.id}
                  className="group relative break-inside-avoid overflow-hidden border"
                  style={{ borderColor: 'var(--a-border)' }}
                >
                  {selectMode && (
                    <button
                      type="button"
                      onClick={() => toggleSelect(image.id)}
                      className="absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center"
                      style={{
                        background: isSelected ? 'var(--a-gold)' : 'rgba(0,0,0,0.6)',
                        border: `2px solid ${
                          isSelected ? 'var(--a-gold)' : 'rgba(255,255,255,0.4)'
                        }`,
                      }}
                      aria-label={isSelected ? 'Deselect image' : 'Select image'}
                    >
                      {isSelected && (
                        <span className="text-xs font-bold text-void">✓</span>
                      )}
                    </button>
                  )}

                  {!image.isActive && (
                    <div
                      className="absolute right-2 top-2 z-20 px-1.5 py-0.5 font-body text-[10px]"
                      style={{
                        background: 'rgba(0,0,0,0.7)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      HIDDEN
                    </div>
                  )}

                  <Image
                    src={image.url}
                    alt={image.caption ?? ''}
                    width={400}
                    height={300}
                    className={`h-auto w-full object-cover transition-opacity ${
                      !image.isActive ? 'opacity-40' : ''
                    }`}
                    style={{ background: 'var(--a-bg)' }}
                    onClick={() => selectMode && toggleSelect(image.id)}
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />

                  <div
                    className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.65)' }}
                  >
                    {image.caption && (
                      <p className="line-clamp-2 font-body text-[10px] leading-tight text-white">
                        {image.caption}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditImage(image)}
                        className="flex h-7 w-7 items-center justify-center transition-colors"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--a-gold)')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')
                        }
                        aria-label="Edit image"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleImageActive(image)}
                        className="px-2 py-1 font-body text-[9px] uppercase tracking-widest transition-colors"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                        title={image.isActive ? 'Hide image' : 'Show image'}
                      >
                        {image.isActive ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── BULK SELECT BAR ── */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 px-6 py-3 shadow-xl"
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
              type="button"
              onClick={() => void bulkDelete()}
              className="flex items-center gap-2 px-4 py-2 font-body text-xs font-medium text-white"
              style={{ background: 'var(--a-red)' }}
            >
              <Trash2 size={12} /> Delete Selected
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="p-1.5 transition-colors"
              style={{ color: 'var(--a-text-muted)' }}
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NEW EVENT PANEL ── */}
      <AnimatePresence>
        {newEventOpen && (
          <SlideOver onClose={() => setNewEventOpen(false)} maxWidth="max-w-md">
            <div className="space-y-5 p-8">
              <div className="flex items-center justify-between">
                <h3
                  className="font-display text-xl font-semibold"
                  style={{ color: 'var(--a-text)' }}
                >
                  New Gallery Event
                </h3>
                <button
                  type="button"
                  onClick={() => setNewEventOpen(false)}
                  style={{ color: 'var(--a-text-muted)' }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="h-px" style={{ background: 'var(--a-border)' }} />

              <p
                className="font-body text-xs leading-relaxed"
                style={{ color: 'var(--a-text-muted)' }}
              >
                Create an event group to organise your gallery photos. You can upload photos
                directly after creating the event.
              </p>

              <EventFields form={newEventForm} setForm={setNewEventForm} />

              <button
                type="button"
                onClick={() => void createEvent()}
                disabled={savingEvent}
                className="w-full py-3 font-body text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
                style={{ background: 'var(--a-gold)' }}
              >
                {savingEvent ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </SlideOver>
        )}
      </AnimatePresence>

      {/* ── EDIT EVENT PANEL ── */}
      <AnimatePresence>
        {editEvent && (
          <EditEventPanel
            event={editEvent}
            onSave={async (updates) => updateEvent(editEvent.id, updates)}
            onClose={() => setEditEvent(null)}
          />
        )}
      </AnimatePresence>

      {/* ── ADD PHOTOS PANEL ── */}
      <AnimatePresence>
        {addPhotosEvent && (
          <SlideOver onClose={() => setAddPhotosEvent(null)} maxWidth="max-w-lg">
            <div className="space-y-5 p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="mb-1 font-body text-xs uppercase tracking-widest"
                    style={{ color: 'var(--a-gold)' }}
                  >
                    Upload Photos
                  </p>
                  <h3
                    className="font-display text-xl font-semibold"
                    style={{ color: 'var(--a-text)' }}
                  >
                    {addPhotosEvent.name}
                  </h3>
                  <p
                    className="mt-1 font-body text-xs"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    {addPhotosEvent.city} ·{' '}
                    {format(new Date(addPhotosEvent.date), 'MMMM yyyy')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddPhotosEvent(null)}
                  style={{ color: 'var(--a-text-muted)' }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="h-px" style={{ background: 'var(--a-border)' }} />

              <UploadZone
                folder="gallery"
                accept="image"
                maxFiles={100}
                preview
                label="Drop up to 100 photos here, or click to browse"
                onUploadComplete={(files) => void handleAddPhotosUpload(files)}
                onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
              />

              <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                Photos will be added to &ldquo;{addPhotosEvent.name}&rdquo;. You can upload
                multiple images at once.
              </p>
            </div>
          </SlideOver>
        )}
      </AnimatePresence>

      {/* ── EDIT IMAGE PANEL ── */}
      <AnimatePresence>
        {editImage && (
          <SlideOver onClose={() => setEditImage(null)} maxWidth="max-w-md">
            <EditImagePanel
              image={editImage}
              events={events}
              onSave={saveImageEdit}
              onClose={() => setEditImage(null)}
            />
          </SlideOver>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────

function SlideOver({
  children,
  onClose,
  maxWidth = 'max-w-md',
}: {
  children: React.ReactNode
  onClose: () => void
  maxWidth?: string
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`fixed bottom-0 right-0 top-0 z-50 w-full overflow-y-auto ${maxWidth}`}
        style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
      >
        {children}
      </motion.div>
    </>
  )
}

function EventFields({
  form,
  setForm,
}: {
  form: EventForm
  setForm: React.Dispatch<React.SetStateAction<EventForm>>
}) {
  const fields: { label: string; key: keyof EventForm; placeholder: string; type: string }[] = [
    {
      label: 'Event Name',
      key: 'name',
      placeholder: 'e.g. Abuja Monthly Gathering — May 2026',
      type: 'text',
    },
    { label: 'City', key: 'city', placeholder: 'e.g. Abuja', type: 'text' },
    { label: 'Event Date', key: 'date', placeholder: '', type: 'date' },
  ]

  return (
    <>
      {fields.map((field) => (
        <div key={field.key}>
          <label
            className="mb-2 block font-body text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--a-text-secondary)' }}
          >
            {field.label} *
          </label>
          <input
            type={field.type}
            value={form[field.key]}
            onChange={(e) =>
              setForm((p) => ({ ...p, [field.key]: e.target.value }))
            }
            placeholder={field.placeholder}
            className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
            style={{
              background: 'var(--a-bg)',
              borderColor: 'var(--a-border)',
              color: 'var(--a-text)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
          />
        </div>
      ))}
    </>
  )
}

function EditEventPanel({
  event,
  onSave,
  onClose,
}: {
  event: EventWithCount
  onSave: (updates: { name: string; city: string; date: string }) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<EventForm>({
    name: event.name,
    city: event.city,
    date: new Date(event.date).toISOString().split('T')[0] ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.date) {
      toast.error('Please fill in all event fields')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlideOver onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5 p-8">
        <div className="flex items-center justify-between">
          <h3
            className="font-display text-xl font-semibold"
            style={{ color: 'var(--a-text)' }}
          >
            Edit Event
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--a-text-muted)' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="h-px" style={{ background: 'var(--a-border)' }} />

        <EventFields form={form} setForm={setForm} />

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full py-3 font-body text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
          style={{ background: 'var(--a-gold)' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </SlideOver>
  )
}

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
  const [isActive, setIsActive] = useState(image.isActive)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(image.id, {
        caption: caption.trim() || null,
        galleryEventId: galleryEventId || null,
        isActive,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 p-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Edit Image
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{ color: 'var(--a-text-muted)' }}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <div className="h-px" style={{ background: 'var(--a-border)' }} />

      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'var(--a-bg)' }}
      >
        <Image src={image.url} alt="" fill className="object-contain" sizes="500px" />
      </div>

      <div>
        <label
          className="mb-2 block font-body text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--a-text-secondary)' }}
        >
          Caption
        </label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption…"
          className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
          style={{
            background: 'var(--a-bg)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
        />
      </div>

      <div>
        <label
          className="mb-2 block font-body text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--a-text-secondary)' }}
        >
          Event Group
        </label>
        <select
          value={galleryEventId}
          onChange={(e) => setGalleryEventId(e.target.value)}
          className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
          style={{
            background: 'var(--a-bg)',
            borderColor: 'var(--a-border)',
            color: 'var(--a-text)',
          }}
        >
          <option value="">No event group</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
        <p
          className="mt-1 font-body text-xs"
          style={{ color: 'var(--a-text-muted)' }}
        >
          Move this image to a different event group
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span
          className="font-body text-xs uppercase tracking-widest"
          style={{ color: 'var(--a-text-secondary)' }}
        >
          Visibility
        </span>
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className="relative h-6 w-12 rounded-full transition-colors"
          style={{
            background: isActive ? 'var(--a-gold)' : 'var(--a-border)',
          }}
          aria-label="Toggle visibility"
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
            style={{
              background: 'var(--a-surface)',
              transform: isActive ? 'translateX(26px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="w-full py-3 font-body text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
        style={{ background: 'var(--a-gold)' }}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
