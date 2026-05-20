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
    <section className="py-32 px-6" style={{ background: 'rgb(var(--color-bg))' }}>
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
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: 'rgb(var(--color-text-primary))' }}
            >
              {sectionTitle} <span className="italic text-gold-gradient">{sectionAccent}</span>
            </h2>
          </motion.div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-px"
          style={{ background: 'rgb(var(--color-border))' }}
        >
          {highlights.map((h, i) => (
            <motion.div
              key={h.n}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-10 hover-lift group cursor-default"
              style={{ background: 'rgb(var(--color-bg))' }}
            >
              <p
                className="font-display text-6xl group-hover:text-gold/20 transition-colors duration-500 mb-8 font-bold"
                style={{ color: 'rgb(var(--color-border))' }}
              >
                {h.n}
              </p>
              <h3
                className="font-display text-2xl mb-3 group-hover:text-gold transition-colors duration-300"
                style={{ color: 'rgb(var(--color-text-primary))' }}
              >
                {h.title}
              </h3>
              <p
                className="font-body text-sm leading-relaxed"
                style={{ color: 'rgb(var(--color-text-secondary))' }}
              >
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
