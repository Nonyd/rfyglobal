import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { broadcastSSE } from '@/lib/notify'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberCount = await db.communityMember.count()
    if (memberCount === 0) {
      await db.adminNotification.updateMany({
        where: { type: 'member', isRead: false },
        data: { isRead: true },
      })
    }

    const [notifications, unreadRows] = await Promise.all([
      db.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.adminNotification.findMany({
        where: { isRead: false },
        select: { id: true, type: true, targetId: true },
      }),
    ])

    const memberTargets = Array.from(
      new Set(
        unreadRows
          .filter((r) => r.type === 'member' && r.targetId)
          .map((r) => r.targetId as string),
      ),
    )

    const existingMemberTargets =
      memberTargets.length > 0
        ? await db.communityMember.findMany({
            where: { id: { in: memberTargets } },
            select: { id: true },
          })
        : []

    const existingMemberSet = new Set(existingMemberTargets.map((m) => m.id))

    const staleMemberNotificationIds = unreadRows
      .filter((r) => r.type === 'member' && r.targetId && !existingMemberSet.has(r.targetId))
      .map((r) => r.id)

    if (staleMemberNotificationIds.length > 0) {
      await db.adminNotification.updateMany({
        where: { id: { in: staleMemberNotificationIds } },
        data: { isRead: true },
      })
      broadcastSSE({ type: 'notification', event: 'stale_cleared', timestamp: Date.now() })
    }

    const staleSet = new Set(staleMemberNotificationIds)

    const includeInUnreadCount = (type: string, targetId: string | null, id: string) => {
      if (staleSet.has(id)) return false
      if (type !== 'member') return true
      if (!targetId) return true
      return existingMemberSet.has(targetId)
    }

    const unreadByType = unreadRows
      .filter((r) => includeInUnreadCount(r.type, r.targetId, r.id))
      .reduce(
        (acc, r) => {
          acc[r.type] = (acc[r.type] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

    const total = Object.values(unreadByType).reduce((a, b) => a + b, 0)

    const notificationsOut = notifications.map((n) =>
      staleSet.has(n.id) ? { ...n, isRead: true } : n,
    )

    return NextResponse.json({
      notifications: notificationsOut,
      total,
      unreadByType,
    })
  } catch (error) {
    console.error('[notifications GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (body.markAllRead) {
      await db.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      })
      broadcastSSE({ type: 'notification', event: 'mark_all_read', timestamp: Date.now() })
      return NextResponse.json({ success: true })
    }

    if (body.id) {
      await db.adminNotification.update({
        where: { id: body.id },
        data: { isRead: true },
      })
      broadcastSSE({ type: 'notification', event: 'mark_read', timestamp: Date.now() })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[notifications PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
    }

    await db.adminNotification.delete({ where: { id } })
    broadcastSSE({ type: 'notification', event: 'deleted', timestamp: Date.now() })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications DELETE]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
