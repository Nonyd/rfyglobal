'use client'

import { useRef, useEffect, useMemo, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navbar } from '@/components/layout/Navbar'

const HERO_GRADIENT = `
  radial-gradient(ellipse 70% 60% at 70% 40%, rgba(232,0,28,0.18) 0%, transparent 60%),
  radial-gradient(ellipse 50% 50% at 20% 80%, rgba(10,22,40,0.9) 0%, transparent 60%),
  linear-gradient(160deg, #1C1C1C 0%, #0a0000 60%, #0A1628 100%)
`

type HeadlineLine = {
  text: string
  style: 'muted' | 'outlined' | 'solid'
  delay: number
}

function heroHeadlineLines(headline1: string, headline2: string): HeadlineLine[] {
  const h1 = headline1.trim() || 'There Is Room'
  const h2 = headline2.trim() || 'For You.'
  const parts = h1.split(/\s+/)
  if (parts.length >= 2) {
    return [
      { text: parts.slice(0, -1).join(' ').toUpperCase(), style: 'muted', delay: 0.2 },
      { text: parts[parts.length - 1]!.toUpperCase(), style: 'outlined', delay: 0.5 },
      { text: h2.toUpperCase(), style: 'solid', delay: 0.8 },
    ]
  }
  return [
    { text: h1.toUpperCase(), style: 'solid', delay: 0.2 },
    { text: h2.toUpperCase(), style: 'solid', delay: 0.5 },
  ]
}

function headlineStyle(style: HeadlineLine['style']): CSSProperties {
  if (style === 'muted') return { color: 'rgba(248,248,248,0.25)' }
  if (style === 'outlined') {
    return {
      color: 'transparent',
      WebkitTextStroke: '2px var(--color-accent)',
    }
  }
  return { color: '#FFFFFF' }
}

const SUBTEXT_DEFAULT =
  'A community of young men and women singing songs of salvation, studying the Word, and getting others saved. Jesus to nations.'

export function Hero({ content }: { content: Record<string, string> }) {
  const containerRef = useRef<HTMLElement>(null)

  const eyebrow = content['landing.hero.eyebrow'] || 'Worship · Prayer · Study · Community'
  const subtext = content['landing.hero.subtext'] || SUBTEXT_DEFAULT
  const ctaPrimary = content['landing.hero.cta.primary'] || 'Join the Community'
  const ctaSecondary = content['landing.hero.cta.secondary'] || 'Our Story'
  const bgImage = (content['landing.hero.bg_image'] || '').trim()
  const bgVideo = (content['landing.hero.bg_video'] || '').trim()
  const hasMedia = Boolean(bgVideo || bgImage)
  const overlayOpacity = parseFloat(content['landing.hero.bg_overlay'] || '0.55')
  const bgPosition = (content['landing.hero.bg_position'] || 'center').trim() || 'center'
  const bgPositionMobile =
    (content['landing.hero.bg_position_mobile'] || '70% center').trim() || '70% center'

  const headlineLines = useMemo(
    () =>
      heroHeadlineLines(
        content['landing.hero.headline1'] || 'There Is Room',
        content['landing.hero.headline2'] || 'For You.',
      ),
    [content],
  )

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const selector =
      '[data-hero-eyebrow], [data-hero-line1], [data-hero-line2], [data-hero-line3], [data-hero-sub], [data-hero-ctas], [data-hero-gold-line]'

    const ctx = gsap.context(() => {
      gsap.set(root.querySelectorAll(selector), { opacity: 1 })

      const tl = gsap.timeline({ delay: 0.1 })

      tl.from('[data-hero-eyebrow]', { opacity: 0, duration: 0.8, ease: 'power2.out' })
        .from('[data-hero-line1]', { y: 40, duration: 0.9, ease: [0.16, 1, 0.3, 1] }, '-=0.5')
        .from('[data-hero-line2]', { y: 40, duration: 0.9, ease: [0.16, 1, 0.3, 1] }, '-=0.7')
        .from('[data-hero-line3]', { y: 40, duration: 0.9, ease: [0.16, 1, 0.3, 1] }, '-=0.7')
        .from('[data-hero-gold-line]', { scaleX: 0, opacity: 0, duration: 1.2, ease: [0.16, 1, 0.3, 1] }, '-=0.3')
        .from('[data-hero-sub]', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
        .from('[data-hero-ctas]', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    }, root)

    return () => {
      ctx.revert()
      root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        el.style.removeProperty('opacity')
        el.style.removeProperty('transform')
      })
    }
  }, [])

  const overlayDark = Number.isFinite(overlayOpacity) ? overlayOpacity : 0.55

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={
        {
          background: hasMedia ? '#000000' : HERO_GRADIENT,
          color: 'var(--color-hero-text)',
          '--hero-bg-position': bgPosition,
          '--hero-bg-position-mobile': bgPositionMobile,
        } as CSSProperties
      }
    >
      {bgVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={bgImage || undefined}
          className="hero-bg-media absolute inset-0 z-0 h-full w-full object-cover"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
      ) : null}

      {bgImage && !bgVideo ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-bg-media object-cover"
            unoptimized={bgImage.startsWith('/uploads/') || bgImage.endsWith('.svg')}
          />
        </div>
      ) : null}

      {hasMedia ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: `linear-gradient(
              105deg,
              rgba(0,0,0,${Math.min(overlayDark + 0.2, 0.85)}) 0%,
              rgba(0,0,0,${overlayDark}) 45%,
              rgba(0,0,0,${Math.max(overlayDark - 0.15, 0.25)}) 100%
            )`,
          }}
        />
      ) : null}

      <div
        className="pointer-events-none absolute right-0 top-0 z-[2]"
        style={{
          width: '42vw',
          height: '100%',
          background: 'linear-gradient(180deg, #E8001C 0%, #FF4500 100%)',
          clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
          opacity: 0.07,
        }}
      />
      <div
        className="pointer-events-none absolute top-0 z-[2]"
        style={{
          right: 'calc(42vw - 3.24vw - 2px)',
          width: '3px',
          height: '100%',
          background: 'linear-gradient(180deg, transparent, #E8001C, #FF4500, transparent)',
          opacity: 0.6,
        }}
      />

      <Navbar />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-20 pt-28 lg:px-16 xl:px-24">
        <p
          data-hero-eyebrow
          className="label-text mb-10 pl-4"
          style={{ borderLeft: '2px solid var(--color-accent)', color: 'rgba(255,255,255,0.6)' }}
        >
          {eyebrow}
        </p>

        <div className="mb-12 space-y-2">
          {headlineLines.map((line, i) => (
            <h1
              key={i}
              data-hero-line1={i === 0 ? '' : undefined}
              data-hero-line2={i === 1 ? '' : undefined}
              data-hero-line3={i === 2 ? '' : undefined}
              className="font-display font-bold uppercase leading-none"
              style={{
                fontSize: 'clamp(5rem, 14vw, 14rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                ...headlineStyle(line.style),
              }}
            >
              {line.text}
            </h1>
          ))}
        </div>

        <div
          data-hero-gold-line
          className="gold-line-left mb-10 w-48 origin-left"
        />

        <p
          data-hero-sub
          className="mb-12 max-w-lg font-body text-lg leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {subtext}
        </p>

        <div data-hero-ctas className="flex flex-wrap gap-4">
          <Link href="/join" className="btn-primary">
            {ctaPrimary}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center border px-8 py-4 font-body text-[11px] uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'var(--color-hero-text)' }}
          >
            {ctaSecondary}
          </Link>
        </div>
      </div>

      <div
        className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        style={{ opacity: 1 }}
      >
        <span
          className="font-body uppercase"
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: '1px',
            height: '48px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
            animation: 'scroll-pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    </section>
  )
}
