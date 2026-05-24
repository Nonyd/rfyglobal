# ROOM FOR YOU — Phase 39 Cursor Prompt
## Events Stay Active Until 5 Hours After Start Time

---

## CONTEXT

Currently events become inactive/past as soon as their start time passes. Events should remain active and visible on the public events page until **5 hours after their start time**. This gives attendees time to still register or find event details even after the event has started.

---

## TASK 1 — Find All Event Filtering Logic

Search the codebase for everywhere events are filtered by date/time:

```
Search: new Date()
Search: event.date
Search: isPast
Search: isUpcoming
Search: startTime
Search: endTime
```

Check these files specifically:
- `src/app/api/events/route.ts` — GET all events
- `src/app/(public)/events/page.tsx` — public events listing
- Any event filtering utilities

---

## TASK 2 — Update Event Active Window

The logic for "is this event still relevant/active" should be:

**Before:** Event is past when `event.date < now`

**After:** Event is past when `event.date + 5 hours < now`

```typescript
// Helper function — add to src/lib/event-utils.ts or inline:
export function isEventStillActive(eventDate: Date | string | null): boolean {
  if (!eventDate) return false
  const date = new Date(eventDate)
  const fiveHoursAfterStart = new Date(date.getTime() + 5 * 60 * 60 * 1000)
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
  const fiveHoursAfterStart = new Date(date.getTime() + 5 * 60 * 60 * 1000)
  return date <= now && now <= fiveHoursAfterStart
}
```

---

## TASK 3 — Update Public Events API

Open `src/app/api/events/route.ts`.

Find the GET handler that returns events for the public site. Update the date filter to include events up to 5 hours after their start time:

```typescript
// BEFORE (approximate):
where: {
  date: { gte: new Date() }  // only future events
}

// AFTER:
const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
where: {
  date: { gte: fiveHoursAgo }  // events that started up to 5 hours ago
}
```

---

## TASK 4 — Update Public Events Page

Open `src/app/(public)/events/page.tsx` or the events client component.

If events are filtered client-side, update the filtering:

```typescript
// BEFORE:
const upcomingEvents = events.filter(e => new Date(e.date) > new Date())

// AFTER:
const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
const activeEvents = events.filter(e => new Date(e.date) >= fiveHoursAgo)
```

Also add a **"LIVE NOW"** badge on events that have already started but are within the 5-hour window:

```typescript
const isLive = (eventDate: string) => {
  const date = new Date(eventDate)
  const now = new Date()
  const fiveHoursAfter = new Date(date.getTime() + 5 * 60 * 60 * 1000)
  return date <= now && now <= fiveHoursAfter
}

// In the event card:
{isLive(event.date) && (
  <span
    className="inline-flex items-center gap-1.5 px-2 py-1 font-body text-[10px] font-bold uppercase tracking-widest"
    style={{ background: 'var(--color-accent)', color: '#FAF7F2' }}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
    Live Now
  </span>
)}
```

---

## TASK 5 — Update Event Registration

Open `src/app/api/events/[id]/register/route.ts`.

Ensure registration is still allowed during the live window (up to 5 hours after start):

```typescript
// Check if event is still accepting registrations:
const fiveHoursAfterStart = new Date(event.date.getTime() + 5 * 60 * 60 * 1000)
if (fiveHoursAfterStart < new Date()) {
  return NextResponse.json(
    { error: 'Registration for this event has closed.' },
    { status: 400 }
  )
}
```

---

## TASK 6 — Update Admin Events Display

Open the admin events manager.

In the admin, events should show a status indicator:
- **Upcoming** — event date is in the future
- **Live** — event started within the last 5 hours (show green dot)
- **Past** — event ended more than 5 hours ago

```typescript
function getEventStatus(eventDate: Date | string | null): 'upcoming' | 'live' | 'past' {
  if (!eventDate) return 'upcoming'
  const date = new Date(eventDate)
  const now = new Date()
  const fiveHoursAfter = new Date(date.getTime() + 5 * 60 * 60 * 1000)
  
  if (date > now) return 'upcoming'
  if (now <= fiveHoursAfter) return 'live'
  return 'past'
}

// Status badge in admin event card:
const status = getEventStatus(event.date)
const statusConfig = {
  upcoming: { label: 'Upcoming', color: 'var(--a-gold)' },
  live: { label: 'Live Now', color: '#22C55E' },
  past: { label: 'Past', color: 'var(--a-text-muted)' },
}
```

---

## COMPLETION CHECKLIST

- [ ] `isEventStillActive` helper created
- [ ] Public events API returns events up to 5 hours after start time
- [ ] Public events page shows events up to 5 hours after start time
- [ ] "Live Now" badge appears on events in the active window
- [ ] Event registration still works during the live window
- [ ] Registration closes 5 hours after start time
- [ ] Admin shows Upcoming / Live / Past status per event
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The 5-hour window is calculated from `event.date` (start time). `event.date + 5 hours` is the cutoff.
- `isLive` = event has started AND less than 5 hours have passed since start
- `isUpcoming` = event hasn't started yet
- `isPast` = more than 5 hours after start
- The "Live Now" badge with a pulsing dot is a nice UX touch — it tells attendees the event is happening right now and they can still join.
- Make sure both server-side (API) and client-side filtering use the same 5-hour rule consistently.
