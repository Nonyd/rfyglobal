import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
