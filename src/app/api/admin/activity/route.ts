import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(session.user.role, 'activity')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const moduleFilter = searchParams.get('module')
  const userId = searchParams.get('userId')

  const where: { module?: string; userId?: string } = {}
  if (moduleFilter) where.module = moduleFilter
  if (userId) where.userId = userId

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.activityLog.count({ where }),
  ])

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.activityLog.deleteMany({})
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  if (req.headers.get('X-HTTP-Method-Override') === 'DELETE') {
    return DELETE()
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
