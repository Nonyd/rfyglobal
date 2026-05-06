import type { FieldType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ensureDefaultEventFields } from '@/lib/event-form-fields'
import { z } from 'zod'

export const runtime = 'nodejs'

const FieldTypeSchema = z.enum([
  'SHORT_TEXT',
  'LONG_TEXT',
  'EMAIL',
  'PHONE',
  'NUMBER',
  'DROPDOWN',
  'RADIO',
  'CHECKBOXES',
  'DATE',
  'FILE_UPLOAD',
  'LOCATION',
])

const PostBodySchema = z.object({
  label: z.string().min(1).max(200),
  type: FieldTypeSchema.optional(),
  placeholder: z.string().max(500).nullable().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await ensureDefaultEventFields(event.id)

  const fields = await db.eventFormField.findMany({
    where: { eventId: event.id },
    orderBy: { order: 'asc' },
  })

  // Public requests get only active fields
  // Authenticated admin requests get all fields
  if (!session) {
    return NextResponse.json(fields.filter((f) => f.isActive))
  }

  return NextResponse.json(fields)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await ensureDefaultEventFields(event.id)

  const raw = await req.json()
  const parsed = PostBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { label, placeholder, required, options } = parsed.data
  const type = (parsed.data.type ?? 'SHORT_TEXT') as FieldType

  const maxOrderAgg = await db.eventFormField.aggregate({
    where: { eventId: event.id },
    _max: { order: true },
  })
  const nextOrder = (maxOrderAgg._max.order ?? -1) + 1

  const field = await db.eventFormField.create({
    data: {
      eventId: event.id,
      label: label.trim(),
      type,
      placeholder: placeholder ?? null,
      required: required ?? false,
      isCore: false,
      ...(options && options.length > 0 ? { options } : {}),
      order: nextOrder,
    },
  })

  return NextResponse.json(field, { status: 201 })
}
