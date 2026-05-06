import type { FieldType } from '@prisma/client'
import { db } from '@/lib/db'

export type DefaultEventFieldSeed = {
  label: string
  type: FieldType
  placeholder: string | null
  required: boolean
  order: number
  isCore: boolean
}

export const DEFAULT_EVENT_FORM_FIELDS: DefaultEventFieldSeed[] = [
  {
    label: 'Full Name',
    type: 'SHORT_TEXT',
    placeholder: 'Your full name',
    required: true,
    order: 0,
    isCore: true,
  },
  {
    label: 'Email Address',
    type: 'EMAIL',
    placeholder: 'your@email.com',
    required: true,
    order: 1,
    isCore: true,
  },
  {
    label: 'Phone Number',
    type: 'PHONE',
    placeholder: '+234...',
    required: true,
    order: 2,
    isCore: true,
  },
  {
    label: 'Location',
    type: 'SHORT_TEXT',
    placeholder: 'City, Country',
    required: true,
    order: 3,
    isCore: true,
  },
  {
    label: 'Expectations',
    type: 'LONG_TEXT',
    placeholder: 'What are you expecting from this gathering?',
    required: false,
    order: 4,
    isCore: true,
  },
]

/** Creates default registration fields when an event has none (idempotent). */
export async function ensureDefaultEventFields(eventId: string) {
  const count = await db.eventFormField.count({ where: { eventId } })
  if (count > 0) return

  await db.eventFormField.createMany({
    data: DEFAULT_EVENT_FORM_FIELDS.map((f) => ({
      eventId,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder,
      required: f.required,
      order: f.order,
      isActive: true,
      isCore: f.isCore,
    })),
  })
}
