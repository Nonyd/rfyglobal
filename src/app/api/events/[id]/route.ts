import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { eventLookupWhere, slugFromTitleCity } from '@/lib/event-slug'

export const runtime = 'nodejs'

/** Public or embedded fetch: resolve by slug or by id (cuid). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const event = await db.event.findFirst({
    where: eventLookupWhere(params.id),
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const raw = await req.json()
  const body: Record<string, unknown> = { ...raw }
  if (typeof body.date === 'string') body.date = new Date(body.date)
  if (body.imageUrl === '') body.imageUrl = null

  if (body.title || body.city) {
    const current = await db.event.findUnique({ where: { id: params.id } })
    if (current) {
      const title = (body.title as string) ?? current.title
      const city = (body.city as string) ?? current.city
      body.slug = await slugFromTitleCity(title, city, params.id)
    }
  }

  const event = await db.event.update({
    where: { id: params.id },
    data: body as Prisma.EventUpdateInput,
  })

  await logActivity({
    userId: session.user.id,
    action: `Updated event: ${event.title}`,
    module: 'Events',
    targetId: event.id,
    targetTitle: event.title,
  })

  return NextResponse.json(event)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.event.findUnique({ where: { id: params.id } })
  await db.event.delete({ where: { id: params.id } })

  if (existing) {
    await logActivity({
      userId: session.user.id,
      action: `Deleted event: ${existing.title}`,
      module: 'Events',
      targetId: params.id,
      targetTitle: existing.title,
    })
  }

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const methodOverride = req.headers.get('X-HTTP-Method-Override')
  if (methodOverride === 'DELETE') return DELETE(req, ctx)
  if (methodOverride === 'PATCH') return PATCH(req, ctx)
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
