import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const thread = await db.messageThread.findUnique({
      where: { id: params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.message.updateMany({
      where: { threadId: params.id, isRead: false, fromAdmin: false },
      data: { isRead: true },
    })

    return NextResponse.json(thread)
  } catch (error) {
    console.error('[thread messages GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
