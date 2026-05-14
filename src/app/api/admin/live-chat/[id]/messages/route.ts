import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { db } from '@/lib/db'
import { paramId } from '@/lib/api-route-params'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const sessionUser = await auth()
    const denied = await forbidUnlessCanAccess(sessionUser, 'live-chat')
    if (denied) return denied

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

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
