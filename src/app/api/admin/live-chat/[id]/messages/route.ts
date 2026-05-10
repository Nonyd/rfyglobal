import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function idFromParams(params: { id: string } | Promise<{ id: string }>) {
  const p = await Promise.resolve(params)
  return p.id
}

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const sessionUser = await auth()
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = await idFromParams(ctx.params)
    const chatSession = await db.liveChatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!chatSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.liveChatMessage.updateMany({
      where: { sessionId: id, fromAdmin: false, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json(chatSession)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
