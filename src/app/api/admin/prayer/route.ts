import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PrayerRequestStatus } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = 20

  const where =
    statusParam && Object.values(PrayerRequestStatus).includes(statusParam as PrayerRequestStatus)
      ? { status: statusParam as PrayerRequestStatus }
      : {}

  const [requests, total] = await Promise.all([
    db.prayerRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.prayerRequest.count({ where }),
  ])

  return NextResponse.json({ requests, total })
}
