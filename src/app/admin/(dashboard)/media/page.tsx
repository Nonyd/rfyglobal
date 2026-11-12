import { MediaManager } from '@/components/admin/media/MediaManager'

export default function MediaAdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Media
        </h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Upload audio (sermons, worship, teachings) and share a link anyone can open to listen.
        </p>
      </div>
      <MediaManager />
    </div>
  )
}
