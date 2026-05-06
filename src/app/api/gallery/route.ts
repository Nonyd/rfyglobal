import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const month = searchParams.get('month')

  const where: Record<string, unknown> = {}
  if (!session) {
    where.isActive = true
  }
  if (city) where.city = { contains: city, mode: 'insensitive' as const }
  if (month) {
    const [year, m] = month.split('-').map(Number)
    if (!Number.isNaN(year) && !Number.isNaN(m)) {
      where.takenAt = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      }
    }
  }

  const images = await db.galleryImage.findMany({
    where,
    orderBy: [{ takenAt: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(images)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    images?: { url: string; caption?: string; eventName?: string; city?: string; takenAt?: string }[]
  }
  const images = body.images

  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 })
  }

  const created = await db.galleryImage.createMany({
    data: images.map((img, i) => ({
      url: img.url,
      caption: img.caption ?? null,
      eventName: img.eventName ?? null,
      city: img.city ?? null,
      takenAt: img.takenAt ? new Date(img.takenAt) : null,
      order: i,
    })),
  })

  return NextResponse.json({ created: created.count }, { status: 201 })
}
