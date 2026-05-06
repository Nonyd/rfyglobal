import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { GalleryClientPage } from '@/components/gallery/GalleryClientPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gallery — Room For You',
  description: 'Photos from past Room For You community gatherings across cities.',
}

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
  })

  const cities = Array.from(new Set(images.map((i) => i.city).filter(Boolean) as string[])).sort()
  const months = Array.from(
    new Set(
      images
        .filter((i) => i.takenAt)
        .map((i) => {
          const d = new Date(i.takenAt!)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        }),
    ),
  )
    .sort()
    .reverse()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pb-16 pt-24">
        <div className="mx-auto mb-16 max-w-7xl px-6 text-center">
          <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Room For You</p>
          <h1 className="mb-4 font-display text-4xl text-white lg:text-6xl">Gallery</h1>
          <p className="mx-auto max-w-md font-body text-white/50">
            Moments from our gatherings across cities. Real people. Real community.
          </p>
          <div className="mx-auto mt-8 h-px max-w-xs bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>
        <GalleryClientPage images={images} cities={cities} months={months} />
      </main>
      <Footer />
    </>
  )
}
