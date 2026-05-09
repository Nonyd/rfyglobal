import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [notifications, counts] = await Promise.all([
    db.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.adminNotification.groupBy({
      by: ['type'],
      where: { isRead: false },
      _count: true,
    }),
  ])

  const unreadByType = counts.reduce(
    (acc, c) => {
      acc[c.type] = c._count
      return acc
    },
    {} as Record<string, number>,
  )

  const total = Object.values(unreadByType).reduce((a, b) => a + b, 0)

  return NextResponse.json({ notifications, unreadByType, total })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { markAllRead?: boolean; id?: string }

  if (body.markAllRead) {
    await db.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    })
    return NextResponse.json({ success: true })
  }

  if (body.id) {
    await db.adminNotification.update({
      where: { id: body.id },
      data: { isRead: true },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'No ID' }, { status: 400 })

  await db.adminNotification.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
