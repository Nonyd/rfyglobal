export const EVENT_ACTIVE_WINDOW_MS = 5 * 60 * 60 * 1000

/** Events with start time at or after this cutoff are still active on the public site. */
export function getEventActiveCutoff(): Date {
  return new Date(Date.now() - EVENT_ACTIVE_WINDOW_MS)
}

export function isEventStillActive(eventDate: Date | string | null): boolean {
  if (!eventDate) return false
  const date = new Date(eventDate)
  const fiveHoursAfterStart = new Date(date.getTime() + EVENT_ACTIVE_WINDOW_MS)
  return fiveHoursAfterStart > new Date()
}

export function isEventUpcoming(eventDate: Date | string | null): boolean {
  if (!eventDate) return false
  return new Date(eventDate) > new Date()
}

export function isEventLive(eventDate: Date | string | null): boolean {
  if (!eventDate) return false
  const date = new Date(eventDate)
  const now = new Date()
  const fiveHoursAfterStart = new Date(date.getTime() + EVENT_ACTIVE_WINDOW_MS)
  return date <= now && now <= fiveHoursAfterStart
}

export function isEventPast(eventDate: Date | string | null): boolean {
  if (!eventDate) return false
  return !isEventStillActive(eventDate)
}

export function getEventStatus(
  eventDate: Date | string | null,
): 'upcoming' | 'live' | 'past' {
  if (!eventDate) return 'upcoming'
  const date = new Date(eventDate)
  const now = new Date()
  const fiveHoursAfter = new Date(date.getTime() + EVENT_ACTIVE_WINDOW_MS)

  if (date > now) return 'upcoming'
  if (now <= fiveHoursAfter) return 'live'
  return 'past'
}
