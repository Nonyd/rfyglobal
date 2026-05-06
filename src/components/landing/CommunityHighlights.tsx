'use client'

import { motion } from 'framer-motion'
import { BookOpen, CalendarHeart, HeartHandshake, Users } from 'lucide-react'

const ICONS = [CalendarHeart, HeartHandshake, BookOpen, Users] as const

export function CommunityHighlights({ content }: { content: Record<string, string> }) {
  const cards = [1, 2, 3, 4].map((n, i) => ({
    title: content[`highlights.${n}.title`],
    description: content[`highlights.${n}.desc`],
    icon: ICONS[i]!,
  }))
  return (
    <section className="bg-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="section-number absolute left-8 opacity-20">04</div>
        <p className="mb-3 font-body text-[10px] uppercase tracking-[0.35em] text-gold">WHAT WE DO</p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-display-lg text-text-primary"
        >
          Community <span className="text-gradient-gold italic">highlights</span>
        </motion.h2>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.article
                key={`highlight-${i}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="group relative border border-theme surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold"
              >
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="h-full w-full bg-[radial-gradient(ellipse_at_bottom,rgba(201,168,76,0.18),transparent_70%)]" />
                </div>
                <div className="relative z-10">
                  <p className="font-display text-2xl text-gold">{String(i + 1).padStart(2, '0')}</p>
                  <Icon className="mt-2 h-8 w-8 text-gold" aria-hidden />
                  <h3 className="mt-5 font-display text-2xl text-text-primary">{card.title}</h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-text-secondary">
                    {card.description}
                  </p>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
