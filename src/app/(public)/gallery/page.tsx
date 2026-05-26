import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { GalleryClient } from '@/components/gallery/GalleryClient'
import type { GalleryEvent } from '@/components/gallery/GalleryClient'
import { getContentMany } from '@/lib/content'
import { getPageMetadata, pageHeaderFromContent } from '@/lib/cms-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Gallery | Room For You',
    'Photos from our gatherings, events and community moments.',
    '/gallery',
  )
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

const activeImageWhere = { isActive: true } as const

async function fetchGalleryEvents(): Promise<GalleryEvent[]> {
  const rows = await db.galleryEvent.findMany({
    where: {
      isActive: true,
      images: { some: { isActive: true } },
    },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      name: true,
      images: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    _count: { images: row.images.length },
  }))
}

export default async function GalleryPage() {
  const [initialData, total, events, cms] = await Promise.all([
    db.galleryImage
      .findMany({
        where: activeImageWhere,
        orderBy: [{ takenAt: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
        take: PAGE_SIZE,
        select: {
          id: true,
          url: true,
          caption: true,
          galleryEventId: true,
        },
      })
      .catch(() => []),
    db.galleryImage.count({ where: activeImageWhere }).catch(() => 0),
    fetchGalleryEvents().catch(() => [] as GalleryEvent[]),
    getContentMany(['pages.gallery.eyebrow', 'pages.gallery.title', 'pages.gallery.subtitle']),
  ])

  const header = pageHeaderFromContent(cms, 'gallery')

  return (
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader {...header} />
      <GalleryClient
        initialImages={initialData}
        initialTotal={total}
        allTotal={total}
        events={events}
        pageSize={PAGE_SIZE}
      />
    </PublicPageShell>
  )
}
