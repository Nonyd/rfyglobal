import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { TestimonyStatus } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status')

    const where =
      statusParam && Object.values(TestimonyStatus).includes(statusParam as TestimonyStatus)
        ? { status: statusParam as TestimonyStatus }
        : {}

    const testimonies = await db.testimony.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(testimonies)
  } catch (e) {
    console.error('[admin testimony GET]', e)
    return NextResponse.json({ error: 'Failed to load testimonies' }, { status: 500 })
  }
}
