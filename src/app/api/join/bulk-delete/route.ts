import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifySSEClients } from '@/lib/notify'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
  }

  const idList = ids.filter((x: unknown) => typeof x === 'string') as string[]

  const result = await db.communityMember.deleteMany({
    where: { id: { in: idList } },
  })

  await db.adminNotification.updateMany({
    where: { type: 'member', targetId: { in: idList } },
    data: { isRead: true },
  })
  notifySSEClients()

  return NextResponse.json({ deleted: result.count })
}
