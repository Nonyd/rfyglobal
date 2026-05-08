import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [newPrayers, newTestimonies, unreadMessages] = await Promise.all([
    db.prayerRequest.count({ where: { status: 'PENDING' } }),
    db.testimony.count({ where: { status: 'PENDING' } }),
    db.messageThread.count({ where: { isRead: false } }),
  ])

  return NextResponse.json({
    prayers: newPrayers,
    testimonies: newTestimonies,
    messages: unreadMessages,
    total: newPrayers + newTestimonies + unreadMessages,
  })
}
