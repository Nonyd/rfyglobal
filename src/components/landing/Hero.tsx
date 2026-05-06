'use client'

import { motion } from 'framer-motion'
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
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-bg grain">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,168,71,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,rgba(208,2,27,0.06),transparent_45%)]" />

      <Navbar />
      <div className="section-number absolute left-4 top-1/2 hidden -translate-y-1/2 opacity-[0.18] sm:left-8 lg:block">RFY</div>
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 lg:flex xl:right-10">
        <div className="h-32 w-px bg-gradient-to-b from-transparent via-gold/70 to-transparent" />
        <p className="origin-center -rotate-90 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Jesus to Nations</p>
      </div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-24 pt-28 text-left lg:px-12 lg:pb-28 lg:pt-32"
      >
        <motion.p variants={stagger.item} className="mb-8 font-body text-[10px] uppercase tracking-[0.35em] text-gold">
          WORSHIP · PRAYER · COMMUNITY
        </motion.p>

        <motion.h1
          variants={stagger.item}
          className="mb-6 font-display font-bold leading-[0.95] tracking-tight"
          style={{ fontSize: 'clamp(3rem, 9vw, 8rem)' }}
        >
          <span className="block text-text-primary">THERE IS</span>
          <span className="text-gradient-gold-electric block">ROOM</span>
          <span className="text-outlined block text-text-primary">FOR YOU.</span>
        </motion.h1>

        <motion.p variants={stagger.item} className="mb-12 max-w-xl font-body text-lg leading-relaxed text-text-secondary md:text-xl">
          {content['landing.hero.subtext']}
        </motion.p>

        <motion.div variants={stagger.item} className="flex flex-wrap gap-4">
          <Link
            href="/forms/join-room-for-you"
            className="rfy-focus inline-flex bg-gold px-8 py-4 font-body text-sm font-semibold uppercase tracking-[0.2em] text-charcoal shadow-soft transition-all duration-300 hover:bg-gold-light"
          >
            Join the Community
          </Link>
          <Link
            href="/about"
            className="rfy-focus inline-flex border border-theme px-8 py-4 font-body text-sm uppercase tracking-[0.2em] text-text-secondary transition-all duration-300 hover:border-gold hover:text-gold"
          >
            Our Story
          </Link>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-4 border-t border-theme/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-px bg-gradient-to-b from-gold/80 to-transparent" />
          <p className="font-body text-xs uppercase tracking-[0.25em] text-text-muted">Scroll</p>
        </div>
        <p className="font-body text-xs uppercase tracking-[0.2em] text-text-secondary sm:text-right">
          100M+ Streams · 600K+ Followers · Jesus to Nations
        </p>
      </div>
    </section>
  )
}
