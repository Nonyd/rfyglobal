import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let scripture = await db.scripture.findFirst({
      where: {
        scheduledAt: { gte: today, lt: tomorrow },
        isActive: true,
      },
    })

    if (!scripture) {
      const pool = await db.scripture.findMany({
        where: { scheduledAt: null, isActive: true },
      })
      if (pool.length > 0) {
        const seed =
          today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
        scripture = pool[seed % pool.length]
      }
    }

    if (!scripture) {
      return NextResponse.json({
        id: 'fallback',
        reference: '2 Corinthians 5:17',
        text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
        translation: 'NIV',
        audioUrl: null,
      })
    }

    return NextResponse.json(scripture)
  } catch {
    return NextResponse.json({
      id: 'fallback',
      reference: '2 Corinthians 5:17',
      text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
      translation: 'NIV',
      audioUrl: null,
    })
  }
}
