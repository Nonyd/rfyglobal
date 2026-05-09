# ROOM FOR YOU — Phase 31 Cursor Prompt
## Live Data Updates on Admin Pages via SSE

---

## CONTEXT

Extend the existing SSE infrastructure (Phase 29) so that admin pages automatically refresh their data when relevant events happen — without the admin needing to refresh the page.

**Pages that need live updates:**
- `/admin/messages` — refreshes when a new contact form is submitted
- `/admin/members` — refreshes when someone joins the community
- `/admin/partner` — refreshes when a new donation is made
- `/admin/testimonies` — refreshes when a new testimony is submitted
- `/admin/prayer` — refreshes when a new prayer request is submitted
- `/admin/notifications` — already handled by Phase 29

**How it works:**
1. An event happens (e.g. someone joins)
2. Server calls `createNotification('member', ...)` which already calls `notifySSEClients()`
3. We extend the SSE payload to include the event type
4. The Members page is listening for `new_member` events
5. It automatically calls `loadMembers()` — new member appears instantly

---

## TASK 1 — Extend SSE Payload in notify.ts

Open `src/lib/notify.ts`.

Update `notifySSEClients` to accept an event type:

```typescript
// Map notification types to SSE event types
const SSE_EVENT_MAP: Record<string, string> = {
  prayer: 'new_prayer',
  testimony: 'new_testimony',
  message: 'new_message',
  member: 'new_member',
  partner: 'new_partner',
  event_registration: 'new_event_registration',
  contact: 'new_message', // contact goes to messages page
}

export function notifySSEClients(notificationType?: string) {
  const eventType = notificationType
    ? SSE_EVENT_MAP[notificationType] ?? 'notification'
    : 'notification'

  const message = `data: ${JSON.stringify({
    type: 'notification',
    event: eventType,
    timestamp: Date.now(),
  })}\n\n`

  sseClients.forEach(send => {
    try { send(message) } catch {}
  })
}
```

Update `createNotification` to pass the type to `notifySSEClients`:

```typescript
export async function createNotification(
  type: NotificationType,
  body?: string
) {
  const config = NOTIFICATION_CONFIG[type]
  await db.adminNotification.create({
    data: {
      type,
      title: config.title,
      body: body ?? null,
      link: config.link,
    },
  })

  // Pass the type so SSE clients know which event fired
  notifySSEClients(type)
}
```

---

## TASK 2 — useAdminSSE Hook

Create `src/hooks/useAdminSSE.ts`:

```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'

type SSEEventType =
  | 'new_prayer'
  | 'new_testimony'
  | 'new_message'
  | 'new_member'
  | 'new_partner'
  | 'new_event_registration'
  | 'notification'

interface UseAdminSSEOptions {
  // Which event types should trigger the callback
  events: SSEEventType[]
  // Called when a matching event fires
  onEvent: () => void
  // Whether to enable (default: true)
  enabled?: boolean
}

export function useAdminSSE({ events, onEvent, enabled = true }: UseAdminSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const onEventRef = useRef(onEvent)

  // Keep ref up to date without re-connecting
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!enabled) return

    let retryTimeout: NodeJS.Timeout

    const connect = () => {
      const es = new EventSource('/api/admin/notifications/stream')
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // Fire callback if this event type matches what we're listening for
          if (
            data.type === 'notification' &&
            data.event &&
            events.includes(data.event as SSEEventType)
          ) {
            onEventRef.current()
          }
        } catch {}
      }

      es.onerror = () => {
        es.close()
        // Reconnect after 3 seconds
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      eventSourceRef.current?.close()
      clearTimeout(retryTimeout)
    }
  }, [enabled, events.join(',')])
}
```

---

## TASK 3 — Live Updates on Messages Page

Open `src/components/admin/messaging/MessagingManager.tsx`.

Add the SSE hook to auto-reload when a new message arrives:

```typescript
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { useCallback } from 'react'

export function MessagingManager() {
  // ... existing state ...

  const loadThreads = useCallback(async () => {
    // existing loadThreads logic
  }, [])

  // Live updates — reload when new message arrives
  useAdminSSE({
    events: ['new_message'],
    onEvent: loadThreads,
  })

  // ... rest of component unchanged ...
}
```

Also add a subtle "live" indicator to show the page is connected:

```typescript
// Add a small green dot indicator in the page header:
<div className="flex items-center gap-2">
  <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
    Messages
  </h1>
  <div className="flex items-center gap-1.5">
    <span
      className="w-2 h-2 rounded-full animate-pulse"
      style={{ background: '#22C55E' }}
      title="Live updates active"
    />
    <span className="font-body text-xs" style={{ color: '#22C55E' }}>Live</span>
  </div>
</div>
```

---

## TASK 4 — Live Updates on Members Page

Open `src/components/admin/members/MembersManager.tsx`.

```typescript
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { useCallback } from 'react'

export function MembersManager() {
  const loadMembers = useCallback(async () => {
    // existing loadMembers logic
  }, [])

  // Live updates
  useAdminSSE({
    events: ['new_member'],
    onEvent: loadMembers,
  })

  // Add live indicator to header same as above
  // ...
}
```

---

## TASK 5 — Live Updates on Partnership Page

Open the partnership/giving admin component (wherever the gifts list is rendered — likely `src/app/admin/(dashboard)/partner/page.tsx` or a partner manager component).

```typescript
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { useCallback, useState, useEffect } from 'react'

// If this is a server component, convert the gifts list section to a client component:
// Create src/components/admin/partner/PartnerGiftsLive.tsx

'use client'

export function PartnerGiftsLive() {
  const [gifts, setGifts] = useState<any[]>([])

  const loadGifts = useCallback(async () => {
    const res = await fetch('/api/admin/partner/gifts')
    if (res.ok) {
      const data = await res.json()
      setGifts(data)
    }
  }, [])

  useEffect(() => {
    loadGifts()
  }, [loadGifts])

  // Live updates
  useAdminSSE({
    events: ['new_partner'],
    onEvent: loadGifts,
  })

  return (
    <div>
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Recent Gifts
        </h2>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
        <span className="font-body text-xs" style={{ color: '#22C55E' }}>Live</span>
      </div>

      {/* Gifts list — render gifts here */}
      {gifts.map(gift => (
        <div key={gift.id} className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--a-border)' }}>
          <div>
            <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
              {gift.name}
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
              {gift.email} · {new Date(gift.createdAt).toLocaleDateString()}
            </p>
          </div>
          <p className="font-display text-lg font-bold" style={{ color: 'var(--a-gold)' }}>
            ₦{(gift.amount / 100).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
```

---

## TASK 6 — Live Updates on Testimonies Page

Open `src/components/admin/testimony/TestimonyManager.tsx`.

```typescript
import { useAdminSSE } from '@/hooks/useAdminSSE'

export function TestimonyManager() {
  const loadTestimonies = useCallback(async () => {
    // existing load logic
  }, [])

  useAdminSSE({
    events: ['new_testimony'],
    onEvent: loadTestimonies,
  })

  // Add live indicator to header
}
```

---

## TASK 7 — Live Updates on Prayer Page

Open `src/components/admin/prayer/PrayerManager.tsx`.

```typescript
import { useAdminSSE } from '@/hooks/useAdminSSE'

export function PrayerManager() {
  const loadRequests = useCallback(async () => {
    // existing load logic
  }, [])

  useAdminSSE({
    events: ['new_prayer'],
    onEvent: loadRequests,
  })

  // Add live indicator to header
}
```

---

## TASK 8 — Live Indicator Component

Create `src/components/admin/shared/LiveIndicator.tsx` to avoid repeating the same markup:

```typescript
'use client'

import { useEffect, useState } from 'react'

interface LiveIndicatorProps {
  label?: string
}

export function LiveIndicator({ label = 'Live' }: LiveIndicatorProps) {
  const [visible, setVisible] = useState(false)

  // Small delay so it doesn't flash on initial render
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: '#22C55E' }}
        title="Live updates active"
      />
      <span className="font-body text-xs font-medium" style={{ color: '#22C55E' }}>
        {label}
      </span>
    </div>
  )
}
```

Use it in each page header:

```typescript
import { LiveIndicator } from '@/components/admin/shared/LiveIndicator'

// In page header:
<div className="flex items-center gap-3">
  <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
    Messages
  </h1>
  <LiveIndicator />
</div>
```

---

## TASK 9 — Toast on New Item (Optional Enhancement)

When a new item arrives while the admin is on the relevant page, show a subtle toast notification:

```typescript
import toast from 'react-hot-toast'

// In each manager, update the onEvent callback:
useAdminSSE({
  events: ['new_message'],
  onEvent: useCallback(async () => {
    await loadThreads()
    toast('New message received', {
      icon: '💬',
      style: {
        background: 'var(--a-surface)',
        color: 'var(--a-text)',
        border: '1px solid rgba(201,168,76,0.3)',
      },
      duration: 3000,
    })
  }, [loadThreads]),
})
```

Apply to each page with the appropriate icon and message:
- Messages: `💬 New message received`
- Members: `👤 New member joined`
- Partner: `💛 New gift received`
- Testimonies: `✨ New testimony submitted`
- Prayer: `🙏 New prayer request`

---

## COMPLETION CHECKLIST

**SSE Extension**
- [ ] `notifySSEClients` accepts and broadcasts event type
- [ ] `createNotification` passes type to `notifySSEClients`
- [ ] SSE payload includes `{ type: 'notification', event: 'new_member', timestamp: ... }`

**Hook**
- [ ] `useAdminSSE` hook created in `src/hooks/useAdminSSE.ts`
- [ ] Hook connects to `/api/admin/notifications/stream`
- [ ] Hook fires `onEvent` only for matching event types
- [ ] Hook auto-reconnects on disconnect (3s retry)
- [ ] Hook cleans up EventSource on unmount

**Live Pages**
- [ ] Messages page refreshes on `new_message`
- [ ] Members page refreshes on `new_member`
- [ ] Partner page refreshes on `new_partner`
- [ ] Testimonies page refreshes on `new_testimony`
- [ ] Prayer page refreshes on `new_prayer`

**UX**
- [ ] Green "Live" indicator shows on each live page
- [ ] Toast notification shows when new item arrives
- [ ] No full page refresh — only the data list updates
- [ ] Existing selected/open items not disrupted by refresh

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `useAdminSSE` hook uses `events.join(',')` as a dependency to avoid infinite re-renders when an array is passed. Arrays are new references on every render — joining to a string creates a stable primitive.
- Each page should only reconnect ONE EventSource, not one per page. The hook manages this — each instance of `useAdminSSE` creates its own connection. If multiple hooks are used on the same page, consider a shared context instead, but for now one per page is fine.
- The `loadThreads`, `loadMembers` etc. callbacks should be wrapped in `useCallback` with stable dependencies to prevent the SSE hook from reconnecting on every render.
- The live refresh should NOT reset any UI state — for example, if an admin has a message thread open on the Messages page, refreshing the thread list should not close the open thread. Make sure the `loadThreads` function only updates the threads list state, not the selected thread state.
- The `LiveIndicator` has a 500ms delay before showing — this prevents it from flashing during server-side rendering or hydration.
- The toast for new items is a nice touch but should be subtle — use a short duration (3s) and don't stack more than 2-3 toasts at once.
- If the admin is NOT on the relevant page, the SSE hook is not mounted so no unnecessary network connections are made. Each hook only exists while its page is mounted.
