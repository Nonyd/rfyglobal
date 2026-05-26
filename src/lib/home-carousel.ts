import 'server-only'

import { db } from '@/lib/db'
import type { HomeCarouselSlideRecord } from '@/lib/home-carousel-types'

export type { HomeCarouselSlideRecord }

export async function getActiveHomeCarouselSlides(): Promise<HomeCarouselSlideRecord[]> {
  return db.homeCarouselSlide.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, url: true, heading: true },
  })
}
