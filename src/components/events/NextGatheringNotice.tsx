import Link from 'next/link'
import { format } from 'date-fns'

export interface LastGathering {
  title: string
  date: Date | string
  city: string
}

/**
 * Shown when no upcoming event is published, so visitors still learn when/how to come
 * instead of hitting a dead end. Used on /events (empty state) and the homepage.
 */
export function NextGatheringNotice({
  lastGathering,
  compact = false,
}: {
  lastGathering?: LastGathering | null
  compact?: boolean
}) {
  return (
    <section className={compact ? 'px-6 py-16' : 'py-16 md:py-24'}>
      <div
        className="mx-auto max-w-3xl border px-6 py-12 text-center md:px-12"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface, transparent)' }}
      >
        <p className="label-text mb-4" style={{ color: 'var(--color-accent)' }}>
          Next gathering
        </p>
        <h2 className="mb-4 font-display text-3xl md:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
          The next edition is being planned.
        </h2>
        <p className="mx-auto mb-8 max-w-xl font-body leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Room For You meets every month.
          {lastGathering
            ? ` Our last gathering was ${lastGathering.title} in ${lastGathering.city} on ${format(new Date(lastGathering.date), 'd MMMM yyyy')}.`
            : ''}{' '}
          Join the community to hear about the next date first.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/join" className="btn-primary">
            Get notified
          </Link>
          <Link
            href="/live"
            className="inline-flex items-center border px-8 py-4 font-body text-[11px] uppercase tracking-[0.2em] transition-colors duration-300"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Watch past editions
          </Link>
        </div>
      </div>
    </section>
  )
}
