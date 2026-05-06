import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    select: { city: true, takenAt: true },
  })

  const cities = Array.from(new Set(images.map((i) => i.city).filter(Boolean) as string[])).sort()

  const months = Array.from(
    new Set(
      images
        .filter((i) => i.takenAt)
        .map((i) => {
          const d = new Date(i.takenAt!)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        }),
    ),
  )
    .sort()
    .reverse()

  return NextResponse.json({ cities, months })
}
