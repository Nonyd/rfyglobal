import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
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

  await logActivity({
    userId: session.user.id,
    action: `Updated scripture: ${scripture.reference}`,
    module: 'Scripture',
    targetId: params.id,
    targetTitle: scripture.reference,
  })

  return NextResponse.json(scripture)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.scripture.findUnique({ where: { id: params.id } })
  await db.scripture.delete({ where: { id: params.id } })

  if (existing) {
    await logActivity({
      userId: session.user.id,
      action: `Deleted scripture: ${existing.reference}`,
      module: 'Scripture',
      targetId: params.id,
      targetTitle: existing.reference,
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
