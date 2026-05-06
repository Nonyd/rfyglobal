import { db } from '@/lib/db'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
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
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader
        eyebrow="Room For You"
        title="Gallery"
        subtitle="Moments from our gatherings across cities. Real people. Real community."
      />
      <GalleryClientPage images={images} cities={cities} months={months} />
    </PublicPageShell>
  )
}
