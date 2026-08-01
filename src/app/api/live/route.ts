import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10) || 1)
  const limit = 12
  const skip = (page - 1) * limit

  const [videos, total] = await Promise.all([
    db.rfyLiveVideo.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        youtubeVideoId: true,
        title: true,
        thumbnailUrl: true,
        publishedAt: true,
        durationSec: true,
        viewCount: true,
      },
    }),
    db.rfyLiveVideo.count({ where: { isActive: true } }),
  ])

  return NextResponse.json({
    videos,
    total,
    page,
    hasMore: page * limit < total,
  })
}
