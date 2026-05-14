import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { paramId } from '@/lib/api-route-params'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const denied = await forbidUnlessCanAccess(session, 'messages')
    if (denied) return denied

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const thread = await db.messageThread.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.message.updateMany({
      where: { threadId: id, isRead: false, fromAdmin: false },
      data: { isRead: true },
    })

    return NextResponse.json(thread)
  } catch (error) {
    console.error('[thread messages GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
