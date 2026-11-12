import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/** Public play counter for /listen/[slug]. Best effort: never errors to the listener. */
export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  if (/^[a-z0-9-]{1,80}$/.test(params.slug)) {
    await db.audioTrack
      .updateMany({ where: { slug: params.slug, isPublished: true }, data: { plays: { increment: 1 } } })
      .catch(() => {})
  }
  return new NextResponse(null, { status: 204 })
}
