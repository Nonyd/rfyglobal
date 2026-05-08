import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PrayerWallClient } from '@/components/prayer/PrayerWallClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prayer Wall — Room For You',
  description: 'Submit your prayer request to the Room For You prayer team.',
}

export default function PrayerWallPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="label-text mb-4">Prayer Wall</p>
          <h1
            className="font-display text-snow font-bold mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            We will pray
            <br />
            with you.
          </h1>

          <div className="gold-line-left w-12 mb-6 opacity-50" />

          <p className="font-body text-mist leading-relaxed mb-4">
            Share your prayer request with the Room For You prayer team. Minister Yadah and the team will personally
            pray over every request.
          </p>

          <div
            className="flex items-start gap-3 p-4 mb-10 border"
            style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}
          >
            <span className="text-gold text-lg shrink-0">🔒</span>
            <p className="font-body text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>
              Your prayer request is <strong style={{ color: '#C9A84C' }}>completely private</strong> — it is seen only
              by Minister Yadah and the Room For You prayer team. It will never be publicly displayed.
            </p>
          </div>

          <PrayerWallClient />
        </div>
      </main>
      <Footer />
    </>
  )
}
