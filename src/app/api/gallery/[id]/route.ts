import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

type PatchBody = {
  caption?: string | null
  eventName?: string | null
  city?: string | null
  takenAt?: string | null
  order?: number
  isActive?: boolean
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as PatchBody
  const data: Record<string, unknown> = {}
  if ('caption' in body) data.caption = body.caption
  if ('eventName' in body) data.eventName = body.eventName
  if ('city' in body) data.city = body.city
  if ('order' in body) data.order = body.order
  if ('isActive' in body) data.isActive = body.isActive
  if ('takenAt' in body) {
    data.takenAt = body.takenAt ? new Date(body.takenAt) : null
  }

  const image = await db.galleryImage.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json(image)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.galleryImage.findUnique({ where: { id: params.id } })
  await db.galleryImage.delete({ where: { id: params.id } })

  if (existing) {
    await logActivity({
      userId: session.user.id,
      action: `Deleted gallery image${existing.caption ? `: ${existing.caption}` : ''}`,
      module: 'Gallery',
      targetId: params.id,
      targetTitle: existing.caption ?? existing.eventName ?? params.id,
    })
  }

  return NextResponse.json({ success: true })
}
