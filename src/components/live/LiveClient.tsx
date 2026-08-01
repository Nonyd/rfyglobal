'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Loader2, Play } from 'lucide-react'
import Image from 'next/image'
import {
  formatDuration,
  formatPublishedDate,
  formatViewCount,
} from '@/lib/rfy-youtube-format'

export interface LiveVideo {
  id: string
  youtubeVideoId: string
  title: string
  description?: string | null
  thumbnailUrl: string
  publishedAt: Date | string
  durationSec?: number | null
  viewCount?: number | null
}

interface Props {
  initialVideos: LiveVideo[]
  initialTotal: number
}

interface PaginatedResponse {
  videos: LiveVideo[]
  total: number
  page: number
  hasMore: boolean
}

const PAGE_SIZE = 12

export function LiveClient({ initialVideos, initialTotal }: Props) {
  const [videos, setVideos] = useState<LiveVideo[]>(initialVideos)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialVideos.length < initialTotal)
  const [lightboxVideoId, setLightboxVideoId] = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const nextPage = page + 1
      const res = await fetch(`/api/live?page=${nextPage}`)
      if (!res.ok) throw new Error('Failed to load videos')
      const data = (await res.json()) as PaginatedResponse

      setVideos((prev) => [...prev, ...data.videos])
      setTotal(data.total)
      setPage(data.page)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('[live] load failed', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page])

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
    if (!lightboxVideoId) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxVideoId(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxVideoId])

  return (
    <div style={{ padding: '3rem clamp(1.5rem, 5vw, 5rem) 5rem' }}>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 2rem',
        }}
      >
        Showing {videos.length} of {total} video{total === 1 ? '' : 's'}
      </p>

      {videos.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            padding: '4rem 1rem',
          }}
        >
          Past editions will appear here once synced from YouTube.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index % PAGE_SIZE, 8) * 0.05 }}
              onClick={() => setLightboxVideoId(video.youtubeVideoId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setLightboxVideoId(video.youtubeVideoId)
                }
              }}
              style={{
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                background: 'var(--color-bg)',
              }}
              whileHover={{ y: -4 }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play size={18} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '2px' }} />
                  </div>
                </div>
                {video.durationSec ? (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(0,0,0,0.8)',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                    }}
                  >
                    {formatDuration(video.durationSec)}
                  </span>
                ) : null}
              </div>

              <div style={{ padding: '1.15rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 0.65rem',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {video.title}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {formatPublishedDate(video.publishedAt)}
                  </span>
                  {video.viewCount && video.viewCount > 0 ? (
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Eye size={12} />
                      {formatViewCount(video.viewCount)}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div
        ref={loaderRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem 1rem',
          minHeight: '4rem',
        }}
      >
        {loading ? (
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: 'var(--color-accent)' }}
          />
        ) : null}
        {!loading && !hasMore && videos.length > 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            All editions loaded
          </p>
        ) : null}
      </div>

      {lightboxVideoId ? (
        <div
          onClick={() => setLightboxVideoId(null)}
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              width: 'min(900px, 90vw)',
              aspectRatio: '16/9',
              position: 'relative',
            }}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${lightboxVideoId}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube video player"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          <button
            type="button"
            onClick={() => setLightboxVideoId(null)}
            aria-label="Close video"
            style={{
              position: 'fixed',
              top: '1.5rem',
              right: '1.5rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  )
}
