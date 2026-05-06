import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendEventRegistrationEmail } from '@/lib/emails/event-registration'
import { z } from 'zod'

export const runtime = 'nodejs'

const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7).max(20),
  location: z.string().min(1, 'Location is required').max(200),
  expectations: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  const { success } = await strictRatelimit.limit(`event-reg:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const event = await db.event.findFirst({
    where: {
      OR: [{ slug: params.id }, { id: params.id }],
      isActive: true,
    },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  if (new Date(event.date) < new Date()) {
    return NextResponse.json({ error: 'This event has already passed' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, phone, location, expectations } = parsed.data

  const existing = await db.eventRegistration.findUnique({
    where: { eventId_email: { eventId: event.id, email } },
  })

  if (existing) {
    return NextResponse.json(
      {
        error: 'You are already registered for this event.',
        alreadyRegistered: true,
      },
      { status: 409 }
    )
  }

  const registration = await db.eventRegistration.create({
    data: { eventId: event.id, name, email, phone, location, expectations },
  })

  try {
    await sendEventRegistrationEmail({ name, email, event })
  } catch (err) {
    console.error('[EventReg] Failed to send confirmation email:', err)
  }

  return NextResponse.json({ success: true, registrationId: registration.id }, { status: 201 })
}
