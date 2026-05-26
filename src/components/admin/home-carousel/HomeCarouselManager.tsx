'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from 'lucide-react'
import { UploadZone } from '@/components/shared/UploadZone'
import { AdminToggle } from '@/components/shared/Toggle'
import toast from 'react-hot-toast'
import type { HomeCarouselSlide } from '@prisma/client'

export function HomeCarouselManager() {
  const [slides, setSlides] = useState<HomeCarouselSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [editSlide, setEditSlide] = useState<HomeCarouselSlide | null>(null)
  const [newHeading, setNewHeading] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/home-carousel?includeHidden=true')
      if (!res.ok) throw new Error('Failed')
      setSlides((await res.json()) as HomeCarouselSlide[])
    } catch {
      toast.error('Failed to load carousel slides')
      setSlides([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveNew = async (url: string) => {
    const heading = newHeading.trim()
    if (!heading) {
      toast.error('Enter a heading (e.g. Worship, Prayer)')
      return
    }
    const res = await adminFetch('/api/home-carousel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, heading, order: slides.length }),
    })
    if (!res.ok) {
      toast.error('Failed to save slide')
      return
    }
    toast.success('Slide added')
    setNewHeading('')
    setAddOpen(false)
    await load()
  }

  const patchSlide = async (id: string, updates: Partial<HomeCarouselSlide>) => {
    const res = await adminFetch(`/api/home-carousel/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      toast.error('Failed to update')
      return false
    }
    const updated = (await res.json()) as HomeCarouselSlide
    setSlides((prev) => prev.map((s) => (s.id === id ? updated : s)))
    return true
  }

  const deleteSlide = async (id: string) => {
    if (!confirm('Delete this carousel slide?')) return
    const res = await adminFetch(`/api/home-carousel/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Slide deleted')
      setEditSlide(null)
      await load()
    } else {
      toast.error('Failed to delete')
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= slides.length) return
    const reordered = [...slides]
    const [item] = reordered.splice(index, 1)
    reordered.splice(next, 0, item!)
    setSlides(reordered)
    const res = await adminFetch('/api/home-carousel/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
    })
    if (!res.ok) {
      toast.error('Failed to save order')
      await load()
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="border p-5"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--a-text-secondary)' }}>
          Upload images here for the homepage carousel only — separate from the main gallery.
          Each slide needs a heading (e.g. &ldquo;Worship&rdquo;, &ldquo;Prayer&rdquo;). Section
          title and button text are edited under{' '}
          <strong style={{ color: 'var(--a-text)' }}>Site CMS → Landing Page</strong>.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
          {slides.length} slide{slides.length === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          className="flex items-center gap-1.5 px-4 py-2 font-body text-xs font-medium text-white"
          style={{ background: 'var(--a-gold)' }}
        >
          {addOpen ? <X size={14} /> : <Plus size={14} />}
          {addOpen ? 'Cancel' : 'Add slide'}
        </button>
      </div>

      {addOpen && (
        <div
          className="space-y-4 border p-6"
          style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
        >
          <div>
            <label
              className="mb-2 block font-body text-xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--a-text-secondary)' }}
            >
              Heading on slide
            </label>
            <input
              value={newHeading}
              onChange={(e) => setNewHeading(e.target.value)}
              placeholder="e.g. Worship, Prayer, Bible Study"
              className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
              style={{
                background: 'var(--a-bg)',
                borderColor: 'var(--a-border)',
                color: 'var(--a-text)',
              }}
            />
          </div>
          <UploadZone
            folder="homeCarousel"
            accept="image"
            preview
            label="Upload carousel image (max 10MB)"
            onUploadComplete={async (files) => {
              const url = files[0]?.url
              if (url) await saveNew(url)
            }}
            onUploadError={(err) => toast.error(err.message)}
          />
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          Loading…
        </p>
      ) : slides.length === 0 ? (
        <div
          className="border border-dashed py-16 text-center"
          style={{ borderColor: 'var(--a-border)' }}
        >
          <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            No slides yet. Add your first image above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="overflow-hidden border"
              style={{
                borderColor: slide.isActive ? 'var(--a-gold-border)' : 'var(--a-border)',
                background: 'var(--a-surface)',
                opacity: slide.isActive ? 1 : 0.65,
              }}
            >
              <div className="relative aspect-[16/10]">
                <Image src={slide.url} alt={slide.heading} fill className="object-cover" sizes="400px" />
              </div>
              <div className="space-y-3 p-4">
                <p className="font-display text-lg" style={{ color: 'var(--a-text)' }}>
                  {slide.heading}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => void move(index, -1)}
                      className="flex h-8 w-8 items-center justify-center border disabled:opacity-30"
                      style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
                      aria-label="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === slides.length - 1}
                      onClick={() => void move(index, 1)}
                      className="flex h-8 w-8 items-center justify-center border disabled:opacity-30"
                      style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
                      aria-label="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditSlide(slide)}
                      className="flex h-8 w-8 items-center justify-center"
                      style={{ color: 'var(--a-text-muted)' }}
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteSlide(slide.id)}
                      className="flex h-8 w-8 items-center justify-center"
                      style={{ color: 'var(--a-red)' }}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                    Visible
                  </span>
                  <AdminToggle
                    checked={slide.isActive}
                    onChange={async (v) => {
                      await patchSlide(slide.id, { isActive: v })
                    }}
                    size="sm"
                    aria-label="Toggle visibility"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editSlide && (
        <EditSlideModal
          slide={editSlide}
          onClose={() => setEditSlide(null)}
          onSave={async (updates) => {
            const ok = await patchSlide(editSlide.id, updates)
            if (ok) {
              toast.success('Slide updated')
              setEditSlide(null)
            }
          }}
        />
      )}
    </div>
  )
}

function EditSlideModal({
  slide,
  onClose,
  onSave,
}: {
  slide: HomeCarouselSlide
  onClose: () => void
  onSave: (updates: Partial<HomeCarouselSlide>) => Promise<void>
}) {
  const [heading, setHeading] = useState(slide.heading)
  const [saving, setSaving] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-md space-y-4 border p-6"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
            Edit slide
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--a-text-muted)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden">
          <Image src={slide.url} alt="" fill className="object-cover" sizes="400px" />
        </div>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="w-full border px-4 py-3 font-body text-sm"
          style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
        />
        <button
          type="button"
          disabled={saving || !heading.trim()}
          onClick={async () => {
            setSaving(true)
            try {
              await onSave({ heading: heading.trim() })
            } finally {
              setSaving(false)
            }
          }}
          className="w-full py-3 font-body text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
          style={{ background: 'var(--a-gold)' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
