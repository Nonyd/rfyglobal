import type { FieldType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
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

  const fields = await db.eventFormField.findMany({
    where: {
      eventId: event.id,
      ...(session ? {} : { isActive: true }),
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(fields)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const raw = await req.json()
  const parsed = PostBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { label, placeholder, required, options } = parsed.data
  const type = (parsed.data.type ?? 'SHORT_TEXT') as FieldType

  const maxOrder = await db.eventFormField.count({ where: { eventId: event.id } })

  const field = await db.eventFormField.create({
    data: {
      eventId: event.id,
      label: label.trim(),
      type,
      placeholder: placeholder ?? null,
      required: required ?? false,
      ...(options && options.length > 0 ? { options } : {}),
      order: maxOrder,
    },
  })

  return NextResponse.json(field, { status: 201 })
}
