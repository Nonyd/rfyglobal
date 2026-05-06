'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const EXCERPT_LINES = [
  'I am saved by grace through faith.',
  'I am justified and redeemed by the blood of Jesus.',
  "I am now a part of God's family.",
  'I am saved — and I get others saved.',
  "It's Jesus to nations, and I am a willing vessel.",
]

export function ConfessionReveal() {
  return (
    <section className="bg-ink py-32 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="label-text mb-16 text-center"
        >
          The Confession
        </motion.p>

        <div className="space-y-6 mb-16">
          {EXCERPT_LINES.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-snow"
              style={{
                fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
                lineHeight: '1.2',
                opacity: i === EXCERPT_LINES.length - 1 ? 1 : 0.7 - i * 0.05,
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="gold-line w-24 opacity-30" />
          <p className="font-body text-mist text-sm max-w-md">
            This is the declaration of every member of Room For You.
            Make it yours.
          </p>
          <Link
            href="/confession"
            className="inline-flex items-center gap-2 font-body text-[11px] tracking-[0.2em] uppercase text-gold hover:opacity-70 transition-opacity"
          >
            Read the full confession →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
