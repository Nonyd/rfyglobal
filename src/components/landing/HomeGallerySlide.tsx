'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import type { HomeGallerySlide as Slide } from '@/lib/gallery-types'

const slideUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_1600,h_900,c_fill,f_auto,q_auto/')
    : url

function slideLabel(slide: Slide): string | null {
  if (slide.caption?.trim()) return slide.caption.trim()
  if (slide.galleryEvent?.name) return slide.galleryEvent.name
  if (slide.eventName?.trim()) return slide.eventName.trim()
  return null
}

function slideLocation(slide: Slide): string | null {
  const city = slide.galleryEvent?.city ?? slide.city
  return city?.trim() || null
}

type HomeGallerySlideProps = {
  slides: Slide[]
  content: Record<string, string>
}

export function HomeGallerySlide({ slides, content }: HomeGallerySlideProps) {
  const [index, setIndex] = useState(0)
  const count = slides.length

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (count <= 1) return
    const timer = window.setInterval(() => go(1), 6000)
    return () => window.clearInterval(timer)
  }, [count, go])

  if (count === 0) return null

  const current = slides[index]!
  const label = slideLabel(current)
  const location = slideLocation(current)

  const eyebrow = content['landing.gallery.eyebrow'] || 'Moments'
  const title = content['landing.gallery.title'] || 'Life in'
  const titleAccent = content['landing.gallery.titleAccent'] || 'community.'
  const subtext =
    content['landing.gallery.subtext'] ||
    'Gatherings, worship, and fellowship captured from cities around the world.'
  const cta = content['landing.gallery.cta'] || 'View full gallery'

  return (
    <section
      className="reveal relative overflow-hidden py-20 md:py-28"
      style={{ background: 'var(--color-bg)' }}
      aria-label="Gallery highlights"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="label-text mb-4">{eyebrow}</p>
            <h2
              className="font-display leading-tight"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                color: 'var(--color-text-primary)',
              }}
            >
              {title}{' '}
              <span className="text-crimson-gradient italic">{titleAccent}</span>
            </h2>
            <p
              className="mt-4 font-body text-sm leading-relaxed md:text-base"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {subtext}
            </p>
          </div>
          <Link
            href="/gallery"
            className="group inline-flex shrink-0 items-center gap-2 border px-5 py-3 font-body text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.color = 'var(--color-accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-strong)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
          >
            {cta}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            border: '1px solid var(--color-border)',
            aspectRatio: '16 / 9',
            maxHeight: 'min(72vh, 640px)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={slideUrl(current.url)}
                alt={label ?? 'Community gallery'}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </motion.div>
          </AnimatePresence>

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.55) 100%)',
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 100% 100%, rgba(232,0,28,0.35), transparent 55%)',
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-3 p-6 md:p-10">
            <AnimatePresence mode="wait">
              {(label || location) && (
                <motion.div
                  key={`${current.id}-caption`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5 }}
                >
                  {label && (
                    <p
                      className="font-display text-xl md:text-3xl"
                      style={{ color: '#FFFFFF' }}
                    >
                      {label}
                    </p>
                  )}
                  {location && (
                    <p
                      className="mt-1 font-body text-xs uppercase tracking-[0.25em]"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      {location}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {count > 1 && (
              <div className="flex items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className="pointer-events-auto h-1 transition-all duration-300"
                    style={{
                      width: i === index ? '2rem' : '0.5rem',
                      background:
                        i === index ? 'var(--color-accent)' : 'rgba(255,255,255,0.35)',
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index ? 'true' : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors md:left-5"
                style={{
                  background: 'rgba(0,0,0,0.45)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors md:right-5"
                style={{
                  background: 'rgba(0,0,0,0.45)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

        </div>
      </div>
    </section>
  )
}
