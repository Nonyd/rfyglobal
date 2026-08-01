import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { LiveClient } from '@/components/live/LiveClient'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { getPageMetadata } from '@/lib/cms-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Room For You Live | Past Editions',
    'Watch past editions of Room For You — worship nights, prayer sessions and community gatherings.',
    '/live',
  )
}

export const dynamic = 'force-dynamic'

export default async function LivePage() {
  const [initialVideos, total] = await Promise.all([
    db.rfyLiveVideo
      .findMany({
        where: { isActive: true },
        orderBy: { publishedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          youtubeVideoId: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          publishedAt: true,
          durationSec: true,
          viewCount: true,
        },
      })
      .catch(() => []),
    db.rfyLiveVideo.count({ where: { isActive: true } }).catch(() => 0),
  ])

  return (
    <PublicPageShell mainClassName="pb-0">
      <div
        style={{
          padding: 'clamp(5rem, 12vw, 8rem) clamp(1.5rem, 5vw, 5rem) 3rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            margin: '0 0 0.75rem',
          }}
        >
          Past Editions
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Room For You{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>Live</em>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-text-secondary)',
            marginTop: '1rem',
            maxWidth: '520px',
          }}
        >
          Every edition. Every moment of worship, prayer, and the Word.
        </p>
      </div>

      <LiveClient initialVideos={initialVideos} initialTotal={total} />
    </PublicPageShell>
  )
}
