import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type PatchBody = {
  url?: string
  heading?: string
  order?: number
  isActive?: boolean
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as PatchBody
  const data: Record<string, unknown> = {}
  if ('url' in body && body.url?.trim()) data.url = body.url.trim()
  if ('heading' in body && body.heading?.trim()) data.heading = body.heading.trim()
  if ('order' in body) data.order = body.order
  if ('isActive' in body) data.isActive = body.isActive

  const slide = await db.homeCarouselSlide.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(slide)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.homeCarouselSlide.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
