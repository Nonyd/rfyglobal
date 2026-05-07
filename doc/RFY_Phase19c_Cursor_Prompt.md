# ROOM FOR YOU — Phase 19c Cursor Prompt
## Gallery Pagination — Load More After 20 Images

---

## CONTEXT

The public gallery currently loads all images at once. With 95+ images this makes the initial page slow. Add pagination: show 20 images initially, then a "Load More" button that appends the next 20, and so on.

---

## TASK 1 — Update Gallery API to Support Pagination

Open `src/app/api/gallery/route.ts`.

Add `page` and `limit` query params:

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const month = searchParams.get('month')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const skip = (page - 1) * limit

  const where: Prisma.GalleryImageWhereInput = { isActive: true }

  if (city && city !== 'all') {
    where.OR = [
      { city },
      { galleryEvent: { city } },
    ]
  }

  if (month) {
    const [year, mon] = month.split('-').map(Number)
    const start = new Date(year, mon - 1, 1)
    const end = new Date(year, mon, 0, 23, 59, 59)
    where.createdAt = { gte: start, lte: end }
  }

  const [images, total] = await Promise.all([
    db.galleryImage.findMany({
      where,
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        galleryEvent: { select: { name: true, city: true, date: true } },
      },
    }),
    db.galleryImage.count({ where }),
  ])

  return NextResponse.json({
    images,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  })
}
```

---

## TASK 2 — Update Public Gallery Page

Open `src/app/(public)/gallery/page.tsx`.

Only fetch the first 20 images server-side and pass pagination metadata:

```typescript
export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  // Fetch first page only
  const res = await db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
    take: 20,
    include: {
      galleryEvent: { select: { name: true, city: true, date: true } },
    },
  })

  const total = await db.galleryImage.count({ where: { isActive: true } })

  return (
    <>
      <Navbar />
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
          <p className="label-text mb-3">Gallery</p>
          <h1 className="font-display text-snow font-bold mb-2"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            Moments.
          </h1>
          <p className="font-body text-mist">
            A record of what God has done in our gatherings.
          </p>
        </div>
        <PublicGalleryClient
          initialImages={res}
          initialTotal={total}
        />
      </main>
      <Footer />
    </>
  )
}
```

---

## TASK 3 — Update PublicGalleryClient with Load More

Open `src/components/gallery/PublicGalleryClient.tsx`.

Update props and add load more functionality:

```typescript
interface PublicGalleryClientProps {
  initialImages: GalleryImageData[]
  initialTotal: number
}

export function PublicGalleryClient({ initialImages, initialTotal }: PublicGalleryClientProps) {
  const [images, setImages] = useState(initialImages)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const LIMIT = 20

  // ... existing filter state ...

  const hasMore = images.length < total

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(LIMIT),
        ...(cityFilter !== 'all' && { city: cityFilter }),
        ...(monthFilter !== 'all' && { month: monthFilter }),
      })

      const res = await fetch(`/api/gallery?${params}`)
      const data = await res.json()

      setImages(prev => [...prev, ...data.images])
      setTotal(data.total)
      setPage(p => p + 1)
    } catch {
      toast.error('Failed to load more photos')
    } finally {
      setLoadingMore(false)
    }
  }

  // Reset to page 1 when filters change
  const handleCityFilter = async (city: string) => {
    setCityFilter(city)
    setPage(1)
    // Fetch fresh first page with new filter
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: String(LIMIT),
        ...(city !== 'all' && { city }),
        ...(monthFilter !== 'all' && { month: monthFilter }),
      })
      const res = await fetch(`/api/gallery?${params}`)
      const data = await res.json()
      setImages(data.images)
      setTotal(data.total)
    } catch {
      toast.error('Failed to filter gallery')
    }
  }

  const handleMonthFilter = async (month: string) => {
    setMonthFilter(month)
    setPage(1)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: String(LIMIT),
        ...(cityFilter !== 'all' && { city: cityFilter }),
        ...(month !== 'all' && { month }),
      })
      const res = await fetch(`/api/gallery?${params}`)
      const data = await res.json()
      setImages(data.images)
      setTotal(data.total)
    } catch {
      toast.error('Failed to filter gallery')
    }
  }

  // ... existing lightbox, select mode state ...

  // NOTE: filtered is now just `images` since filtering happens server-side via API
  // Keep client-side city/month filter extraction for the filter pills UI
  // but actual filtering is done via API calls

  return (
    <div className="min-h-screen bg-void">

      {/* ── HEADER with count ── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="label-text">
            {images.length} of {total} photos
          </p>
          {/* ... select mode controls ... */}
        </div>

        {/* ── FILTERS ── */}
        {/* Update filter click handlers to use handleCityFilter / handleMonthFilter */}
        {/* Replace setCityFilter calls with handleCityFilter calls */}
        {/* Replace setMonthFilter calls with handleMonthFilter calls */}
      </div>

      {/* ── MASONRY GRID ── */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3">
          {images.map((image, index) => (
            // ... existing image card render unchanged ...
            null
          ))}
        </div>

        {/* ── LOAD MORE BUTTON ── */}
        {hasMore && (
          <div className="flex flex-col items-center gap-3 mt-16 pb-8">
            {/* Progress indicator */}
            <p className="label-text opacity-40">
              {images.length} of {total} photos
            </p>

            {/* Progress bar */}
            <div className="w-48 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(images.length / total) * 100}%`,
                  background: '#C9A84C',
                }}
              />
            </div>

            {/* Load more button */}
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 flex items-center gap-3 px-10 py-4 font-body text-xs font-semibold tracking-[0.25em] uppercase border transition-all duration-300 disabled:opacity-50"
              style={{
                borderColor: 'rgba(201,168,76,0.4)',
                color: '#C9A84C',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                if (!loadingMore) {
                  e.currentTarget.style.background = '#C9A84C'
                  e.currentTarget.style.color = '#0F0F0F'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#C9A84C'
              }}
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'rgba(201,168,76,0.4)', borderTopColor: '#C9A84C' }} />
                  Loading…
                </>
              ) : (
                <>
                  Load More Photos
                  <span className="opacity-50">+{Math.min(LIMIT, total - images.length)}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* All loaded indicator */}
        {!hasMore && images.length > 0 && images.length >= total && (
          <div className="flex flex-col items-center gap-3 mt-16 pb-8">
            <div className="gold-line w-24 opacity-30" />
            <p className="label-text opacity-30">All {total} photos loaded</p>
          </div>
        )}
      </div>

      {/* ... lightbox unchanged ... */}
    </div>
  )
}
```

---

## COMPLETION CHECKLIST

- [ ] Gallery page loads only 20 images initially — fast page load
- [ ] "X of Y photos" counter shown in header
- [ ] Progress bar shows how many photos are loaded vs total
- [ ] "Load More Photos +20" button appears below the grid
- [ ] Clicking Load More appends next 20 images to the grid
- [ ] Button shows spinner while loading
- [ ] Correct count shown on button: "Load More Photos +20" (or less if near end)
- [ ] When all photos are loaded: "All X photos loaded" message + gold line
- [ ] City and month filters reset to page 1 and re-fetch
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Filtering now happens server-side via API (not client-side). When a filter changes, call the API with `page=1` to get the first page of filtered results, replacing the images array entirely.
- Extract city and month values for the filter pills from `initialImages` only — or fetch them as separate metadata. Don't rely on the full images array for filter options since we now show only a subset.
- The `images` state in the component is the "loaded so far" subset — not all images. `total` is the complete count from the API.
- Keep the lightbox working correctly — `lightboxIndex` should be relative to the current `images` array (loaded so far), not the full total. Users can load more and then open images from the newly loaded batch.
- The select mode multi-download should also work with the current loaded images only. Add a note: "Select from currently loaded photos."
