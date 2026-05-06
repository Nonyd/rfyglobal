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
    <section className="relative flex min-h-screen flex-col bg-bg grain">
      <Navbar />
      <div className="section-number absolute left-8 top-1/2 -translate-y-1/2 opacity-20">RFY</div>
      <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 items-center gap-4 lg:flex">
        <div className="h-32 w-px bg-gold/60" />
        <p className="origin-center -rotate-90 font-body text-[10px] uppercase tracking-[0.35em] text-gold">
          Jesus to Nations
        </p>
      </div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-20 pt-28 text-left lg:px-12"
      >
        <motion.p
          variants={stagger.item}
          className="mb-8 font-body text-[10px] uppercase tracking-[0.35em] text-gold"
        >
          WORSHIP · PRAYER · COMMUNITY
        </motion.p>

        <motion.h1
          variants={stagger.item}
          className="mb-6 font-display font-bold leading-none"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
        >
          <span className="block text-text-primary">THERE IS</span>
          <span className="text-gradient-gold-electric block">ROOM</span>
          <span className="text-outlined block text-text-primary">FOR YOU.</span>
        </motion.h1>

        <motion.p
          variants={stagger.item}
          className="mb-12 max-w-xl font-body text-lg leading-relaxed text-text-secondary"
        >
          {content['landing.hero.subtext']}
        </motion.p>

        <motion.div variants={stagger.item} className="flex flex-wrap gap-4">
          <Link
            href="/forms/join-room-for-you"
            className="bg-gold px-8 py-4 font-body text-sm font-medium uppercase tracking-widest text-charcoal transition-all duration-300 hover:bg-gold-light"
          >
            Join the Community
          </Link>
          <Link
            href="/about"
            className="border border-theme px-8 py-4 font-body text-sm uppercase tracking-widest text-text-secondary transition-all duration-300 hover:border-gold hover:text-gold"
          >
            Our Story
          </Link>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-6 right-6 z-10 flex items-center justify-between border-t border-theme pt-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-px bg-gold/60" />
          <p className="font-body text-xs uppercase tracking-[0.25em] text-text-muted">Scroll</p>
        </div>
        <p className="font-body text-xs uppercase tracking-[0.2em] text-text-secondary">
          100M+ Streams · 600K+ Followers · Jesus to Nations
        </p>
      </div>
    </section>
  )
}
