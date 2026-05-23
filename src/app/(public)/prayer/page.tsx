import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PrayerWallClient } from '@/components/prayer/PrayerWallClient'
import { getContentMany } from '@/lib/content'
import { PRAYER_CMS_KEYS } from '@/lib/cms-keys'
import { getPageMetadata } from '@/lib/cms-metadata'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Prayer Wall — Room For You',
    'Submit your prayer request to Minister Yadah and the Room For You prayer team. Every request is prayed over personally. Private and confidential.',
    '/prayer',
  )
}

export const dynamic = 'force-dynamic'

export default async function PrayerWallPage() {
  const content = await getContentMany([...PRAYER_CMS_KEYS])
  const titleLines = (content['prayer.title'] || 'We will pray\nwith you.').split('\n')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="label-text mb-4">{content['prayer.eyebrow'] || 'Prayer Wall'}</p>
          <h1
            className="font-display text-snow font-bold mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            {titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <div className="gold-line-left w-12 mb-6 opacity-50" />

          <p className="font-body text-mist leading-relaxed mb-4">
            {content['prayer.subtitle'] ||
              'Share your prayer request with the Room For You prayer team. Minister Yadah and the team will personally pray over every request.'}
          </p>

          <div
            className="flex items-start gap-3 p-4 mb-10 border"
            style={{ borderColor: 'rgba(139,0,0,0.3)', background: 'rgba(139,0,0,0.05)' }}
          >
            <span className="text-crimson text-lg shrink-0">🔒</span>
            <p className="font-body text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>
              {content['prayer.privacy'] ||
                'Your prayer request is completely private — it is seen only by Minister Yadah and the Room For You prayer team. It will never be publicly displayed.'}
            </p>
          </div>

          <PrayerWallClient />
        </div>
      </main>
      <Footer />
    </>
  )
}
