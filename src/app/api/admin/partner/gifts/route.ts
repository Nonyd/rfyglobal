import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [records, stats] = await Promise.all([
    db.givingRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.givingRecord.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const totalAmount = stats._sum.amount ?? 0
  const successCount = stats._count.id ?? 0
  const pendingFailedCount = records.filter((r) => r.status !== 'SUCCESS').length

  return NextResponse.json({
    records,
    stats: {
      totalAmount,
      successCount,
      pendingFailedCount,
    },
  })
}
