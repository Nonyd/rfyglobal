import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { TestimonyGrid } from '@/components/testimony/TestimonyGrid'
import { TestimonySubmitButton } from '@/components/testimony/TestimonySubmitButton'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testimonies — Room For You',
  description: 'Stories of what God has done in the Room For You community.',
}

export const dynamic = 'force-dynamic'

export default async function TestimoniesPage() {
  const testimonies = await db.testimony.findMany({
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
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-8">
          <p className="label-text mb-4">Testimonies</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div>
              <h1
                className="font-display text-snow font-bold mb-3"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
              >
                What God
                <br />
                has done.
              </h1>
              <p className="font-body text-mist max-w-lg">
                Real stories from the Room For You community. God is moving — here is the evidence.
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
