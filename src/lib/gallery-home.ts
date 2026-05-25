import 'server-only'

import { db } from '@/lib/db'
import { MAX_HOME_GALLERY_SLIDES } from '@/lib/gallery-constants'
import type { HomeGallerySlide } from '@/lib/gallery-types'

export { MAX_HOME_GALLERY_SLIDES }
export type { HomeGallerySlide }

export async function getHomeGallerySlides(): Promise<HomeGallerySlide[]> {
  return db.galleryImage.findMany({
    where: { showOnHome: true, isActive: true },
    orderBy: [{ homeOrder: 'asc' }, { createdAt: 'desc' }],
    take: MAX_HOME_GALLERY_SLIDES,
    select: {
      id: true,
      url: true,
      caption: true,
      city: true,
      eventName: true,
      galleryEvent: { select: { name: true, city: true } },
    },
  })
}

export async function countHomeGallerySlides(): Promise<number> {
  return db.galleryImage.count({ where: { showOnHome: true } })
}
