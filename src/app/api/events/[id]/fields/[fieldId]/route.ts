import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

async function resolveEvent(param: string) {
  return db.event.findFirst({
    where: { OR: [{ slug: param }, { id: param }] },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await resolveEvent(params.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await db.eventFormField.findFirst({
    where: { id: params.fieldId, eventId: event.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await req.json()) as Record<string, unknown>
  const data: Prisma.EventFormFieldUpdateInput = {}

  if (typeof body.label === 'string') data.label = body.label.trim()
  if (typeof body.placeholder === 'string' || body.placeholder === null) {
    data.placeholder = body.placeholder === null ? null : body.placeholder
  }
  if (typeof body.required === 'boolean') data.required = body.required
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (body.options !== undefined) data.options = body.options as Prisma.InputJsonValue
  if (typeof body.order === 'number') data.order = body.order

  const field = await db.eventFormField.update({
    where: { id: params.fieldId },
    data,
  })

  return NextResponse.json(field)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await resolveEvent(params.id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await db.eventFormField.findFirst({
    where: { id: params.fieldId, eventId: event.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.eventFormField.delete({ where: { id: params.fieldId } })
  return NextResponse.json({ success: true })
}
