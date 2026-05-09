import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendEventRegistrationEmail } from '@/lib/emails/event-registration'
import type { EventFormField } from '@prisma/client'
import { createNotification } from '@/lib/notify'
import { z } from 'zod'

export const runtime = 'nodejs'

const RegisterSchema = z.object({
  fields: z.record(z.string(), z.string()),
})

function extractMappedValues(formFields: EventFormField[], fieldValues: Record<string, string>) {
  const emailField = formFields.find((f) => f.type === 'EMAIL')
  const email = emailField ? (fieldValues[emailField.id] ?? '').trim() : ''

  const nameField =
    formFields.find((f) => f.type === 'SHORT_TEXT' && f.order === 0) ??
    formFields.find((f) => f.type === 'SHORT_TEXT' && f.label.toLowerCase().includes('name'))

  const name = nameField ? (fieldValues[nameField.id] ?? '').trim() : ''

  const phoneField = formFields.find((f) => f.type === 'PHONE')
  const phone = phoneField ? (fieldValues[phoneField.id] ?? '').trim() : ''

  const locationField =
    formFields.find((f) => f.type === 'LOCATION') ??
    formFields.find((f) => f.label.toLowerCase().includes('location'))

  const location = locationField ? (fieldValues[locationField.id] ?? '').trim() : ''

  const expectationsField =
    formFields.find((f) => f.type === 'LONG_TEXT') ??
    formFields.find((f) => f.label.toLowerCase().includes('expect'))

  const expectationsRaw = expectationsField ? (fieldValues[expectationsField.id] ?? '').trim() : ''
  const expectations = expectationsRaw || null

  return { email, name, phone, location, expectations }
}

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

  const { email, name, phone, location, expectations } = extractMappedValues(formFields, fieldValues)

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

  return NextResponse.json({ success: true, registrationId: registration.id }, { status: 201 })
}
