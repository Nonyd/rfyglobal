'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const activities = [
  'Monthly meetings & gatherings',
  'Corporate and personal prayer',
  'Structured Bible study',
  'Mentorship & counseling',
  'Evangelism & outreach',
]

export function VisionSection({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative bg-black-soft py-24 noise-overlay">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-display-lg text-white">
            {content['landing.vision.heading']}
            <span className="mt-2 block text-gradient-gold italic">
              {content['landing.vision.subheading']}
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="lg:border-l lg:border-gold-subtle lg:pl-16"
        >
          <p className="font-body text-lg leading-relaxed text-white/70">
            {content['landing.vision.text']}
          </p>
          <p className="mt-6 font-body text-sm uppercase tracking-widest text-gold">
            2 Corinthians 5:17–21
          </p>
          <ul className="mt-10 space-y-4 font-body text-white/60">
            {activities.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/about"
            className="mt-10 inline-block font-body text-sm uppercase tracking-widest text-gold hover:text-gold-light"
          >
            Learn more →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
