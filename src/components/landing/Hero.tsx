'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useMemo, type CSSProperties } from 'react'
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
  if (style === 'muted') return { color: 'rgba(248,248,248,0.25)' }
  if (style === 'outlined') {
    return {
      color: 'transparent',
      WebkitTextStroke: '2px var(--color-accent)',
    }
  }
  return { color: '#FFFFFF' }
}

export function Hero({ content }: { content: Record<string, string> }) {
  const portrait = (content['landing.hero.portrait'] || '/images/yadah-portrait.jpg').trim()
  const words = useMemo(
    () =>
      heroHeadlineLines(
        content['landing.hero.headline1'] || 'There Is Room',
        content['landing.hero.headline2'] || 'For You.',
      ),
    [content],
  )

  return (
    <section
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{
        background: `
          radial-gradient(ellipse 70% 60% at 70% 40%, rgba(232,0,28,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 20% 80%, rgba(10,22,40,0.9) 0%, transparent 60%),
          linear-gradient(160deg, #1C1C1C 0%, #0a0000 60%, #0A1628 100%)
        `,
        color: 'var(--color-hero-text)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '42vw',
          height: '100%',
          background: 'linear-gradient(180deg, #E8001C 0%, #FF4500 100%)',
          clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
          opacity: 0.07,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          right: 'calc(42vw - 3.24vw - 2px)',
          width: '3px',
          height: '100%',
          background: 'linear-gradient(180deg, transparent, #E8001C, #FF4500, transparent)',
          opacity: 0.6,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      <Navbar />

      <motion.div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none hidden lg:block z-[3]">
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          }}
        />
        <Image
          src={portrait}
          alt=""
          fill
          className="object-cover object-top opacity-30"
          priority
          unoptimized={portrait.endsWith('.svg')}
        />
      </motion.div>

      <motion.div className="relative z-10 flex flex-col justify-center flex-1 px-6 lg:px-16 xl:px-24 pt-28 pb-20 max-w-7xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="label-text mb-10 pl-4"
          style={{ borderLeft: '2px solid var(--color-accent)', color: 'rgba(255,255,255,0.6)' }}
        >
          {content['landing.hero.eyebrow'] || 'Worship · Prayer · Study · Community'}
        </motion.p>

        <div className="space-y-2 mb-12">
          {words.map((word, i) => (
            <motion.h1
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: word.delay, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold leading-none uppercase"
              style={{
                fontSize: 'clamp(5rem, 14vw, 14rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                ...headlineStyle(word.style),
              }}
            >
              {word.text}
            </motion.h1>
          ))}
        </div>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="gold-line-left w-48 mb-10 origin-left"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="font-body text-lg leading-relaxed max-w-lg mb-12"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {content['landing.hero.subtext'] ||
            'A community of young men and women singing songs of salvation, studying the Word, and getting others saved.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="flex flex-wrap gap-4"
        >
          <Link href="/join" className="btn-primary">
            {content['landing.hero.cta.primary'] || 'Join the Community'}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-8 py-4 border font-body text-[11px] tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'var(--color-hero-text)' }}
          >
            {content['landing.hero.cta.secondary'] || 'Our Story'}
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
          }}
        >
          Scroll
        </span>
        <motion.div
          style={{
            width: '1px',
            height: '48px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
            animation: 'scroll-pulse 2s ease-in-out infinite',
          }}
        />
      </motion.div>
    </section>
  )
}
