import { db } from '@/lib/db'
import { GalleryManager } from '@/components/admin/gallery/GalleryManager'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  const images = await db.galleryImage.findMany({
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
  })

  return <GalleryManager initialImages={images} />
}
