'use client'

import { useRef, useEffect, useMemo, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navbar } from '@/components/layout/Navbar'

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
  if (style === 'muted') return { color: 'rgba(255,255,255,0.45)' }
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
      '[data-hero-eyebrow], [data-hero-line1], [data-hero-line2], [data-hero-line3], [data-hero-sub], [data-hero-ctas]'

    const ctx = gsap.context(() => {
      gsap.set(root.querySelectorAll(selector), { opacity: 1 })

      const tl = gsap.timeline({ delay: 0.3 })

      tl.from('[data-hero-eyebrow]', { y: 20, duration: 0.7, ease: 'power3.out' })
        .from('[data-hero-line1]', { y: 40, duration: 0.8, ease: 'power3.out' }, '-=0.4')
        .from('[data-hero-line2]', { y: 40, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('[data-hero-line3]', { y: 40, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('[data-hero-sub]', { y: 20, duration: 0.7, ease: 'power3.out' }, '-=0.4')
        .from('[data-hero-ctas]', { y: 20, duration: 0.7, ease: 'power3.out' }, '-=0.4')
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
      className="relative flex min-h-screen w-full flex-col overflow-hidden"
      style={
        {
          background: '#000000',
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

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(
            105deg,
            rgba(0,0,0,${Math.min(overlayDark + 0.2, 0.85)}) 0%,
            rgba(0,0,0,${overlayDark}) 50%,
            rgba(0,0,0,${Math.max(overlayDark - 0.1, 0.2)}) 100%
          )`,
        }}
      />

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2]"
        style={{
          height: '30%',
          background: 'linear-gradient(to top, var(--color-bg), transparent)',
        }}
      />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div
        className="relative z-[5] flex flex-1 items-center"
        style={{ padding: 'clamp(7rem, 12vw, 8rem) clamp(1.5rem, 5vw, 5rem) 6rem' }}
      >
        <div className="max-w-[720px]">
          <p
            data-hero-eyebrow
            className="label-text mb-6 pl-4"
            style={{
              borderLeft: '2px solid var(--color-accent)',
              color: 'var(--color-accent)',
              margin: '0 0 1.5rem',
            }}
          >
            {eyebrow}
          </p>

          <h1
            className="font-display font-bold uppercase leading-[0.95] tracking-[-0.02em]"
            style={{
              fontSize: 'clamp(3rem, 9vw, 7rem)',
              margin: '0 0 1.75rem',
            }}
          >
            {headlineLines.map((line, i) => (
              <span
                key={i}
                data-hero-line1={i === 0 ? '' : undefined}
                data-hero-line2={i === 1 ? '' : undefined}
                data-hero-line3={i === 2 ? '' : undefined}
                className="block"
                style={headlineStyle(line.style)}
              >
                {line.text}
              </span>
            ))}
          </h1>

          <div className="gold-line-left mb-10 w-48 origin-left" />

          <p
            data-hero-sub
            className="font-body leading-relaxed"
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '520px',
              margin: '0 0 2.5rem',
            }}
          >
            {subtext}
          </p>

          <div data-hero-ctas className="flex flex-wrap items-center gap-4">
            <Link href="/join" className="btn-primary">
              {ctaPrimary}
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center border px-8 py-4 font-body text-[11px] uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white/5"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {ctaSecondary}
            </Link>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 z-[5] flex -translate-x-1/2 flex-col items-center gap-2"
        style={{ opacity: 0.4 }}
      >
        <span
          className="font-body uppercase"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.25em',
            color: '#FFFFFF',
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, #FFFFFF, transparent)',
            animation: 'scroll-pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    </section>
  )
}
