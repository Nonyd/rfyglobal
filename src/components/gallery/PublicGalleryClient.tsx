'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Archive,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export interface PublicGalleryImage {
  id: string
  url: string
  caption?: string | null
  city?: string | null
  takenAt?: string | Date | null
  createdAt: string | Date
  galleryEvent?: {
    name: string
    city: string
    date: string | Date
  } | null
}

interface PublicGalleryClientProps {
  initialImages: PublicGalleryImage[]
  initialTotal: number
  cities: string[]
  months: string[]
  pageSize?: number
}

interface PaginatedResponse {
  images: PublicGalleryImage[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

const cinematicUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_1200,f_auto,q_auto/')
    : url

const thumbnailUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_700,f_auto,q_auto/')
    : url

const downloadUrlFor = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/fl_attachment/')
    : url

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function PublicGalleryClient({
  initialImages,
  initialTotal,
  cities,
  months,
  pageSize = 20,
}: PublicGalleryClientProps) {
  const [images, setImages] = useState<PublicGalleryImage[]>(initialImages)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filtering, setFiltering] = useState(false)

  const [cityFilter, setCityFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  const buildParams = useCallback(
    (overrides: { page?: number; city?: string; month?: string }) => {
      const params = new URLSearchParams({
        page: String(overrides.page ?? 1),
        limit: String(pageSize),
      })
      const cityValue = overrides.city ?? cityFilter
      const monthValue = overrides.month ?? monthFilter
      if (cityValue !== 'all') params.set('city', cityValue)
      if (monthValue !== 'all') params.set('month', monthValue)
      return params
    },
    [pageSize, cityFilter, monthFilter],
  )

  const loadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const params = buildParams({ page: page + 1 })
      const res = await fetch(`/api/gallery?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      const data = (await res.json()) as PaginatedResponse
      setImages((prev) => [...prev, ...data.images])
      setTotal(data.total)
      setPage(data.page)
    } catch {
      toast.error('Failed to load more photos')
    } finally {
      setLoadingMore(false)
    }
  }

  const refetchFirstPage = useCallback(
    async (nextCity: string, nextMonth: string) => {
      setFiltering(true)
      setSelectedIds(new Set())
      try {
        const params = buildParams({ page: 1, city: nextCity, month: nextMonth })
        const res = await fetch(`/api/gallery?${params.toString()}`)
        if (!res.ok) throw new Error('Failed')
        const data = (await res.json()) as PaginatedResponse
        setImages(data.images)
        setTotal(data.total)
        setPage(1)
      } catch {
        toast.error('Failed to filter gallery')
      } finally {
        setFiltering(false)
      }
    },
    [buildParams],
  )

  const handleCityFilter = (city: string) => {
    if (city === cityFilter) return
    setCityFilter(city)
    void refetchFirstPage(city, monthFilter)
  }

  const handleMonthFilter = (month: string) => {
    if (month === monthFilter) return
    setMonthFilter(month)
    void refetchFirstPage(cityFilter, month)
  }

  const openLightbox = (index: number) => {
    if (selectMode) return
    setLightboxIndex(index)
  }
  const closeLightbox = () => setLightboxIndex(null)

  const prevImage = () => {
    if (lightboxIndex === null || images.length === 0) return
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + images.length) % images.length,
    )
  }

  const nextImage = () => {
    if (lightboxIndex === null || images.length === 0) return
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length))
  }

  const triggerDownload = (url: string, filename?: string) => {
    const href = downloadUrlFor(url)
    const a = document.createElement('a')
    a.href = href
    a.download = filename ?? `rfy-photo-${Date.now()}.jpg`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadImage = (url: string, filename?: string) => {
    try {
      triggerDownload(url, filename)
    } catch {
      toast.error('Failed to download image')
    }
  }

  const downloadAllSelected = async () => {
    if (selectedIds.size === 0) return
    setDownloading(true)
    toast.loading('Preparing downloads…', { id: 'zip-download' })

    try {
      const selectedImages = images.filter((img) => selectedIds.has(img.id))
      for (let i = 0; i < selectedImages.length; i++) {
        triggerDownload(selectedImages[i].url, `rfy-photo-${i + 1}.jpg`)
        await new Promise((resolve) => setTimeout(resolve, 350))
      }
      toast.success(
        `${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} downloaded`,
        { id: 'zip-download' },
      )
      setSelectMode(false)
      setSelectedIds(new Set())
    } catch {
      toast.error('Download failed', { id: 'zip-download' })
    } finally {
      setDownloading(false)
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

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null
  const hasMore = images.length < total
  const remaining = Math.max(0, total - images.length)
  const nextBatchSize = Math.min(pageSize, remaining)
  const progressPercent = total > 0 ? (images.length / total) * 100 : 0

  return (
    <div className="bg-void">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-body text-xs font-medium uppercase tracking-[0.25em] text-text-secondary">
            {images.length} of {total} photo{total === 1 ? '' : 's'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {selectMode && selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => void downloadAllSelected()}
                disabled={downloading}
                className="btn-crimson-solid flex items-center gap-2 px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
                style={{ background: '#8B0000' }}
              >
                <Archive size={12} />
                Download {selectedIds.size} Photo{selectedIds.size > 1 ? 's' : ''}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectMode((p) => !p)
                setSelectedIds(new Set())
              }}
              className={cn(
                'flex items-center gap-2 border px-4 py-2.5 font-body text-xs uppercase tracking-widest transition-all',
                selectMode
                  ? 'border-crimson/50 text-crimson'
                  : 'border-theme text-text-secondary hover:border-crimson/40 hover:text-text-primary',
              )}
            >
              <CheckSquare size={12} />
              {selectMode ? 'Cancel' : 'Select Photos'}
            </button>
          </div>
        </div>

        {selectMode && (
          <p className="mt-2 font-body text-[11px] text-text-muted">
            Select from currently loaded photos. Photos download individually.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-6">
          {months.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-text text-[10px] text-text-muted">Month</p>
              <FilterPill
                active={monthFilter === 'all'}
                disabled={filtering}
                onClick={() => handleMonthFilter('all')}
                label="All"
              />
              {months.map((m) => (
                <FilterPill
                  key={m}
                  active={monthFilter === m}
                  disabled={filtering}
                  onClick={() => handleMonthFilter(m)}
                  label={format(new Date(`${m}-01T00:00:00`), 'MMM yyyy')}
                />
              ))}
            </div>
          )}

          {cities.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-text text-[10px] text-text-muted">City</p>
              <FilterPill
                active={cityFilter === 'all'}
                disabled={filtering}
                onClick={() => handleCityFilter('all')}
                label="All"
              />
              {cities.map((c) => (
                <FilterPill
                  key={c}
                  active={cityFilter === c}
                  disabled={filtering}
                  onClick={() => handleCityFilter(c)}
                  label={c}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24">
        {filtering && images.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-body text-sm text-mist">Loading…</p>
          </div>
        ) : images.length === 0 ? (
          <div className="py-24 text-center">
            <p className="mb-3 font-display text-2xl text-snow">No photos found</p>
            <p className="font-body text-sm text-mist">Try a different filter</p>
          </div>
        ) : (
          <div className="columns-1 gap-3 space-y-3 sm:columns-2 lg:columns-3 xl:columns-4">
            {images.map((image, index) => {
              const isSelected = selectedIds.has(image.id)
              const eventName = image.galleryEvent?.name ?? image.caption ?? null
              const city = image.galleryEvent?.city ?? image.city
              const date =
                toDate(image.takenAt) ??
                toDate(image.galleryEvent?.date) ??
                toDate(image.createdAt)

              return (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.4) }}
                  className="group relative cursor-pointer break-inside-avoid overflow-hidden"
                  onClick={() =>
                    selectMode ? toggleSelect(image.id) : openLightbox(index)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (selectMode) toggleSelect(image.id)
                      else openLightbox(index)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {selectMode && (
                    <div
                      className="absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center border-2 transition-all"
                      style={{
                        background: isSelected ? '#8B0000' : 'rgba(0,0,0,0.6)',
                        borderColor: isSelected ? '#8B0000' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {isSelected && (
                        <span className="text-xs font-bold text-void">✓</span>
                      )}
                    </div>
                  )}

                  <Image
                    src={thumbnailUrl(image.url)}
                    alt={eventName ?? 'Room For You gallery'}
                    width={600}
                    height={400}
                    className={`h-auto w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                      isSelected ? 'brightness-75' : ''
                    }`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />

                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                    }}
                  >
                    {!selectMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadImage(image.url)
                        }}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center transition-all"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = '#8B0000')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')
                        }
                        title="Download photo"
                      >
                        <Download size={14} />
                      </button>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {eventName && (
                        <p className="line-clamp-1 font-body text-xs font-medium text-white">
                          {eventName}
                        </p>
                      )}
                      {(city || date) && (
                        <p className="mt-0.5 font-body text-[10px] text-white/60">
                          {city}
                          {city && date ? ' · ' : ''}
                          {date ? format(date, 'MMM yyyy') : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {hasMore && images.length > 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 pb-8">
            <p className="font-body text-xs font-medium uppercase tracking-[0.25em] text-text-secondary">
              {images.length} of {total} photos
            </p>

            <div className="h-px w-48 bg-theme">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, background: '#8B0000' }}
              />
            </div>

            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore || filtering}
              className="mt-4 flex items-center gap-3 border px-10 py-4 font-body text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-300 disabled:opacity-50"
              style={{
                borderColor: 'rgba(139,0,0,0.4)',
                color: '#8B0000',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (loadingMore || filtering) return
                e.currentTarget.style.background = '#8B0000'
                e.currentTarget.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#8B0000'
              }}
            >
              {loadingMore ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                    style={{
                      borderColor: 'rgba(139,0,0,0.4)',
                      borderTopColor: '#8B0000',
                    }}
                  />
                  Loading…
                </>
              ) : (
                <>
                  Load More Photos
                  <span className="opacity-60">+{nextBatchSize}</span>
                </>
              )}
            </button>
          </div>
        )}

        {!hasMore && images.length > 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 pb-8">
            <div className="gold-line w-24 opacity-30" />
            <p className="font-body text-xs font-medium uppercase tracking-[0.25em] text-text-muted">
              All {total} photos loaded
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.95)' }}
            onClick={closeLightbox}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeLightbox()
              if (e.key === 'ArrowLeft') prevImage()
              if (e.key === 'ArrowRight') nextImage()
            }}
            role="presentation"
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#8B0000')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
              }
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                downloadImage(currentImage.url)
              }}
              className="btn-crimson-solid absolute right-20 top-6 z-10 flex items-center gap-2 px-4 py-2.5 font-body text-xs uppercase tracking-widest transition-all"
              style={{ background: '#8B0000' }}
            >
              <Download size={13} />
              Download
            </button>

            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
                }
                aria-label="Previous photo"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative mx-16 max-h-[85vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal
            >
              <Image
                src={cinematicUrl(currentImage.url)}
                alt={currentImage.caption ?? currentImage.galleryEvent?.name ?? ''}
                width={1200}
                height={900}
                className="h-full w-full object-contain"
                style={{ maxHeight: '85vh' }}
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
              />

              <div
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                }}
              >
                {(currentImage.galleryEvent?.name ?? currentImage.caption) && (
                  <p className="font-body text-sm text-white">
                    {currentImage.galleryEvent?.name ?? currentImage.caption}
                  </p>
                )}
                <p className="mt-0.5 font-body text-xs text-white/50">
                  {lightboxIndex + 1} / {images.length}
                </p>
              </div>
            </motion.div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
                }
                aria-label="Next photo"
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

function FilterPill({
  active,
  label,
  onClick,
  disabled,
}: {
  active: boolean
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'border px-3 py-1 font-body text-xs tracking-wide transition-all disabled:opacity-40',
        active
          ? 'border-crimson bg-crimson text-white'
          : 'border-theme text-text-secondary hover:border-crimson/40 hover:text-text-primary',
      )}
    >
      {label}
    </button>
  )
}
