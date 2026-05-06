'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export function FromTheShepherd({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative bg-void overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={content['shepherd.image'] || '/images/yadah-portrait.jpg'}
          alt="Minister Yadah"
          fill
          className="object-cover object-top opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-40">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="label-text mb-10"
          >
            From the Shepherd
          </motion.p>

          <motion.blockquote
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-snow italic mb-10"
            style={{ fontSize: 'clamp(1.3rem, 3vw, 2.2rem)', lineHeight: '1.5' }}
          >
            &ldquo;{content['shepherd.quote'] || 'There is room for you here.'}&rdquo;
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="gold-line-left w-16 mb-6 opacity-60" />

            <p className="font-display text-2xl text-gold mb-1">
              {content['shepherd.name'] || 'Minister Yadah'}
            </p>
            <p className="label-text opacity-50 mb-8">
              {content['shepherd.title'] || 'Founder · Room For You'}
            </p>

            <Link
              href={content['shepherd.link'] || 'https://yadahworld.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[11px] tracking-[0.2em] uppercase text-gold hover:opacity-70 transition-opacity"
            >
              Visit yadahworld.com →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
