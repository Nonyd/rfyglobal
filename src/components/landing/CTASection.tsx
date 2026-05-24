'use client'

import Link from 'next/link'

export function CTASection({ content }: { content: Record<string, string> }) {
  return (
    <section
      className="reveal relative overflow-hidden py-20 px-6 lg:px-16"
      style={{ background: 'var(--color-accent)' }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p
            className="font-body uppercase mb-4"
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {content['landing.cta.label'] || 'Join Us'}
          </p>
          <h2
            className="font-display font-bold uppercase leading-none"
            style={{
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              color: '#FFFFFF',
            }}
          >
            {content['landing.cta.headline'] || 'The door is open.'}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
          <Link
            href="/join"
            className="inline-flex items-center justify-center px-8 py-4 font-display font-semibold uppercase tracking-wider transition-all duration-300 hover:opacity-90"
            style={{ background: '#FFFFFF', color: 'var(--color-accent)' }}
          >
            {content['landing.cta.button'] || 'Join the Community'}
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center px-8 py-4 font-display font-semibold uppercase tracking-wider border transition-all duration-300 hover:bg-white/10"
            style={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: '#FFFFFF',
            }}
          >
            {content['landing.cta.buttonSecondary'] || 'Our Story'}
          </Link>
        </div>
      </div>
    </section>
  )
}
