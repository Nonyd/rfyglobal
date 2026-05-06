'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
  },
  item: {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  },
}

export function Hero({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative flex min-h-screen flex-col bg-black noise-overlay">
      <Navbar />

      <div
        className="pointer-events-none absolute inset-0 animate-gold-shimmer"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(201,168,76,0.08), transparent)',
        }}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image
          src="/images/logo-white.svg"
          alt=""
          width={640}
          height={480}
          priority
          className="h-[min(70vw,480px)] w-[min(90vw,640px)] object-contain opacity-[0.05]"
        />
      </div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-24 text-center"
      >
        <motion.p
          variants={stagger.item}
          className="mb-8 font-body text-[10px] uppercase tracking-[0.35em] text-gold"
        >
          {content['landing.hero.eyebrow']}
        </motion.p>

        <motion.h1
          variants={stagger.item}
          className="font-display mb-6 font-bold leading-none"
          style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}
        >
          <span className="block text-white">{content['landing.hero.headline1']}</span>
          <span className="text-gradient-gold block italic">{content['landing.hero.headline2']}</span>
        </motion.h1>

        <motion.p
          variants={stagger.item}
          className="mx-auto mb-12 max-w-xl font-body text-lg leading-relaxed text-white/60"
        >
          {content['landing.hero.subtext']}
        </motion.p>

        <motion.div variants={stagger.item} className="flex flex-wrap justify-center gap-4">
          <Link
            href="/forms/join-room-for-you"
            className="animate-pulse-gold bg-gold px-8 py-4 font-body text-sm font-medium uppercase tracking-widest text-black transition-all duration-300 hover:bg-gold-light"
          >
            {content['landing.hero.cta.primary']}
          </Link>
          <Link
            href="/about"
            className="border border-white/20 px-8 py-4 font-body text-sm uppercase tracking-widest text-white transition-all duration-300 hover:border-gold hover:text-gold"
          >
            {content['landing.hero.cta.secondary']}
          </Link>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <div className="h-12 w-px bg-gradient-to-b from-transparent to-gold opacity-60" />
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
      </div>
    </section>
  )
}
