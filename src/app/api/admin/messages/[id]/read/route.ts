import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.message.updateMany({
    where: { threadId: params.id, isRead: false, fromAdmin: false },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
