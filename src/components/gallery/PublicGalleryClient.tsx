'use client'

import { useMemo, useState } from 'react'
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
  images: PublicGalleryImage[]
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

export function PublicGalleryClient({ images }: PublicGalleryClientProps) {
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  const cities = useMemo(() => {
    const set = new Set<string>()
    images.forEach((img) => {
      const city = img.galleryEvent?.city ?? img.city
      if (city) set.add(city)
    })
    return Array.from(set).sort()
  }, [images])

  const months = useMemo(() => {
    const set = new Set<string>()
    images.forEach((img) => {
      const date = toDate(img.takenAt) ?? toDate(img.galleryEvent?.date) ?? toDate(img.createdAt)
      if (date) set.add(format(date, 'yyyy-MM'))
    })
    return Array.from(set).sort().reverse()
  }, [images])

  const filtered = useMemo(() => {
    return images.filter((img) => {
      const city = img.galleryEvent?.city ?? img.city
      const date = toDate(img.takenAt) ?? toDate(img.galleryEvent?.date) ?? toDate(img.createdAt)
      const month = date ? format(date, 'yyyy-MM') : null

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
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + filtered.length) % filtered.length,
    )
  }

  const nextImage = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length))
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
      const selectedImages = filtered.filter((img) => selectedIds.has(img.id))
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

  const currentImage = lightboxIndex !== null ? filtered[lightboxIndex] : null

  return (
    <div className="bg-void">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="label-text">
            {filtered.length} photo{filtered.length === 1 ? '' : 's'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {selectMode && selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => void downloadAllSelected()}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-widest text-void transition-all disabled:opacity-50"
                style={{ background: '#C9A84C' }}
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
              className="flex items-center gap-2 border px-4 py-2.5 font-body text-xs uppercase tracking-widest transition-all"
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

        {selectMode && (
          <p className="mt-2 font-body text-[11px]" style={{ color: 'rgba(248,248,248,0.4)' }}>
            Tap photos to select. Photos download individually.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-6">
          {months.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-text text-[10px] opacity-40">Month</p>
              <FilterPill
                active={monthFilter === 'all'}
                onClick={() => setMonthFilter('all')}
                label="All"
              />
              {months.map((m) => (
                <FilterPill
                  key={m}
                  active={monthFilter === m}
                  onClick={() => setMonthFilter(m)}
                  label={format(new Date(`${m}-01T00:00:00`), 'MMM yyyy')}
                />
              ))}
            </div>
          )}

          {cities.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-text text-[10px] opacity-40">City</p>
              <FilterPill
                active={cityFilter === 'all'}
                onClick={() => setCityFilter('all')}
                label="All"
              />
              {cities.map((c) => (
                <FilterPill
                  key={c}
                  active={cityFilter === c}
                  onClick={() => setCityFilter(c)}
                  label={c}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24">
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="mb-3 font-display text-2xl text-snow">No photos found</p>
            <p className="font-body text-sm text-mist">Try a different filter</p>
          </div>
        ) : (
          <div className="columns-1 gap-3 space-y-3 sm:columns-2 lg:columns-3 xl:columns-4">
            {filtered.map((image, index) => {
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
                  transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.5) }}
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
                        background: isSelected ? '#C9A84C' : 'rgba(0,0,0,0.6)',
                        borderColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.5)',
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
                          (e.currentTarget.style.background = '#C9A84C')
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
              onMouseEnter={(e) => (e.currentTarget.style.background = '#C9A84C')}
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
              className="absolute right-20 top-6 z-10 flex items-center gap-2 px-4 py-2.5 font-body text-xs uppercase tracking-widest transition-all"
              style={{ background: '#C9A84C', color: '#0F0F0F' }}
            >
              <Download size={13} />
              Download
            </button>

            {filtered.length > 1 && (
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
                  {lightboxIndex + 1} / {filtered.length}
                </p>
              </div>
            </motion.div>

            {filtered.length > 1 && (
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
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 font-body text-xs tracking-wide transition-all"
      style={{
        background: active ? '#C9A84C' : 'transparent',
        color: active ? '#0F0F0F' : 'rgba(248,248,248,0.6)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {label}
    </button>
  )
}
