import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UpdateScriptureSchema } from '@/lib/validations/scripture'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateScriptureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { scheduledAt, audioUrl, ...rest } = parsed.data

  const scripture = await db.scripture.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(audioUrl !== undefined && { audioUrl: audioUrl || null }),
      ...(scheduledAt !== undefined && {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }),
    },
  })

  return NextResponse.json(scripture)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.scripture.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
