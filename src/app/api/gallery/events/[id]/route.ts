import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  const event = await db.galleryEvent.findUnique({
    where: { id: params.id },
    include: { _count: { select: { images: true } } },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const images = await db.galleryImage.findMany({
    where: {
      galleryEventId: params.id,
      ...(session ? {} : { isActive: true }),
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: {
      galleryEvent: { select: { name: true, city: true, date: true } },
    },
  })

  return NextResponse.json(images)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    name?: string
    city?: string
    date?: string
    isActive?: boolean
  }

  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string') data.name = body.name.trim()
  if (typeof body.city === 'string') data.city = body.city.trim()
  if (typeof body.date === 'string') data.date = new Date(body.date)
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive

  const event = await db.galleryEvent.update({
    where: { id: params.id },
    data,
  })

  await logActivity({
    userId: session.user.id,
    action: `Updated gallery event: ${event.name}`,
    module: 'Gallery',
    targetId: event.id,
    targetTitle: event.name,
  })

  return NextResponse.json(event)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.galleryEvent.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Cascade-delete all images in the event first.
  await db.galleryImage.deleteMany({ where: { galleryEventId: params.id } })
  await db.galleryEvent.delete({ where: { id: params.id } })

  await logActivity({
    userId: session.user.id,
    action: `Deleted gallery event: ${existing.name}`,
    module: 'Gallery',
    targetId: existing.id,
    targetTitle: existing.name,
  })

  return NextResponse.json({ success: true })
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const methodOverride = req.headers.get('X-HTTP-Method-Override')
  if (methodOverride === 'DELETE') return DELETE(req, ctx)
  if (methodOverride === 'PATCH') return PATCH(req, ctx)
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
