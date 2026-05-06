'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function CTASection({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative bg-gold overflow-hidden py-40 px-6">
      <div
        className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-void font-bold leading-none mb-8"
          style={{ fontSize: 'clamp(3rem, 10vw, 9rem)' }}
        >
          {content['landing.cta.headline'] || 'The door is open.'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-body text-void/70 text-lg mb-12"
        >
          {content['landing.cta.subtext'] || 'Step in. There is room for you.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Link
            href="/join"
            className="inline-flex items-center px-10 py-4 bg-void text-snow font-body text-[11px] font-semibold tracking-[0.25em] uppercase hover:bg-smoke transition-all duration-300"
          >
            {content['landing.cta.button'] || 'Join the Community'}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
