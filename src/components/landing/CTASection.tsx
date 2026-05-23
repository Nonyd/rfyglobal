'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function CTASection({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative overflow-hidden py-24 px-6" style={{ background: '#8B0000' }}>
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold leading-none mb-8"
          style={{ fontSize: 'clamp(3rem, 10vw, 9rem)', color: '#F8F8F8' }}
        >
          {content['landing.cta.headline'] || 'The door is open.'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-body text-lg mb-12"
          style={{ color: 'rgba(248,248,248,0.7)' }}
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
            className="inline-flex items-center px-10 py-4 font-body text-[11px] font-semibold tracking-[0.25em] uppercase transition-all duration-300 hover:opacity-90"
            style={{ background: '#0F0F0F', color: '#F8F8F8' }}
          >
            {content['landing.cta.button'] || 'Join the Community'}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
