import { NextRequest, NextResponse } from 'next/server'
import { FieldType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function GET() {
  const fields = await db.joinFormField.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(fields)
}

const CreateFieldSchema = z.object({
  label: z.string().min(1),
  type: z.nativeEnum(FieldType),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().optional(),
  options: z.unknown().optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateFieldSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const field = await db.joinFormField.create({
    data: {
      label: parsed.data.label,
      type: parsed.data.type,
      placeholder: parsed.data.placeholder ?? undefined,
      required: parsed.data.required ?? false,
      options: parsed.data.options ?? undefined,
      order: parsed.data.order ?? 0,
      isActive: parsed.data.isActive ?? true,
    },
  })

  await logActivity({
    userId: session.user.id,
    action: `Added field to join form: ${parsed.data.label}`,
    module: 'Members',
    targetId: field.id,
    targetTitle: parsed.data.label,
  })

  return NextResponse.json(field, { status: 201 })
}
