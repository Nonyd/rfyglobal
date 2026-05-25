import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { broadcastSSE, createNotification } from '@/lib/notify'
import { sendLiveChatMessageAlert } from '@/lib/live-chat-admin-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function tokenFromParams(params: { sessionToken: string } | Promise<{ sessionToken: string }>) {
  const p = await Promise.resolve(params)
  return p.sessionToken
}

export async function GET(
  req: NextRequest,
  ctx: { params: { sessionToken: string } | Promise<{ sessionToken: string }> },
) {
  try {
    const sessionToken = await tokenFromParams(ctx.params)
    const session = await db.liveChatSession.findUnique({
      where: { sessionToken },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.liveChatSession.update({
      where: { id: session.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    })

    await db.liveChatMessage.updateMany({
      where: { sessionId: session.id, fromAdmin: true, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ ...session, messages: session.messages })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: { sessionToken: string } | Promise<{ sessionToken: string }> },
) {
  try {
    const sessionToken = await tokenFromParams(ctx.params)
    const session = await db.liveChatSession.findUnique({
      where: { sessionToken },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    await db.liveChatMessage.create({
      data: {
        sessionId: session.id,
        body: body.trim(),
        fromAdmin: false,
        isRead: false,
      },
    })

    const trimmed = body.trim()
    try {
      await createNotification(
        'live_chat',
        `${session.name}: "${trimmed.slice(0, 80)}${trimmed.length > 80 ? '…' : ''}"`,
      )
    } catch {
      /* bell notification must not block chat */
    }

    await db.liveChatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date(), isOnline: true, lastSeenAt: new Date() },
    })

    broadcastSSE({
      type: 'notification',
      event: 'new_chat_message',
      sessionId: session.id,
      timestamp: Date.now(),
    })

    try {
      await sendLiveChatMessageAlert({
        name: session.name,
        email: session.email,
        body: trimmed,
      })
    } catch (err) {
      console.error('[chat] admin email alert failed:', err)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
