// Pure date helpers for automations (no DB), so they can be unit-tested directly.

/** The ministry's calendar day. Automations must not depend on the VPS timezone. */
export const AUTOMATION_TIMEZONE = 'Africa/Lagos'

export function automationToday(now: Date = new Date()): {
  year: number
  month: number
  day: number
  iso: string
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AUTOMATION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const year = get('year')
  const month = get('month')
  const day = get('day')
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { year, month, day, iso }
}
