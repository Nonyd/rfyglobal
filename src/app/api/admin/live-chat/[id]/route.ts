import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { broadcastSSE } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function idFromParams(params: { id: string } | Promise<{ id: string }>) {
  const p = await Promise.resolve(params)
  return p.id
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const sessionUser = await auth()
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = await idFromParams(ctx.params)
    const chatSession = await db.liveChatSession.findUnique({
      where: { id },
    })
    if (!chatSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    await db.liveChatMessage.create({
      data: {
        sessionId: chatSession.id,
        body: body.trim(),
        fromAdmin: true,
        isRead: false,
      },
    })

    await db.liveChatSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    broadcastSSE({
      type: 'chat_reply',
      event: 'chat_reply',
      sessionId: chatSession.id,
      sessionToken: chatSession.sessionToken,
      timestamp: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin live-chat reply]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
