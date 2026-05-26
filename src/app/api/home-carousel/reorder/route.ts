import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { ids: string[] }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }

  await db.$transaction(
    body.ids.map((id, index) =>
      db.homeCarouselSlide.update({
        where: { id },
        data: { order: index },
      }),
    ),
  )

  const slides = await db.homeCarouselSlide.findMany({
    where: { id: { in: body.ids } },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(slides)
}
