import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { PublicGalleryClient } from '@/components/gallery/PublicGalleryClient'

export const metadata: Metadata = {
  title: 'Gallery — Room For You',
  description: 'Photos from past Room For You community gatherings across cities.',
}

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      galleryEvent: { select: { name: true, city: true, date: true } },
    },
  })

  return (
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader
        eyebrow="Room For You"
        title="Moments."
        subtitle="A record of what God has done in our gatherings. Real people. Real community."
      />
      <PublicGalleryClient images={images} />
    </PublicPageShell>
  )
}
