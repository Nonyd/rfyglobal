'use client'

import { motion } from 'framer-motion'
import { cmsLines } from '@/lib/cms-utils'

const DEFAULT_ACTIVITIES = [
  'Monthly community gatherings across cities',
  'Corporate prayer and intercession',
  'Structured online Bible study',
  'One-on-one mentorship and counseling',
  'Foot evangelism and outreaches',
]

export function VisionSection({ content }: { content: Record<string, string> }) {
  const activities = cmsLines(content['landing.vision.activities'], DEFAULT_ACTIVITIES)

  return (
    <section className="py-24 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="label-text mb-8">{content['landing.vision.label'] || 'The Vision'}</p>
          <h2
            className="font-display leading-tight mb-8"
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
              color: 'var(--color-text-primary)',
            }}
          >
            {content['landing.vision.heading'] || 'Building a community'}
            <br />
            <span className="text-crimson-gradient italic">
              {content['landing.vision.subheading'] || 'Jesus to Nations'}
            </span>
          </h2>
          <p
            className="font-body leading-relaxed text-lg max-w-md"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {content['landing.vision.text'] ||
              'Building a community of young men and women who sing songs of salvation with conviction of their identity in Christ.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <div>
            <p className="label-text mb-4">{content['landing.vision.mission.label'] || 'The Mission'}</p>
            <p className="font-display text-4xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {content['landing.vision.mission.heading'] || 'Jesus to Nations'}
            </p>
            <p className="font-display text-lg italic text-crimson opacity-70">
              {content['landing.vision.mission.scripture'] || '2 Corinthians 5:17–21'}
            </p>
          </div>

          <div className="gold-line-left w-24 opacity-30" />

          <div className="space-y-4">
            {activities.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-4"
              >
                <div className="w-px h-4 mt-1 shrink-0" style={{ background: 'var(--color-accent)' }} />
                <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {item}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
