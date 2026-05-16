import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; registrationId: string } },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const registration = await db.eventRegistration.findFirst({
    where: { id: params.registrationId, eventId: event.id },
  })
  if (!registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  await db.eventRegistration.delete({ where: { id: registration.id } })

  await logActivity({
    userId: session.user.id,
    action: `Deleted registration for ${event.title}: ${registration.email}`,
    module: 'Events',
    targetId: registration.id,
    targetTitle: registration.name,
  })

  return NextResponse.json({ success: true })
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string; registrationId: string } },
) {
  if (req.headers.get('X-HTTP-Method-Override') === 'DELETE') {
    return DELETE(req, ctx)
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
