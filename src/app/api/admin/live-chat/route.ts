import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const denied = await forbidUnlessCanAccess(session, 'live-chat')
    if (denied) return denied

    const sessions = await db.liveChatSession.findMany({
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: {
            messages: { where: { isRead: false, fromAdmin: false } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
