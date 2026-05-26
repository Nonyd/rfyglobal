'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface GalleryImage {
  id: string
  url: string
  caption?: string | null
}

interface GalleryStripProps {
  images: GalleryImage[]
  eyebrow?: string
  titleBefore?: string
  titleItalic?: string
  ctaHref?: string
  ctaLabel?: string
}

const ASPECT_RATIOS = [
  { width: 320, height: 420 },
  { width: 380, height: 300 },
  { width: 280, height: 380 },
  { width: 400, height: 320 },
  { width: 300, height: 420 },
  { width: 360, height: 290 },
]

const VERTICAL_OFFSETS = [0, 40, -20, 30, -10, 45, 10, -30]

const MOBILE_BREAKPOINT = 768

export function GalleryStrip({
  images,
  eyebrow = 'Gallery',
  titleBefore = 'Moments from',
  titleItalic = 'our gatherings',
  ctaHref = '/gallery',
  ctaLabel = 'View all photos',
}: GalleryStripProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!sectionRef.current || !trackRef.current || images.length === 0 || isMobile) return

    gsap.registerPlugin(ScrollTrigger)

    const track = trackRef.current
    const getTotalWidth = () => track.scrollWidth - track.offsetWidth

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            once: true,
          },
        })
      }

      gsap.to(track, {
        x: () => -getTotalWidth(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${getTotalWidth() * 1.2}`,
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [images, isMobile])

  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (i !== null ? Math.min(i + 1, images.length - 1) : null))
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null))
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, images.length])

  if (images.length === 0) return null

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <>
      <section
        ref={sectionRef}
        style={{
          background: 'var(--color-bg)',
          overflow: 'hidden',
          position: 'relative',
        }}
        aria-label="Gallery"
      >
        <div style={{ padding: '5rem 0 2rem' }}>
          <div
            ref={headerRef}
            style={{
              padding: '0 clamp(1.5rem, 5vw, 5rem)',
              marginBottom: '3rem',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
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
                  marginBottom: '0.75rem',
                }}
              >
                {eyebrow}
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                }}
              >
                {titleBefore}{' '}
                <em
                  style={{
                    fontStyle: 'italic',
                    color: 'var(--color-accent)',
                  }}
                >
                  {titleItalic}
                </em>
              </h2>
            </div>

            <Link
              href={ctaHref}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--color-accent)',
                paddingBottom: '2px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
            >
              {ctaLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div
            ref={trackRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1rem clamp(1.5rem, 5vw, 5rem)',
              willChange: isMobile ? undefined : 'transform',
              ...(isMobile
                ? {
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory',
                  }
                : {}),
            }}
          >
            {images.map((image, index) => {
              const ratio = ASPECT_RATIOS[index % ASPECT_RATIOS.length]!
              const offset = VERTICAL_OFFSETS[index % VERTICAL_OFFSETS.length]!

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  style={{
                    flexShrink: 0,
                    width: `${ratio.width}px`,
                    height: `${ratio.height}px`,
                    marginTop: `${offset}px`,
                    position: 'relative',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    padding: 0,
                    background: 'transparent',
                    scrollSnapAlign: isMobile ? 'start' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)'
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                  aria-label={image.caption ?? `Gallery image ${index + 1}`}
                >
                  <Image
                    src={image.url}
                    alt={image.caption ?? `Gallery image ${index + 1}`}
                    fill
                    sizes="400px"
                    style={{ objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '60%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  {image.caption && (
                    <p
                      style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        left: '0.75rem',
                        right: '0.75rem',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.72rem',
                        color: 'rgba(255,255,255,0.85)',
                        margin: 0,
                        lineHeight: 1.4,
                        textAlign: 'left',
                      }}
                    >
                      {image.caption}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {currentImage && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
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
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 'min(900px, 90vw)',
                  height: 'min(600px, 80vh)',
                }}
              >
                <Image
                  src={currentImage.url}
                  alt={currentImage.caption ?? 'Gallery image'}
                  fill
                  sizes="900px"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {currentImage.caption && (
                <p
                  style={{
                    textAlign: 'center',
                    marginTop: '1rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.65)',
                  }}
                >
                  {currentImage.caption}
                </p>
              )}

              <p
                style={{
                  textAlign: 'center',
                  marginTop: '0.5rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {lightboxIndex + 1} / {images.length}
              </p>
            </motion.div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close lightbox"
              style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
            >
              <X size={18} />
            </button>

            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i ?? 1) - 1)
                }}
                aria-label="Previous image"
                style={{
                  position: 'fixed',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {lightboxIndex < images.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((i) => (i ?? 0) + 1)
                }}
                aria-label="Next image"
                style={{
                  position: 'fixed',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
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
