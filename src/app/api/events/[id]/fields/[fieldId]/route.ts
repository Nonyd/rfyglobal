import type { FieldType, Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const FIELD_TYPES: FieldType[] = [
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
]

function isFieldType(v: unknown): v is FieldType {
  return typeof v === 'string' && (FIELD_TYPES as string[]).includes(v)
}

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
  if (typeof body.required === 'boolean') {
    if (existing.type === 'EMAIL' && body.required === false) {
      return NextResponse.json(
        {
          error:
            'The email field must remain required — it is required for duplicate registration checking.',
        },
        { status: 400 }
      )
    }
    data.required = body.required
  }
  if (typeof body.isActive === 'boolean') {
    if (existing.type === 'EMAIL' && body.isActive === false) {
      return NextResponse.json(
        {
          error:
            'The email field cannot be disabled — it is required for duplicate registration checking.',
        },
        { status: 400 }
      )
    }
    data.isActive = body.isActive
  }
  if (body.options !== undefined) data.options = body.options as Prisma.InputJsonValue
  if (typeof body.order === 'number' && Number.isFinite(body.order)) data.order = body.order

  if (body.type !== undefined) {
    if (!isFieldType(body.type)) {
      return NextResponse.json({ error: 'Invalid field type' }, { status: 400 })
    }
    if (existing.type === 'EMAIL' && body.type !== 'EMAIL') {
      return NextResponse.json(
        {
          error:
            'The email field cannot change type — it is required for duplicate registration checking.',
        },
        { status: 400 }
      )
    }
    data.type = body.type
  }

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

  if (existing.type === 'EMAIL') {
    return NextResponse.json(
      {
        error:
          'The email field cannot be deleted — it is required for duplicate registration checking.',
      },
      { status: 400 }
    )
  }

  await db.eventFormField.delete({ where: { id: params.fieldId } })
  return NextResponse.json({ success: true })
}
