import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export async function GET() {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    select: {
      city: true,
      takenAt: true,
      createdAt: true,
      galleryEvent: { select: { city: true, date: true } },
    },
  })

  const cities = new Set<string>()
  const months = new Set<string>()

  for (const img of images) {
    const city = img.galleryEvent?.city ?? img.city
    if (city) cities.add(city)

    const date = img.takenAt ?? img.galleryEvent?.date ?? img.createdAt
    if (date) months.add(monthKey(new Date(date)))
  }

  return NextResponse.json({
    cities: Array.from(cities).sort(),
    months: Array.from(months).sort().reverse(),
  })
}
