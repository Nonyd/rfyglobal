'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState, useMemo } from 'react'
import { Navbar } from '@/components/layout/Navbar'

function heroHeadlineLines(headline1: string, headline2: string) {
  const h1 = headline1.trim() || 'There Is Room'
  const h2 = headline2.trim() || 'For You.'
  const parts = h1.split(/\s+/)
  if (parts.length >= 2) {
    return [
      { text: parts.slice(0, -1).join(' ').toUpperCase(), muted: true, delay: 0.2 },
      { text: parts[parts.length - 1]!.toUpperCase(), muted: false, delay: 0.5 },
      { text: h2.toUpperCase(), muted: false, delay: 0.8 },
    ]
  }
  return [
    { text: h1.toUpperCase(), muted: false, delay: 0.2 },
    { text: h2.toUpperCase(), muted: false, delay: 0.5 },
  ]
}

export function Hero({ content }: { content: Record<string, string> }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = !mounted || resolvedTheme === 'dark'
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
    <section className="relative min-h-screen bg-void overflow-hidden flex flex-col">
      <Navbar />

      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 70% 50%, rgba(139,0,0,0.06) 0%, transparent 60%)',
          top: '50%',
          right: '10%',
          transform: 'translateY(-50%)',
        }}
      />

      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none hidden lg:block">
        <div
          className="absolute inset-0 z-10"
          style={{
            background: isDark
              ? 'linear-gradient(to right, #0F0F0F 0%, #0F0F0F 35%, rgba(15,15,15,0.7) 60%, rgba(15,15,15,0.2) 100%)'
              : 'linear-gradient(to right, #F5F0E8 0%, #F5F0E8 35%, rgba(245,240,232,0.7) 60%, rgba(245,240,232,0.2) 100%)',
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
      </div>

      <div className="relative z-10 flex flex-col justify-center flex-1 px-6 lg:px-16 xl:px-24 pt-28 pb-20 max-w-7xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="label-text mb-10 pl-4"
          style={{ borderLeft: '2px solid #8B0000' }}
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
              className="font-display font-bold leading-none"
              style={{
                fontSize: 'clamp(4rem, 11vw, 10rem)',
                color: word.muted
                  ? 'rgba(248,248,248,0.25)'
                  : isDark
                    ? '#F8F8F8'
                    : '#0F0C08',
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
          className="font-body text-mist text-lg leading-relaxed max-w-lg mb-12"
          style={{ color: isDark ? '#A0A0A0' : '#3D3530' }}
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
          <Link
            href="/join"
            className="inline-flex items-center px-8 py-4 font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-white transition-all duration-300 hover:opacity-90"
            style={{ background: '#8B0000' }}
          >
            {content['landing.hero.cta.primary'] || 'Join the Community'}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-8 py-4 border font-body text-[11px] tracking-[0.2em] uppercase text-white transition-all duration-300 hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}
          >
            {content['landing.hero.cta.secondary'] || 'Our Story'}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 right-10 hidden lg:flex flex-col items-center gap-2"
      >
        <div
          className="w-px h-16 opacity-40"
          style={{
            background: 'linear-gradient(to bottom, transparent, #8B0000)',
          }}
        />
        <div className="w-1 h-1 rounded-full bg-crimson" />
      </motion.div>
    </section>
  )
}
