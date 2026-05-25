import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type ReorderBody = {
  ids: string[]
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as ReorderBody
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }

  await db.$transaction(
    body.ids.map((id, index) =>
      db.galleryImage.update({
        where: { id },
        data: { showOnHome: true, homeOrder: index },
      }),
    ),
  )

  const images = await db.galleryImage.findMany({
    where: { id: { in: body.ids } },
    orderBy: { homeOrder: 'asc' },
    include: {
      galleryEvent: { select: { name: true, city: true, date: true } },
    },
  })

  return NextResponse.json(images)
}
