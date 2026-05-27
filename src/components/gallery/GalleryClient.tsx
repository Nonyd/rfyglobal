'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Loader2, Download, Check } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import {
  downloadGalleryImage,
  downloadGalleryImagesZip,
} from '@/lib/gallery-download'
import {
  normalizeUploadSrc,
  shouldBypassImageOptimization,
} from '@/lib/image-display'

export interface GalleryImage {
  id: string
  url: string
  caption?: string | null
  galleryEventId?: string | null
}

export interface GalleryEvent {
  id: string
  name: string
  _count?: { images: number }
}

interface Props {
  initialImages: GalleryImage[]
  initialTotal: number
  allTotal: number
  events: GalleryEvent[]
  pageSize?: number
}

interface PaginatedResponse {
  images: GalleryImage[]
  total: number
  page: number
  hasMore: boolean
}

const PAGE_SIZE_DEFAULT = 24

export function GalleryClient({
  initialImages,
  initialTotal,
  allTotal,
  events,
  pageSize = PAGE_SIZE_DEFAULT,
}: Props) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialImages.length < initialTotal)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [downloading, setDownloading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const selectedImages = images.filter((img) => selectedIds.has(img.id))

  const toggleSelected = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllShown = () => {
    setSelectedIds(new Set(images.map((img) => img.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleDownloadOne = async (image: GalleryImage, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (downloading) return
    setDownloading(true)
    try {
      await downloadGalleryImage(image)
      toast.success('Download started')
    } catch (err) {
      console.error('[gallery] download failed', err)
      toast.error('Could not download this photo. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadSelected = async () => {
    if (selectedImages.length === 0 || downloading) return
    setDownloading(true)
    try {
      if (selectedImages.length === 1) {
        await downloadGalleryImage(selectedImages[0]!)
        toast.success('Download started')
      } else {
        await downloadGalleryImagesZip(selectedImages)
        toast.success(`Downloaded ${selectedImages.length} photos`)
      }
    } catch (err) {
      console.error('[gallery] bulk download failed', err)
      toast.error('Could not download selected photos. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const nextPage = page + 1
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(pageSize),
      })
      if (activeEvent) params.set('eventId', activeEvent)

      const res = await fetch(`/api/gallery?${params}`)
      if (!res.ok) throw new Error('Failed to load gallery')
      const data = (await res.json()) as PaginatedResponse

      setImages((prev) => [...prev, ...data.images])
      setTotal(data.total)
      setPage(data.page)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('[gallery] load failed', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, pageSize, activeEvent])

  const handleEventFilter = async (eventId: string | null) => {
    if (eventId === activeEvent) return
    setActiveEvent(eventId)
    setPage(1)
    setLoading(true)
    setLightboxIndex(null)
    setSelectedIds(new Set())

    try {
      const params = new URLSearchParams({ page: '1', limit: String(pageSize) })
      if (eventId) params.set('eventId', eventId)

      const res = await fetch(`/api/gallery?${params}`)
      if (!res.ok) throw new Error('Failed to filter gallery')
      const data = (await res.json()) as PaginatedResponse

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

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          void loadMore()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') {
        setLightboxIndex((i) => (i !== null ? Math.min(i + 1, images.length - 1) : null))
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null))
      }
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
        {events.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '2.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => void handleEventFilter(null)}
              style={{
                padding: '0.5rem 1.25rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
                border: '1px solid',
                borderColor:
                  activeEvent === null ? 'var(--color-accent)' : 'var(--color-border)',
                background:
                  activeEvent === null ? 'var(--color-accent)' : 'transparent',
                color:
                  activeEvent === null
                    ? 'var(--color-text-inverse)'
                    : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              All ({allTotal})
            </button>

            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => void handleEventFilter(event.id)}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  border: '1px solid',
                  borderColor:
                    activeEvent === event.id
                      ? 'var(--color-accent)'
                      : 'var(--color-border)',
                  background:
                    activeEvent === event.id ? 'var(--color-accent)' : 'transparent',
                  color:
                    activeEvent === event.id
                      ? 'var(--color-text-inverse)'
                      : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {event.name}
                {event._count != null && (
                  <span style={{ opacity: 0.6, marginLeft: '0.35rem' }}>
                    ({event._count.images})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            Showing {images.length} of {total} photos
            {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ''}
          </p>

          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={selectAllShown}
                disabled={downloading}
                style={{
                  padding: '0.45rem 1rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  opacity: downloading ? 0.5 : 1,
                }}
              >
                Select all shown
              </button>
              {selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={downloading}
                    style={{
                      padding: '0.45rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                      border: '1px solid var(--color-border)',
                      background: 'transparent',
                      color: 'var(--color-text-secondary)',
                      cursor: downloading ? 'not-allowed' : 'pointer',
                      opacity: downloading ? 0.5 : 1,
                    }}
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownloadSelected()}
                    disabled={downloading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      border: '1px solid var(--color-accent)',
                      background: 'var(--color-accent)',
                      color: 'var(--color-text-inverse)',
                      cursor: downloading ? 'wait' : 'pointer',
                      opacity: downloading ? 0.7 : 1,
                    }}
                  >
                    <Download size={14} />
                    {downloading
                      ? 'Preparing…'
                      : `Download selected (${selectedIds.size})`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {images.length === 0 && !loading ? (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              padding: '4rem 0',
            }}
          >
            No photos found for this album.
          </p>
        ) : (
          <div
            style={
              {
                columns: 'var(--gallery-cols, 3)',
                columnGap: '1rem',
                '--gallery-cols': '3',
              } as React.CSSProperties
            }
            className="gallery-masonry"
          >
            {images.map((image, index) => {
              const isSelected = selectedIds.has(image.id)
              return (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: (index % pageSize) * 0.03,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                  onClick={() => setLightboxIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setLightboxIndex(index)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '1rem',
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: isSelected
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    display: 'block',
                    boxShadow: isSelected ? '0 0 0 1px var(--color-accent)' : undefined,
                  }}
                >
                  <div style={{ position: 'relative', width: '100%' }}>
                    <button
                      type="button"
                      aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
                      aria-pressed={isSelected}
                      onClick={(e) => toggleSelected(image.id, e)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        zIndex: 3,
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: isSelected
                          ? 'var(--color-accent)'
                          : 'rgba(255,255,255,0.5)',
                        background: isSelected
                          ? 'var(--color-accent)'
                          : 'rgba(0,0,0,0.45)',
                        color: isSelected ? 'var(--color-text-inverse)' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                    </button>

                    <button
                      type="button"
                      aria-label="Download photo"
                      className="gallery-download-btn"
                      onClick={(e) => void handleDownloadOne(image, e)}
                      disabled={downloading}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        zIndex: 3,
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.5)',
                        background: 'rgba(0,0,0,0.45)',
                        color: '#fff',
                        cursor: downloading ? 'wait' : 'pointer',
                        opacity: downloading ? 0.6 : 1,
                      }}
                    >
                      <Download size={14} />
                    </button>

                    <Image
                      src={normalizeUploadSrc(image.url)}
                      alt={image.caption ?? `Gallery photo ${index + 1}`}
                      width={600}
                      height={400}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        transition: 'transform 0.4s ease',
                      }}
                      className="gallery-img"
                      loading="lazy"
                      unoptimized={shouldBypassImageOptimization(image.url)}
                    />
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
                        pointerEvents: 'none',
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
              )
            })}
          </div>
        )}

        <div
          ref={loaderRef}
          style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Loader2
                size={18}
                className="animate-spin"
                style={{ color: 'var(--color-accent)' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Loading more photos…
              </span>
            </div>
          )}
          {!hasMore && images.length > 0 && !loading && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              All {total} photos loaded
            </p>
          )}
        </div>
      </div>

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
        .gallery-download-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .gallery-masonry > div:hover .gallery-download-btn,
        .gallery-masonry > div:focus-within .gallery-download-btn {
          opacity: 1;
        }
        @media (max-width: 1024px) {
          .gallery-download-btn { opacity: 1; }
        }
      `}</style>

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
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: 'min(900px, 90vw)',
                height: 'min(600px, 85vh)',
              }}
            >
              <Image
                src={normalizeUploadSrc(currentImage.url)}
                alt={currentImage.caption ?? 'Gallery photo'}
                fill
                sizes="900px"
                style={{ objectFit: 'contain' }}
                unoptimized={shouldBypassImageOptimization(currentImage.url)}
              />

              <button
                type="button"
                aria-label="Download photo"
                disabled={downloading}
                onClick={(e) => void handleDownloadOne(currentImage, e)}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: '2px',
                  background: 'rgba(0,0,0,0.55)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: downloading ? 'wait' : 'pointer',
                  zIndex: 2,
                }}
              >
                <Download size={14} />
                Download
              </button>

              {currentImage.caption && (
                <p
                  style={{
                    position: 'absolute',
                    bottom: '-2.5rem',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                  }}
                >
                  {currentImage.caption}
                </p>
              )}

              <p
                style={{
                  position: 'absolute',
                  bottom: '-4.5rem',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.35)',
                  margin: 0,
                }}
              >
                {lightboxIndex + 1} / {images.length}
              </p>
            </motion.div>

            <button
              type="button"
              aria-label="Close lightbox"
              onClick={() => setLightboxIndex(null)}
              style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--color-text-inverse, #fff)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>

            {lightboxIndex > 0 && (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i ?? 1) - 1)
                }}
                style={{
                  position: 'fixed',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--color-text-inverse, #fff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {lightboxIndex < images.length - 1 && (
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i ?? 0) + 1)
                }}
                style={{
                  position: 'fixed',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--color-text-inverse, #fff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
