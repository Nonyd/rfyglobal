import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 1000

const safeInt = (raw: string | null, fallback: number, min: number, max: number) => {
  const n = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const month = searchParams.get('month') // format: "YYYY-MM"
  const includeHidden = searchParams.get('includeHidden') === 'true'
  const eventId = searchParams.get('eventId')
  const page = safeInt(searchParams.get('page'), 1, 1, 100_000)
  const limit = safeInt(searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT)
  const skip = (page - 1) * limit

  const where: Prisma.GalleryImageWhereInput = {}

  if (!session || !includeHidden) {
    where.isActive = true
  }

  if (eventId) {
    where.galleryEventId = eventId
  }

  if (city && city !== 'all') {
    where.OR = [
      { city: { equals: city, mode: 'insensitive' } },
      { galleryEvent: { is: { city: { equals: city, mode: 'insensitive' } } } },
    ]
  }

  if (month) {
    const [year, m] = month.split('-').map(Number)
    if (!Number.isNaN(year) && !Number.isNaN(m)) {
      const start = new Date(year, m - 1, 1)
      const end = new Date(year, m, 1)
      const monthFilter: Prisma.GalleryImageWhereInput[] = [
        { takenAt: { gte: start, lt: end } },
        {
          AND: [
            { takenAt: null },
            { galleryEvent: { is: { date: { gte: start, lt: end } } } },
          ],
        },
        {
          AND: [
            { takenAt: null },
            { galleryEventId: null },
            { createdAt: { gte: start, lt: end } },
          ],
        },
      ]
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: monthFilter }]
        delete where.OR
      } else {
        where.OR = monthFilter
      }
    }
  }

  const [images, total] = await Promise.all([
    db.galleryImage.findMany({
      where,
      orderBy: [{ takenAt: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        galleryEvent: { select: { id: true, name: true, city: true, date: true } },
      },
    }),
    db.galleryImage.count({ where }),
  ])

  return NextResponse.json({
    images,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total,
  })
}

type SingleImagePayload = {
  url: string
  thumbnailUrl?: string | null
  caption?: string | null
  eventName?: string | null
  city?: string | null
  takenAt?: string | null
  galleryEventId?: string | null
  order?: number
}

type BulkImagesPayload = {
  images: SingleImagePayload[]
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as Partial<SingleImagePayload> & Partial<BulkImagesPayload>

  // Bulk insert path
  if (Array.isArray(body.images)) {
    const images = body.images
    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }
    const created = await db.galleryImage.createMany({
      data: images.map((img, i) => ({
        url: img.url,
        thumbnailUrl: img.thumbnailUrl ?? null,
        caption: img.caption ?? null,
        eventName: img.eventName ?? null,
        city: img.city ?? null,
        takenAt: img.takenAt ? new Date(img.takenAt) : null,
        galleryEventId: img.galleryEventId ?? null,
        order: typeof img.order === 'number' ? img.order : i,
      })),
    })
    return NextResponse.json({ created: created.count }, { status: 201 })
  }

  // Single insert path
  if (!body.url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const image = await db.galleryImage.create({
    data: {
      url: body.url,
      thumbnailUrl: body.thumbnailUrl ?? null,
      caption: body.caption ?? null,
      eventName: body.eventName ?? null,
      city: body.city ?? null,
      takenAt: body.takenAt ? new Date(body.takenAt) : null,
      galleryEventId: body.galleryEventId ?? null,
      order: typeof body.order === 'number' ? body.order : 0,
    },
  })

  return NextResponse.json(image, { status: 201 })
}
