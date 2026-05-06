import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateSeriesSchema } from '@/lib/validations/study'

export const runtime = 'nodejs'

export async function GET() {
  const series = await db.studySeries.findMany({
    orderBy: { order: 'asc' },
    include: {
      materials: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json(series)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateSeriesSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const series = await db.studySeries.create({ data: parsed.data })
  return NextResponse.json(series, { status: 201 })
}
