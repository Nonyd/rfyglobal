import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendLiveChatSessionAlert } from '@/lib/live-chat-admin-email'
import { broadcastSSE, createNotification } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, sessionToken } = await req.json()

    if (sessionToken) {
      const existing = await db.liveChatSession.findUnique({
        where: { sessionToken },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      if (existing) {
        await db.liveChatSession.update({
          where: { id: existing.id },
          data: { isOnline: true, lastSeenAt: new Date() },
        })
        return NextResponse.json(existing)
      }
    }

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const session = await db.liveChatSession.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        isOnline: true,
      },
      include: { messages: true },
    })

    broadcastSSE({
      type: 'notification',
      event: 'new_chat',
      sessionId: session.id,
      timestamp: Date.now(),
    })

    try {
      await createNotification('live_chat', `${session.name} started a live chat`)
    } catch {
      /* bell notification must not block chat */
    }

    try {
      await sendLiveChatSessionAlert({
        name: session.name,
        email: session.email,
      })
    } catch (err) {
      console.error('[chat] admin session email alert failed:', err)
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('[chat session]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
