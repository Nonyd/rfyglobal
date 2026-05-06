import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const scriptures = await db.scripture.findMany({
    where: { isActive: true },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      reference: true,
      text: true,
      translation: true,
      audioUrl: true,
      scheduledAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json(scriptures)
}
