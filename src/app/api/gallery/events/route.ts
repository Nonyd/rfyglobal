import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await db.galleryEvent.findMany({
    where: { isActive: true },
    orderBy: { date: 'desc' },
    include: {
      _count: { select: { images: true } },
      images: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        take: 1,
        select: { url: true },
      },
    },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { name?: string; city?: string; date?: string }
  const name = body.name?.trim()
  const city = body.city?.trim()
  const date = body.date

  if (!name || !city || !date) {
    return NextResponse.json({ error: 'Name, city and date are required' }, { status: 400 })
  }

  const event = await db.galleryEvent.create({
    data: { name, city, date: new Date(date) },
  })

  await logActivity({
    userId: session.user.id,
    action: `Created gallery event: ${name}`,
    module: 'Gallery',
    targetId: event.id,
    targetTitle: name,
  })

  return NextResponse.json(event, { status: 201 })
}
