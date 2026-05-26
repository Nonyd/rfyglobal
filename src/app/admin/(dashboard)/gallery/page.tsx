import { GalleryManager } from '@/components/admin/gallery/GalleryManager'

export const dynamic = 'force-dynamic'

export default function AdminGalleryPage() {
  return (
    <div>
      <div className="mb-8">
        <h2
          className="font-display text-2xl font-semibold"
          style={{ color: 'var(--a-text)' }}
        >
          Gallery
        </h2>
        <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          Group photos by event, upload in batches, and manage every image
        </p>
      </div>
      <GalleryManager />
    </div>
  )
}
