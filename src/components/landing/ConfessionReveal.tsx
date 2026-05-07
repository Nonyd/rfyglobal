'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const EXCERPT_LINES = [
  'I am saved by grace through faith.',
  'I am justified and redeemed by the blood of Jesus.',
  "I am now a part of God's family.",
  'I am saved — and I get others saved.',
  "It's Jesus to nations, and I am a willing vessel.",
]

export function ConfessionReveal() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <section className="py-32 px-6 overflow-hidden" style={{ background: isDark ? '#1A1A1A' : '#EDE7DB' }}>
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
              className="font-display"
              style={{
                fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
                lineHeight: '1.2',
                color: isDark
                  ? `rgba(248,248,248,${Math.max(0.4, 0.85 - i * 0.08)})`
                  : `rgba(15,12,8,${Math.max(0.5, 0.9 - i * 0.06)})`,
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
          <p className="font-body text-sm max-w-md" style={{ color: isDark ? '#A0A0A0' : '#5C5248' }}>
            This is the declaration of every member of Room For You.
            Make it yours.
          </p>
          <Link
            href="/confession"
            className="inline-flex items-center gap-2 font-body text-[11px] tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
            style={{ color: '#8B5A00' }}
          >
            Read the full confession →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
