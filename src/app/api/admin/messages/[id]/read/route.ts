import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'messages')
  if (denied) return denied

  await db.message.updateMany({
    where: { threadId: params.id, isRead: false, fromAdmin: false },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
