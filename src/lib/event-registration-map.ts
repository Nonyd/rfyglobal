import type { EventFormField } from '@prisma/client'

export function extractMappedEventFields(
  formFields: EventFormField[],
  fieldValues: Record<string, string>,
) {
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
