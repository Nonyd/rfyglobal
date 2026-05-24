'use client'

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
    <section className="reveal py-24 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-20">
          <div>
            <p className="label-text mb-4">{content['highlights.section.eyebrow'] || 'What We Do'}</p>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: 'var(--color-text-primary)' }}
            >
              {sectionTitle} <span className="italic text-crimson-gradient">{sectionAccent}</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {highlights.map((h) => (
            <div
              key={h.n}
              className="group relative overflow-hidden transition-all duration-300"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '2.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = 'var(--color-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <p
                className="font-display font-bold mb-8 transition-colors duration-400 group-hover:text-[rgba(232,0,28,0.2)]"
                style={{ fontSize: '3.5rem', color: 'var(--color-border-strong)' }}
              >
                {h.n}
              </p>
              <h3
                className="font-display uppercase mb-3 transition-colors duration-300 group-hover:text-[var(--color-accent)]"
                style={{
                  fontSize: '1.4rem',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-primary)',
                }}
              >
                {h.title}
              </h3>
              <p className="font-body" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {h.desc}
              </p>
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-0 transition-transform duration-400 ease-out group-hover:scale-x-100"
                style={{ background: 'var(--color-accent)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
