import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { PublicGalleryClient } from '@/components/gallery/PublicGalleryClient'

export const metadata: Metadata = {
  title: 'Gallery — Room For You',
  description: 'Photos from past Room For You community gatherings across cities.',
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default async function GalleryPage() {
  const where = { isActive: true } as const

  const [images, total, filterRows] = await Promise.all([
    db.galleryImage.findMany({
      where,
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      take: PAGE_SIZE,
      include: {
        galleryEvent: { select: { name: true, city: true, date: true } },
      },
    }),
    db.galleryImage.count({ where }),
    db.galleryImage.findMany({
      where,
      select: {
        city: true,
        takenAt: true,
        createdAt: true,
        galleryEvent: { select: { city: true, date: true } },
      },
    }),
  ])

  const cities = Array.from(
    new Set(
      filterRows
        .map((r) => r.galleryEvent?.city ?? r.city)
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort()

  const months = Array.from(
    new Set(
      filterRows
        .map((r) => r.takenAt ?? r.galleryEvent?.date ?? r.createdAt)
        .filter((d): d is Date => Boolean(d))
        .map((d) => monthKey(new Date(d))),
    ),
  )
    .sort()
    .reverse()

  return (
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader
        eyebrow="Room For You"
        title="Moments."
        subtitle="A record of what God has done in our gatherings. Real people. Real community."
      />
      <PublicGalleryClient
        initialImages={images}
        initialTotal={total}
        cities={cities}
        months={months}
        pageSize={PAGE_SIZE}
      />
    </PublicPageShell>
  )
}
