'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { HomeCarouselSlideRecord } from '@/lib/home-carousel-types'

const carouselImageUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_1400,h_900,c_fill,f_auto,q_auto/')
    : url

const lightboxImageUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_1920,f_auto,q_auto/')
    : url

type HomeCarouselProps = {
  slides: HomeCarouselSlideRecord[]
  content: Record<string, string>
}

export function HomeCarousel({ slides, content }: HomeCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
  const wheelIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [userScrolling, setUserScrolling] = useState(false)

  const count = slides.length

  const goTo = useCallback(
    (index: number) => {
      const st = scrollTriggerRef.current
      if (!st || count <= 1) return
      const clamped = ((index % count) + count) % count
      const progress = count <= 1 ? 0 : clamped / (count - 1)
      const target = st.start + progress * (st.end - st.start)
      window.scrollTo({ top: target, behavior: 'smooth' })
      setActiveIndex(clamped)
    },
    [count],
  )

  useLayoutEffect(() => {
    if (count === 0) return
    gsap.registerPlugin(ScrollTrigger)

    const section = sectionRef.current
    const pin = pinRef.current
    const track = trackRef.current
    if (!section || !pin || !track) return

    const getMaxX = () => {
      const max = track.scrollWidth - pin.offsetWidth
      return max > 0 ? max : 0
    }

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.max(window.innerHeight, getMaxX())}`,
        pin: pin,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const maxX = getMaxX()
          gsap.set(track, { x: -self.progress * maxX })
          if (count > 1) {
            const idx = Math.round(self.progress * (count - 1))
            setActiveIndex(idx)
          }
        },
      })
      scrollTriggerRef.current = st

      gsap.set(track, { x: 0 })
    }, section)

    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      scrollTriggerRef.current = null
      ctx.revert()
    }
  }, [count, slides])

  useEffect(() => {
    if (count <= 1 || lightboxIndex !== null) return

    const timer = window.setInterval(() => {
      if (userScrolling) return
      const st = scrollTriggerRef.current
      if (!st || !st.isActive) return
      goTo(activeIndex + 1)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [activeIndex, count, goTo, lightboxIndex, userScrolling])

  useEffect(() => {
    const onWheel = () => {
      setUserScrolling(true)
      if (wheelIdleRef.current) clearTimeout(wheelIdleRef.current)
      wheelIdleRef.current = setTimeout(() => setUserScrolling(false), 1200)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      if (wheelIdleRef.current) clearTimeout(wheelIdleRef.current)
    }
  }, [])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? 0 : (i + 1) % count))
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i === null ? 0 : (i - 1 + count) % count))
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [count, lightboxIndex])

  if (count === 0) return null

  const eyebrow = content['landing.gallery.eyebrow'] || 'Moments'
  const title = content['landing.gallery.title'] || 'Life in'
  const titleAccent = content['landing.gallery.titleAccent'] || 'community.'
  const subtext =
    content['landing.gallery.subtext'] ||
    'Worship, prayer, and fellowship — captured from gatherings around the world.'
  const cta = content['landing.gallery.cta'] || 'View full gallery'

  const lightboxSlide = lightboxIndex !== null ? slides[lightboxIndex] : null

  return (
    <>
      <section
        ref={sectionRef}
        className="relative"
        style={{ background: 'var(--color-bg)' }}
        aria-label="Home carousel"
      >
        <div className="mx-auto max-w-7xl px-6 pt-20 md:pt-28">
          <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
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
              className="group relative z-20 inline-flex shrink-0 items-center gap-2 border px-5 py-3 font-body text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300"
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
        </div>

        <div ref={pinRef} className="relative h-[min(85vh,720px)] w-full overflow-hidden">
          <div
            ref={trackRef}
            className="flex h-full items-stretch gap-5 px-6 will-change-transform md:gap-8 md:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
          >
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group relative h-full shrink-0 overflow-hidden text-left transition-opacity duration-500"
                style={{
                  width: 'min(78vw, 520px)',
                  opacity: i === activeIndex ? 1 : 0.55,
                  border: `1px solid ${i === activeIndex ? 'var(--color-accent)' : 'var(--color-border)'}`,
                }}
                aria-label={`Open ${slide.heading}`}
              >
                <div className="relative h-[calc(100%-4.5rem)] w-full overflow-hidden">
                  <Image
                    src={carouselImageUrl(slide.url)}
                    alt={slide.heading}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 78vw, 520px"
                    priority={i < 2}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.75) 100%)',
                    }}
                  />
                </div>
                <div className="flex h-[4.5rem] items-center px-5">
                  <p
                    className="font-display uppercase tracking-[0.12em] transition-colors duration-300 group-hover:text-[var(--color-accent)]"
                    style={{
                      fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {slide.heading}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {count > 1 && (
            <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className="pointer-events-auto h-1 transition-all duration-300"
                  style={{
                    width: i === activeIndex ? '2rem' : '0.5rem',
                    background:
                      i === activeIndex ? 'var(--color-accent)' : 'var(--color-border-strong)',
                  }}
                  aria-label={`Go to ${s.heading}`}
                  aria-current={i === activeIndex ? 'true' : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-[30vh] min-h-[200px]" aria-hidden />
      </section>

      <AnimatePresence>
        {lightboxSlide && lightboxIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.92)' }}
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={lightboxSlide.heading}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-white md:right-8 md:top-8"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              aria-label="Close lightbox"
            >
              <X size={22} />
            </button>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((lightboxIndex - 1 + count) % count)
                  }}
                  className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white md:left-8"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((lightboxIndex + 1) % count)
                  }}
                  className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white md:right-8"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <motion.div
              key={lightboxSlide.id}
              className="relative max-h-[85vh] w-full max-w-5xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={lightboxImageUrl(lightboxSlide.url)}
                  alt={lightboxSlide.heading}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              <p
                className="mt-6 text-center font-display text-2xl uppercase tracking-[0.15em] md:text-3xl"
                style={{ color: '#FFFFFF' }}
              >
                {lightboxSlide.heading}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
