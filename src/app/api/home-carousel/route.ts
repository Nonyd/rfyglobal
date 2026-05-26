import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  const includeHidden = req.nextUrl.searchParams.get('includeHidden') === 'true'

  const slides = await db.homeCarouselSlide.findMany({
    where: session && includeHidden ? {} : { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(slides)
}

type CreateBody = {
  url: string
  heading: string
  order?: number
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as CreateBody
  const url = body.url?.trim()
  const heading = body.heading?.trim()
  if (!url || !heading) {
    return NextResponse.json({ error: 'url and heading are required' }, { status: 400 })
  }

  const count = await db.homeCarouselSlide.count()
  const slide = await db.homeCarouselSlide.create({
    data: {
      url,
      heading,
      order: typeof body.order === 'number' ? body.order : count,
    },
  })

  return NextResponse.json(slide, { status: 201 })
}
