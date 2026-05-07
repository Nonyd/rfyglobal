import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { CreateScriptureSchema } from '@/lib/validations/scripture'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (session) {
    const scriptures = await db.scripture.findMany({
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(scriptures)
  }

  const scriptures = await db.scripture.findMany({
    where: { isActive: true, isDraft: false },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(scriptures)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateScriptureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { scheduledAt, audioUrl, ...rest } = parsed.data

  const scripture = await db.scripture.create({
    data: {
      ...rest,
      audioUrl: audioUrl || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  })

  await logActivity({
    userId: session.user.id,
    action: `Created scripture: ${scripture.reference}`,
    module: 'Scripture',
    targetId: scripture.id,
    targetTitle: scripture.reference,
  })

  return NextResponse.json(scripture, { status: 201 })
}
