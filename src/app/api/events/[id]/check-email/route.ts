import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false })
  }

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
    select: { id: true },
  })

  if (!event) return NextResponse.json({ exists: false })

  const registration = await db.eventRegistration.findFirst({
    where: {
      eventId: event.id,
      email: { equals: email.trim(), mode: 'insensitive' },
    },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!registration })
}
