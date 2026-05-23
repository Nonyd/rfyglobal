'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function FromTheShepherd({ content }: { content: Record<string, string> }) {
  const portrait = (content['landing.shepherd.portrait'] || '/images/yadah-portrait.jpg').trim()

  return (
    <section className="relative py-24 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-[4/5] max-w-md mx-auto lg:mx-0 w-full overflow-hidden"
        >
          <Image
            src={portrait}
            alt="Minister Yadah"
            fill
            className="object-cover object-top"
            unoptimized={portrait.endsWith('.svg')}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="label-text mb-8">{content['landing.shepherd.label'] || 'From the Shepherd'}</p>
          <blockquote
            className="font-display italic leading-relaxed mb-8"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              color: 'var(--color-text-primary)',
            }}
          >
            &ldquo;{content['landing.shepherd.quote'] ||
              'There is room for you here. Not because you earned it — because He made room.'}&rdquo;
          </blockquote>
          <p className="font-body text-sm tracking-[0.2em] uppercase" style={{ color: 'var(--color-accent)' }}>
            {content['landing.shepherd.name'] || 'Minister Yadah'}
          </p>
          <p className="font-body text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            {content['landing.shepherd.title'] || 'Founder, Room For You'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
