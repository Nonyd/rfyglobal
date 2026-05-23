'use client'

import { motion } from 'framer-motion'

export function CommunityHighlights({ content }: { content: Record<string, string> }) {
  const highlights = [
    { n: '01', title: content['highlights.1.title'] || 'Monthly Meetings', desc: content['highlights.1.desc'] || 'Physical gatherings across cities.' },
    { n: '02', title: content['highlights.2.title'] || 'Prayer', desc: content['highlights.2.desc'] || 'Corporate and personal intercession.' },
    { n: '03', title: content['highlights.3.title'] || 'Bible Study', desc: content['highlights.3.desc'] || 'Structured study with weekly tasks.' },
    { n: '04', title: content['highlights.4.title'] || 'Mentorship', desc: content['highlights.4.desc'] || 'One-on-one counseling and growth.' },
  ]

  const sectionTitle = content['highlights.section.title'] || 'Community'
  const sectionAccent = content['highlights.section.titleAccent'] || 'life.'

  return (
    <section className="py-24 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="label-text mb-4">{content['highlights.section.eyebrow'] || 'What We Do'}</p>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: 'var(--color-text-primary)' }}
            >
              {sectionTitle} <span className="italic text-crimson-gradient">{sectionAccent}</span>
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--color-border)' }}>
          {highlights.map((h, i) => (
            <motion.div
              key={h.n}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-10 hover-lift group cursor-default border border-transparent transition-colors duration-300"
              style={{ background: 'var(--color-surface)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              <p
                className="font-display text-6xl mb-8 font-bold transition-colors duration-500 group-hover:opacity-30"
                style={{ color: 'var(--color-border-strong)' }}
              >
                {h.n}
              </p>
              <h3
                className="font-display text-2xl mb-3 transition-colors duration-300 group-hover:text-[var(--color-accent)]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {h.title}
              </h3>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {h.desc}
              </p>
              <div className="gold-line-left w-0 group-hover:w-12 transition-all duration-500 mt-6 opacity-60" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
