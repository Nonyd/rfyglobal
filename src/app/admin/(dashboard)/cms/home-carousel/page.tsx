import { HomeCarouselManager } from '@/components/admin/home-carousel/HomeCarouselManager'

export const dynamic = 'force-dynamic'

export default function AdminHomeCarouselPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Homepage Carousel
        </h2>
        <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          Images and headings for the landing page carousel — not linked to the main gallery
        </p>
      </div>
      <HomeCarouselManager />
    </div>
  )
}
