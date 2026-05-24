import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'
import { extractMappedEventFields } from '@/lib/event-registration-map'
import { isEventStillActive } from '@/lib/event-utils'

export const runtime = 'nodejs'

const BodySchema = z.object({
  fields: z.record(z.string(), z.string()),
})

/** Validates registration fields and stores them until Paystack checkout completes. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  const { success } = await strictRatelimit.limit(`event-draft:${ip}`)
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
  if (feeNgn <= 0 && feeUsd <= 0) {
    return NextResponse.json({ error: 'This event does not require payment.' }, { status: 400 })
  }

  if (!isEventStillActive(event.date)) {
    return NextResponse.json({ error: 'Registration for this event has closed.' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
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

  const { email } = extractMappedEventFields(formFields, fieldValues)

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

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  const draft = await db.eventRegistrationDraft.create({
    data: {
      eventId: event.id,
      fields: fieldValues,
      email,
      expiresAt,
    },
  })

  return NextResponse.json({ draftId: draft.id }, { status: 201 })
}
