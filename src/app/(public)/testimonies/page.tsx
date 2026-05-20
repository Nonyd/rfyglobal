import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { TestimonyGrid } from '@/components/testimony/TestimonyGrid'
import { TestimonySubmitButton } from '@/components/testimony/TestimonySubmitButton'
import { db } from '@/lib/db'
import { getContentMany } from '@/lib/content'
import { getPageMetadata } from '@/lib/cms-metadata'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Testimonies — What God Has Done in Room For You',
    "Real testimonies from the Room For You community. Stories of healing, salvation, breakthrough, and God's faithfulness. To God be the glory.",
    '/testimonies',
  )
}

export const dynamic = 'force-dynamic'

export default async function TestimoniesPage() {
  const [testimonies, content] = await Promise.all([
    db.testimony.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      select: {
        id: true,
        name: true,
        isAnonymous: true,
        title: true,
        body: true,
        imageUrls: true,
        videoUrl: true,
        isFeatured: true,
        publishedAt: true,
      },
    }),
    getContentMany(['pages.testimonies.eyebrow', 'pages.testimonies.title', 'pages.testimonies.subtitle']),
  ])

  const titleLines = (content['pages.testimonies.title'] || 'What God\nhas done.').split('\n')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-8">
          <p className="label-text mb-4">{content['pages.testimonies.eyebrow'] || 'Testimonies'}</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div>
              <h1
                className="font-display text-snow font-bold mb-3"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
              >
                {titleLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="font-body text-mist max-w-lg">
                {content['pages.testimonies.subtitle'] ||
                  'Real stories from the Room For You community. God is moving — here is the evidence.'}
              </p>
            </div>
            <TestimonySubmitButton />
          </div>
        </div>

        <TestimonyGrid testimonies={testimonies} />
      </main>
      <Footer />
    </>
  )
}
