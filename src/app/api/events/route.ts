import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { slugFromTitleCity } from '@/lib/event-slug'
import { CreateEventSchema } from '@/lib/validations/event'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')

  const where: Prisma.EventWhereInput = {}
  if (!session) {
    where.isActive = true
    where.date = { gte: new Date() }
  }
  if (city) {
    where.city = { contains: city, mode: 'insensitive' }
  }

  const events = await db.event.findMany({
    where,
    orderBy: { date: 'asc' },
    ...(session
      ? { include: { _count: { select: { registrations: true } } } }
      : {}),
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { imageUrl, date, redirectUrl, ...rest } = parsed.data
  const slug = await slugFromTitleCity(rest.title, rest.city)

  const event = await db.event.create({
    data: {
      ...rest,
      slug,
      date: new Date(date),
      imageUrl: imageUrl && imageUrl.length > 0 ? imageUrl : null,
      redirectUrl: redirectUrl || null,
    },
  })

  await logActivity({
    userId: session.user.id,
    action: `Created event: ${event.title}`,
    module: 'Events',
    targetId: event.id,
    targetTitle: event.title,
  })

  return NextResponse.json(event, { status: 201 })
}
