# ROOM FOR YOU — Phase 29b Cursor Prompt
## Thorough Notification System Fix

---

## CONTEXT

The notification system built in Phase 29 is not working. This prompt does a thorough debug and fix of every layer:

1. `AdminNotification` DB table (may not exist — `db push` may not have run)
2. SSE stream route
3. `notify.ts` helper
4. `AdminTopbar` bell + slide panel
5. Notification API routes (GET, PATCH, DELETE)
6. Trigger wiring (prayer, testimony, member, contact, event registration, partner)

---

## TASK 1 — Verify and Fix Database

The `AdminNotification` table may not exist because `npx prisma db push` was never run successfully.

Run this in the terminal:

```bash
npx prisma db push
```

If it fails due to missing `DATABASE_URL`, set it first:

```bash
$env:DATABASE_URL="postgresql://neondb_owner:npg_3LNKIy5vtUTm@ep-quiet-forest-abnm8j10-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx prisma db push
```

Confirm the `AdminNotification` table exists in the schema:

```prisma
model AdminNotification {
  id        String   @id @default(cuid())
  type      String
  title     String
  body      String?
  link      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

If this model is missing from `prisma/schema.prisma`, add it and run `npx prisma db push`.

---

## TASK 2 — Rewrite notify.ts from Scratch

Replace `src/lib/notify.ts` entirely with this clean implementation:

```typescript
import { db } from './db'

export type NotificationType =
  | 'prayer'
  | 'testimony'
  | 'message'
  | 'member'
  | 'partner'
  | 'event_registration'
  | 'contact'

const NOTIFICATION_CONFIG: Record<NotificationType, { title: string; link: string }> = {
  prayer: { title: 'New Prayer Request', link: '/admin/prayer' },
  testimony: { title: 'New Testimony Submitted', link: '/admin/testimonies' },
  message: { title: 'New Message', link: '/admin/messages' },
  member: { title: 'New Community Member', link: '/admin/members' },
  partner: { title: 'New Partnership Gift', link: '/admin/partner' },
  event_registration: { title: 'New Event Registration', link: '/admin/events' },
  contact: { title: 'New Contact Form Submission', link: '/admin/messages' },
}

const SSE_EVENT_MAP: Record<NotificationType, string> = {
  prayer: 'new_prayer',
  testimony: 'new_testimony',
  message: 'new_message',
  member: 'new_member',
  partner: 'new_partner',
  event_registration: 'new_event_registration',
  contact: 'new_message',
}

// In-memory SSE client registry
type SSESendFn = (data: string) => void
const sseClients = new Set<SSESendFn>()

export function addSSEClient(send: SSESendFn): () => void {
  sseClients.add(send)
  return () => sseClients.delete(send)
}

export function broadcastSSE(payload: Record<string, unknown>): void {
  const message = `data: ${JSON.stringify(payload)}\n\n`
  sseClients.forEach(send => {
    try { send(message) } catch { /* client disconnected */ }
  })
}

export async function createNotification(
  type: NotificationType,
  body?: string
): Promise<void> {
  try {
    const config = NOTIFICATION_CONFIG[type]
    
    await db.adminNotification.create({
      data: {
        type,
        title: config.title,
        body: body ?? null,
        link: config.link,
        isRead: false,
      },
    })

    // Broadcast to all connected SSE clients
    broadcastSSE({
      type: 'notification',
      event: SSE_EVENT_MAP[type],
      notificationType: type,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('[notify] createNotification error:', error)
  }
}

// Deduplicated partner notification (only fires once per payment)
export async function notifyPartnerGiftOnce(
  paymentId: string,
  amount: number,
  name: string
): Promise<void> {
  try {
    // Check if we already notified for this payment
    const existing = await db.adminNotification.findFirst({
      where: {
        type: 'partner',
        body: { contains: paymentId },
      },
    })
    if (existing) return

    await createNotification(
      'partner',
      `${paymentId} — ₦${amount.toLocaleString()} from ${name}`
    )
  } catch (error) {
    console.error('[notify] notifyPartnerGiftOnce error:', error)
  }
}
```

---

## TASK 3 — Rewrite SSE Stream Route

Replace `src/app/api/admin/notifications/stream/route.ts` entirely:

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { addSSEClient } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Auth check
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null
  let keepAliveInterval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          // Controller closed
        }
      }

      // Send initial connected message
      enqueue('data: {"type":"connected"}\n\n')

      // Register this client
      cleanup = addSSEClient(enqueue)

      // Keep-alive ping every 25 seconds
      keepAliveInterval = setInterval(() => {
        try {
          enqueue('data: {"type":"ping"}\n\n')
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval)
          if (cleanup) cleanup()
        }
      }, 25000)

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        if (keepAliveInterval) clearInterval(keepAliveInterval)
        if (cleanup) cleanup()
        try { controller.close() } catch {}
      })
    },
    cancel() {
      if (keepAliveInterval) clearInterval(keepAliveInterval)
      if (cleanup) cleanup()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

---

## TASK 4 — Rewrite Notifications API Route

Replace `src/app/api/admin/notifications/route.ts` entirely:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — fetch all notifications
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await db.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    // Count unread by type
    const unreadByType: Record<string, number> = {}
    notifications.forEach(n => {
      if (!n.isRead) {
        unreadByType[n.type] = (unreadByType[n.type] ?? 0) + 1
      }
    })

    return NextResponse.json({
      notifications,
      total: unreadCount,
      unreadByType,
    })
  } catch (error) {
    console.error('[notifications GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH — mark as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (body.markAllRead) {
      await db.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (body.id) {
      await db.adminNotification.update({
        where: { id: body.id },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[notifications PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE — dismiss a notification
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
    }

    await db.adminNotification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications DELETE]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## TASK 5 — Rewrite AdminTopbar Notification Panel

Replace the notification bell and panel section in `src/components/admin/AdminTopbar.tsx` with a clean, self-contained implementation.

The notification panel must:
- Show a bell icon with a red unread count badge
- Open a slide-in panel from the RIGHT when clicked
- Panel shows "New" section (unread items) and "Earlier" section (read items)
- Each notification shows: emoji icon, title, body, time ago
- Clicking a notification navigates to its link AND marks it as read
- X button dismisses individual notifications
- "Mark all read" button at the top clears all badges
- Backdrop click closes the panel
- SSE connection for real-time updates (no polling)

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import Link from 'next/link'

interface AdminNotification {
  id: string
  type: string
  title: string
  body: string | null
  link: string
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  prayer: '🙏',
  testimony: '✨',
  message: '💬',
  member: '👤',
  partner: '💛',
  event_registration: '📅',
  contact: '📩',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const esRef = useRef<EventSource | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadTotal(data.total ?? 0)
    } catch (e) {
      console.error('[NotificationBell] fetch error', e)
    }
  }, [])

  // Initial fetch + SSE connection
  useEffect(() => {
    fetchNotifications()

    const connect = () => {
      const es = new EventSource('/api/admin/notifications/stream')
      esRef.current = es

      es.onopen = () => console.log('[SSE] connected')

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'notification') {
            fetchNotifications()
          }
        } catch {}
      }

      es.onerror = () => {
        es.close()
        setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
    }
  }, [fetchNotifications])

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadTotal(prev => Math.max(0, prev - 1))
  }

  const dismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadTotal(prev => {
      const n = notifications.find(x => x.id === id)
      return n && !n.isRead ? Math.max(0, prev - 1) : prev
    })
  }

  const unread = notifications.filter(n => !n.isRead)
  const read = notifications.filter(n => n.isRead)

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 flex items-center justify-center border transition-colors"
        style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unreadTotal > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-0.5"
            style={{ background: '#E53E3E', color: 'white', fontSize: '10px', fontFamily: 'Arial' }}
          >
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 'min(400px, 95vw)',
          background: 'var(--a-surface)',
          borderLeft: '1px solid var(--a-border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--a-border)' }}
        >
          <div className="flex items-center gap-2">
            <h2
              className="font-semibold text-base"
              style={{ color: 'var(--a-text)', fontFamily: 'var(--font-display)' }}
            >
              Notifications
            </h2>
            {unreadTotal > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: '#E53E3E', color: 'white' }}
              >
                {unreadTotal} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 px-2 py-1 text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--a-gold)', fontFamily: 'var(--font-body)' }}
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: 'var(--a-text-muted)' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Bell size={28} style={{ color: 'var(--a-text-muted)', opacity: 0.3 }} />
              <p
                className="text-sm"
                style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
              >
                No notifications yet
              </p>
            </div>
          ) : (
            <>
              {/* Unread section */}
              {unread.length > 0 && (
                <>
                  <div
                    className="px-5 py-2"
                    style={{ background: 'var(--a-bg)', borderBottom: '1px solid var(--a-border)' }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
                    >
                      New
                    </p>
                  </div>
                  {unread.map(n => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </>
              )}

              {/* Read section */}
              {read.length > 0 && (
                <>
                  <div
                    className="px-5 py-2"
                    style={{ background: 'var(--a-bg)', borderBottom: '1px solid var(--a-border)', borderTop: unread.length > 0 ? '1px solid var(--a-border)' : 'none' }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
                    >
                      Earlier
                    </p>
                  </div>
                  {read.slice(0, 30).map(n => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function NotifItem({
  n,
  onMarkRead,
  onDismiss,
  onClose,
}: {
  n: AdminNotification
  onMarkRead: (id: string) => void
  onDismiss: (id: string, e: React.MouseEvent) => void
  onClose: () => void
}) {
  return (
    <Link
      href={n.link}
      onClick={() => { onMarkRead(n.id); onClose() }}
      className="flex items-start gap-3 px-5 py-3 border-b group transition-colors"
      style={{
        borderColor: 'var(--a-border)',
        background: n.isRead ? 'transparent' : 'rgba(201,168,76,0.06)',
        display: 'flex',
      }}
    >
      {/* Emoji icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
        style={{ background: 'var(--a-bg)' }}
      >
        {TYPE_ICONS[n.type] ?? '🔔'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p
            className="text-xs font-semibold truncate"
            style={{ color: 'var(--a-text)', fontFamily: 'var(--font-body)' }}
          >
            {n.title}
          </p>
          {!n.isRead && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--a-gold)' }}
            />
          )}
        </div>
        {n.body && (
          <p
            className="text-xs line-clamp-2"
            style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {n.body}
          </p>
        )}
        <p
          className="text-[10px] mt-1"
          style={{ color: 'var(--a-text-muted)', opacity: 0.6, fontFamily: 'var(--font-body)' }}
        >
          {timeAgo(n.createdAt)}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={(e) => onDismiss(n.id, e)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
        style={{ color: 'var(--a-text-muted)' }}
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </Link>
  )
}
```

In `AdminTopbar.tsx`, replace the existing bell implementation with `<NotificationBell />`. Import it from the same file or a separate file at `src/components/admin/NotificationBell.tsx`.

---

## TASK 6 — Verify All Notification Triggers

Check that `createNotification` is called in ALL of these routes. If any are missing, add them:

**`src/app/api/prayer/route.ts`** (POST — new prayer request):
```typescript
import { createNotification } from '@/lib/notify'
// After db.prayerRequest.create succeeds:
await createNotification('prayer', `New prayer request submitted`)
```

**`src/app/api/testimony/route.ts`** (POST — new testimony):
```typescript
await createNotification('testimony', `New testimony submitted`)
```

**`src/app/api/join/route.ts`** (POST — new member):
```typescript
await createNotification('member', `${name} joined the community`)
```

**`src/app/api/contact/route.ts`** (POST — contact form):
```typescript
await createNotification('contact', `New message from ${name}`)
```

**`src/app/api/events/[id]/register/route.ts`** (POST — event registration):
```typescript
await createNotification('event_registration', `New registration for ${event.title}`)
```

**`src/app/api/payments/verify/route.ts`** (POST — payment verified):
```typescript
import { notifyPartnerGiftOnce } from '@/lib/notify'
// After payment.status === 'SUCCESS':
await notifyPartnerGiftOnce(payment.id, payment.amount, payment.name ?? 'Anonymous')
```

---

## TASK 7 — Test the Notification System

After implementing, test in this order:

1. Open `/admin` and click the bell — confirm panel slides from right
2. Submit a prayer request at `/prayer` — bell count should increment immediately
3. Click bell — confirm prayer notification shows under "New"
4. Click the notification — confirm it navigates to `/admin/prayer` and removes the unread dot
5. Click "Mark all read" — confirm all badges clear
6. Dismiss a notification with X — confirm it disappears

---

## COMPLETION CHECKLIST

**Database**
- [ ] `AdminNotification` model in `prisma/schema.prisma`
- [ ] `npx prisma db push` succeeds — table exists in Neon

**notify.ts**
- [ ] `createNotification` saves to DB without throwing
- [ ] `broadcastSSE` sends to all connected clients
- [ ] Error handling — never crashes the request that called it

**SSE Route**
- [ ] `GET /api/admin/notifications/stream` returns `Content-Type: text/event-stream`
- [ ] Sends `{"type":"connected"}` on connect
- [ ] Sends `{"type":"ping"}` every 25 seconds
- [ ] Cleans up on disconnect
- [ ] `X-Accel-Buffering: no` header present

**Notifications API**
- [ ] `GET /api/admin/notifications` returns `{ notifications, total, unreadByType }`
- [ ] `PATCH` with `{ markAllRead: true }` marks all as read
- [ ] `PATCH` with `{ id }` marks one as read
- [ ] `DELETE ?id=` removes one notification

**Notification Bell**
- [ ] Bell shows in AdminTopbar
- [ ] Red badge shows unread count
- [ ] Clicking bell opens slide panel from right
- [ ] Panel slides with CSS transition (no Framer Motion dependency needed)
- [ ] "New" section shows unread items with gold background
- [ ] "Earlier" section shows read items
- [ ] Each item shows emoji, title, body, time ago
- [ ] Clicking item navigates + marks as read
- [ ] X dismisses individual notification
- [ ] "Mark all read" clears all badges
- [ ] Backdrop click closes panel
- [ ] Empty state when no notifications
- [ ] SSE connected — bell updates without refresh

**Triggers**
- [ ] Prayer request → notification fires
- [ ] Testimony → notification fires
- [ ] Member join → notification fires
- [ ] Contact form → notification fires
- [ ] Event registration → notification fires
- [ ] Partner gift → notification fires

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `NotificationBell` component uses CSS `transform` + `transition` instead of Framer Motion — this removes a dependency and is simpler to debug.
- The `timeAgo` function is a simple inline implementation — no `date-fns` import needed, reducing bundle size.
- The `createNotification` function wraps everything in try/catch so a notification failure never breaks the main request (e.g. a failed notification should NOT cause the prayer form submission to return an error).
- The SSE `sseClients` Set is a module-level singleton. In PM2 fork mode (single process), this works correctly. The server has one process, one Set, one set of clients.
- `X-Accel-Buffering: no` is critical for Apache/Nginx not to buffer the SSE stream. Without it, events are held in a buffer and never arrive in real-time.
- After `npx prisma db push`, also restart the PM2 process on the server so it picks up the new DB schema: `pm2 restart rfyglobal`.
- The `NotificationBell` should be placed in `AdminTopbar.tsx` where the bell icon currently is. Remove any old polling logic (`setInterval`, `useEffect` with polling) completely.
