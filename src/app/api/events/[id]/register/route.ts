import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendEventRegistrationEmail } from '@/lib/emails/event-registration'
import { createNotification } from '@/lib/notify'
import { extractMappedEventFields } from '@/lib/event-registration-map'
import { isEventStillActive } from '@/lib/event-utils'
import { z } from 'zod'

export const runtime = 'nodejs'

const RegisterSchema = z.object({
  fields: z.record(z.string(), z.string()),
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

  const feeNgn = event.registrationFeeNgn ?? 0
  const feeUsd = event.registrationFeeUsd ?? 0
  if (feeNgn > 0 || feeUsd > 0) {
    return NextResponse.json(
      { error: 'This event requires payment. Complete checkout from the event page.' },
      { status: 400 },
    )
  }

  if (!isEventStillActive(event.date)) {
    return NextResponse.json({ error: 'Registration for this event has closed.' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const fieldValues = parsed.data.fields

  const formFields = await db.eventFormField.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: { order: 'asc' },
  })

  if (formFields.length === 0) {
    return NextResponse.json({ error: 'Registration is not available for this event.' }, { status: 400 })
  }

  const { email, name, phone, location, expectations } = extractMappedEventFields(formFields, fieldValues)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  for (const field of formFields) {
    if (field.required) {
      const value = fieldValues[field.id]
      if (!value || value.trim() === '') {
        return NextResponse.json({ error: `"${field.label}" is required.` }, { status: 400 })
      }
    }
  }

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
    data: {
      eventId: event.id,
      name: name || email,
      email,
      phone: phone || 'N/A',
      location: location || 'N/A',
      expectations,
      extraFields: fieldValues,
    },
  })

  try {
    await sendEventRegistrationEmail({ name: name || email, email, event })
  } catch (err) {
    console.error('[EventReg] Failed to send confirmation email:', err)
  }

  await createNotification('event_registration', `New registration for ${event.title}`)

  return NextResponse.json(
    {
      success: true,
      registrationId: registration.id,
      message: `You are registered for ${event.title}!`,
      redirectUrl: event.redirectUrl ?? null,
    },
    { status: 201 },
  )
}
