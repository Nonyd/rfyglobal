'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { MAX_HOME_GALLERY_SLIDES } from '@/lib/gallery-constants'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronUp, Home, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { GalleryImage, GalleryEvent } from '@prisma/client'

type HomeImage = GalleryImage & {
  galleryEvent?: Pick<GalleryEvent, 'name' | 'city' | 'date'> | null
}

export function HomeSlideshowPicker({ refreshToken = 0 }: { refreshToken?: number }) {
  const [homeImages, setHomeImages] = useState<HomeImage[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  const loadHomeImages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch(
        '/api/gallery?showOnHome=true&includeHidden=true&limit=50',
      )
      if (!res.ok) throw new Error('Failed to load')
      const data = (await res.json()) as { images: HomeImage[] }
      setHomeImages(data.images ?? [])
    } catch {
      toast.error('Failed to load homepage slideshow')
      setHomeImages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHomeImages()
  }, [loadHomeImages, refreshToken])

  const removeFromHome = async (image: HomeImage) => {
    const res = await adminFetch(`/api/gallery/${image.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showOnHome: false }),
    })
    if (res.ok) {
      setHomeImages((prev) => prev.filter((i) => i.id !== image.id))
      toast.success('Removed from homepage slideshow')
    } else {
      toast.error('Failed to update')
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= homeImages.length) return
    const reordered = [...homeImages]
    const [item] = reordered.splice(index, 1)
    reordered.splice(next, 0, item!)
    setHomeImages(reordered)

    const res = await adminFetch('/api/gallery/home/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((i) => i.id) }),
    })
    if (!res.ok) {
      toast.error('Failed to save order')
      await loadHomeImages()
    }
  }

  return (
    <div
      className="mb-6 border"
      style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center"
            style={{ background: 'var(--a-gold-light)', color: 'var(--a-gold)' }}
          >
            <Home size={18} />
          </div>
          <div>
            <p className="font-display text-base font-semibold" style={{ color: 'var(--a-text)' }}>
              Homepage slideshow
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
              {homeImages.length} of {MAX_HOME_GALLERY_SLIDES} images · shown on the landing page
            </p>
          </div>
        </div>
        <span style={{ color: 'var(--a-text-muted)' }}>{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: 'var(--a-border)' }}>
          <p className="mb-4 font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-secondary)' }}>
            Hover any photo below and click the home icon to add it here. Reorder slides with the
            arrows. Edit titles and button text under{' '}
            <strong style={{ color: 'var(--a-text)' }}>Site CMS → Landing Page</strong>.
          </p>

          {loading ? (
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Loading slideshow…
            </p>
          ) : homeImages.length === 0 ? (
            <div
              className="border border-dashed px-4 py-8 text-center"
              style={{ borderColor: 'var(--a-border)' }}
            >
              <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                No images selected yet. Add photos from the grid using the home icon.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {homeImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative shrink-0 overflow-hidden border"
                  style={{ width: '140px', borderColor: 'var(--a-border)' }}
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image.url}
                      alt={image.caption ?? ''}
                      fill
                      className="object-cover"
                      sizes="140px"
                    />
                    <span
                      className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center font-body text-[10px] font-bold"
                      style={{ background: 'var(--a-gold)', color: '#fff' }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-0.5 p-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => void move(index, -1)}
                      className="flex h-7 flex-1 items-center justify-center disabled:opacity-30"
                      style={{ color: 'var(--a-text-muted)' }}
                      aria-label="Move earlier"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === homeImages.length - 1}
                      onClick={() => void move(index, 1)}
                      className="flex h-7 flex-1 items-center justify-center disabled:opacity-30"
                      style={{ color: 'var(--a-text-muted)' }}
                      aria-label="Move later"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeFromHome(image)}
                      className="flex h-7 w-7 items-center justify-center"
                      style={{ color: 'var(--a-red)' }}
                      aria-label="Remove from homepage"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
