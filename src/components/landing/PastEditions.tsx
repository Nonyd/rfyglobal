'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Play, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  formatDuration,
  formatPublishedDate,
  formatViewCount,
} from '@/lib/rfy-youtube-format'

export interface PastEditionVideo {
  id: string
  youtubeVideoId: string
  title: string
  thumbnailUrl: string
  publishedAt: Date | string
  durationSec?: number | null
  viewCount?: number | null
}

interface Props {
  videos: PastEditionVideo[]
}

export function PastEditions({ videos }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [lightboxVideoId, setLightboxVideoId] = useState<string | null>(null)

  if (videos.length === 0) return null

  return (
    <>
      <section
        style={{
          background: 'var(--color-bg)',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                margin: '0 0 0.5rem',
              }}
            >
              Past Editions
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Room For You{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>Live</em>
            </h2>
          </div>

          <Link
            href="/live"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--color-accent)',
              paddingBottom: '2px',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          >
            View all editions →
          </Link>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.12 }}
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
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              whileHover={{ y: -4 }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play size={20} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '3px' }} />
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
                      letterSpacing: '0.05em',
                    }}
                  >
                    {formatDuration(video.durationSec)}
                  </span>
                ) : null}
              </div>

              <div style={{ padding: '1.25rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 0.75rem',
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
      </section>

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
    </>
  )
}
