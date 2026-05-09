# ROOM FOR YOU — Phase 29 Cursor Prompt
## Partnership Page Fix · Real-Time SSE Notifications · Notification Slide Panel Redesign

---

## CONTEXT

Four improvements:

1. **Partnership page fix** — SUPER_ADMIN gets "You don't have access" error on `/admin/partnership`
2. **Real-time notifications** — Replace 30-second polling with Server-Sent Events (SSE) for instant push
3. **Notification slide panel** — Full redesign: slides from right, grouped by type, mark all read, individual dismiss
4. **Notification persistence** — Store notifications in DB so they persist across sessions

---

## TASK 1 — Fix Partnership Page Access

Open `src/lib/permissions.ts`.

Find the permissions for `partnership` and ensure `SUPER_ADMIN` and `ADMIN` both have access:

```typescript
// Find the partnership permission and ensure it includes SUPER_ADMIN:
partnership: ['SUPER_ADMIN', 'ADMIN'],
```

Also check `src/middleware.ts` — find the route mapping for `/admin/partnership` and ensure it's not restricted:

```typescript
// Ensure this route is accessible to SUPER_ADMIN and ADMIN:
'/admin/partnership': ['SUPER_ADMIN', 'ADMIN'],
```

Also check `src/app/admin/(dashboard)/partnership/page.tsx` — if it has a permission check, ensure it allows SUPER_ADMIN:

```typescript
// If there's a permission check like:
if (!checkPermission(session.user.role, 'partnership')) {
  redirect('/admin')
}
// Ensure checkPermission returns true for SUPER_ADMIN on 'partnership'
```

---

## TASK 2 — Notification Model in Prisma

Add a persistent notification model to `prisma/schema.prisma`:

```prisma
model AdminNotification {
  id          String    @id @default(cuid())
  type        String    // 'prayer' | 'testimony' | 'message' | 'member' | 'partner' | 'event_registration' | 'contact'
  title       String
  body        String?
  link        String    // e.g. '/admin/prayer'
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())
}
```

Run: `npx prisma db push`

---

## TASK 3 — Notification Helper

Create `src/lib/notify.ts`:

```typescript
import { db } from './db'

type NotificationType =
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
  partner: { title: 'New Partnership Gift', link: '/admin/partnership' },
  event_registration: { title: 'New Event Registration', link: '/admin/events' },
  contact: { title: 'New Contact Form Submission', link: '/admin/messages' },
}

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

  // Emit SSE event to all connected admin clients
  notifySSEClients()
}

// SSE client registry
const sseClients = new Set<(data: string) => void>()

export function addSSEClient(send: (data: string) => void) {
  sseClients.add(send)
  return () => sseClients.delete(send)
}

export function notifySSEClients() {
  const message = `data: ${JSON.stringify({ type: 'notification' })}\n\n`
  sseClients.forEach(send => {
    try { send(message) } catch {}
  })
}
```

---

## TASK 4 — SSE API Route

Create `src/app/api/admin/notifications/stream/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { addSSEClient } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      // Register this client
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {}
      }

      const cleanup = addSSEClient(send)

      // Keep alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
        } catch {
          clearInterval(keepAlive)
          cleanup()
        }
      }, 30000)

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        cleanup()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
```

---

## TASK 5 — Update Notifications GET API

Update `src/app/api/admin/notifications/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [notifications, counts] = await Promise.all([
    // Latest 50 notifications
    db.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    // Unread counts by type
    db.adminNotification.groupBy({
      by: ['type'],
      where: { isRead: false },
      _count: true,
    }),
  ])

  const unreadByType = counts.reduce((acc, c) => {
    acc[c.type] = c._count
    return acc
  }, {} as Record<string, number>)

  const total = Object.values(unreadByType).reduce((a, b) => a + b, 0)

  return NextResponse.json({ notifications, unreadByType, total })
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
}

// Delete a notification
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'No ID' }, { status: 400 })

  await db.adminNotification.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

---

## TASK 6 — Wire createNotification to All Events

Add `createNotification()` calls wherever the relevant events happen:

**New prayer request** — `src/app/api/prayer/route.ts`:
```typescript
import { createNotification } from '@/lib/notify'
// After db.prayerRequest.create:
await createNotification('prayer', `Subject: ${subject}`)
```

**New testimony** — `src/app/api/testimony/route.ts`:
```typescript
await createNotification('testimony', `"${title}" submitted`)
```

**New community member** — `src/app/api/join/route.ts`:
```typescript
await createNotification('member', `${name} joined from ${country}`)
```

**New contact message** — `src/app/api/contact/route.ts`:
```typescript
await createNotification('contact', `From ${name}: ${subject}`)
```

**New event registration** — `src/app/api/events/[id]/register/route.ts`:
```typescript
await createNotification('event_registration', `New registration for ${event.title}`)
```

**New incoming message thread** — `src/app/api/admin/messages/route.ts` (when `fromAdmin: false`):
```typescript
await createNotification('message', `New message from ${recipientName ?? recipientEmail}`)
```

**New partner gift** — `src/app/api/payments/verify/route.ts` and webhook routes:
```typescript
await createNotification('partner', `₦${amount.toLocaleString()} gift received`)
```

---

## TASK 7 — Redesign Notification Panel in AdminTopbar

Open `src/components/admin/AdminTopbar.tsx`.

Replace the existing notification bell + dropdown with a new slide-in panel approach:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, ArrowRight, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
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

const TYPE_LABELS: Record<string, string> = {
  prayer: 'Prayer',
  testimony: 'Testimony',
  message: 'Message',
  member: 'Member',
  partner: 'Partner',
  event_registration: 'Event',
  contact: 'Contact',
}

export function AdminTopbar() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadTotal(data.total ?? 0)
      }
    } catch {}
  }

  // Connect to SSE stream
  useEffect(() => {
    fetchNotifications()

    const es = new EventSource('/api/admin/notifications/stream')
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'notification') {
          fetchNotifications()
        }
      } catch {}
    }

    es.onerror = () => {
      // SSE will auto-reconnect
    }

    return () => {
      es.close()
    }
  }, [])

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    await fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadTotal(prev => Math.max(0, prev - 1))
  }

  const dismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
    await fetchNotifications()
  }

  // Group notifications by type
  const grouped = notifications.reduce((acc, n) => {
    if (!acc[n.type]) acc[n.type] = []
    acc[n.type].push(n)
    return acc
  }, {} as Record<string, Notification[]>)

  const unread = notifications.filter(n => !n.isRead)
  const read = notifications.filter(n => n.isRead)

  return (
    <>
      {/* Existing topbar content — keep unchanged */}
      {/* Add bell button: */}
      <div className="relative">
        <button
          onClick={() => setPanelOpen(true)}
          className="relative w-9 h-9 flex items-center justify-center border transition-all"
          style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
        >
          <Bell size={15} />
          {unreadTotal > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-body font-bold px-1"
              style={{ background: '#E53E3E', color: 'white', fontSize: '10px' }}
            >
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </button>
      </div>

      {/* Notification slide panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
              style={{
                width: 'min(420px, 95vw)',
                background: 'var(--a-surface)',
                borderLeft: '1px solid var(--a-border)',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--a-border)' }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-lg font-semibold"
                    style={{ color: 'var(--a-text)' }}>
                    Notifications
                  </h2>
                  {unreadTotal > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full font-body text-xs font-bold"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 font-body text-xs transition-all"
                      style={{ color: 'var(--a-gold)' }}
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="w-8 h-8 flex items-center justify-center transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Bell size={32} style={{ color: 'var(--a-text-muted)', opacity: 0.4 }} />
                    <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Unread section */}
                    {unread.length > 0 && (
                      <div>
                        <div className="px-5 py-2 border-b"
                          style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>
                          <p className="font-body text-[10px] uppercase tracking-widest font-semibold"
                            style={{ color: 'var(--a-text-muted)' }}>
                            New
                          </p>
                        </div>
                        {unread.map(n => (
                          <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={markRead}
                            onDismiss={dismiss}
                            onNavigate={() => setPanelOpen(false)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Read section */}
                    {read.length > 0 && (
                      <div>
                        <div className="px-5 py-2 border-b border-t"
                          style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>
                          <p className="font-body text-[10px] uppercase tracking-widest font-semibold"
                            style={{ color: 'var(--a-text-muted)' }}>
                            Earlier
                          </p>
                        </div>
                        {read.slice(0, 20).map(n => (
                          <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={markRead}
                            onDismiss={dismiss}
                            onNavigate={() => setPanelOpen(false)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Notification item sub-component
function NotificationItem({
  notification: n,
  onMarkRead,
  onDismiss,
  onNavigate,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDismiss: (id: string, e: React.MouseEvent) => void
  onNavigate: () => void
}) {
  return (
    <Link
      href={n.link}
      onClick={() => { onMarkRead(n.id); onNavigate() }}
      className="flex items-start gap-3 px-5 py-4 border-b group transition-all"
      style={{
        borderColor: 'var(--a-border)',
        background: n.isRead ? 'transparent' : 'var(--a-gold-light)',
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
        style={{ background: 'var(--a-bg)' }}
      >
        {TYPE_ICONS[n.type] ?? '🔔'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-body text-xs font-semibold"
            style={{ color: 'var(--a-text)' }}>
            {n.title}
          </p>
          {!n.isRead && (
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{ background: 'var(--a-gold)' }} />
          )}
        </div>
        {n.body && (
          <p className="font-body text-xs line-clamp-2"
            style={{ color: 'var(--a-text-muted)' }}>
            {n.body}
          </p>
        )}
        <p className="font-body text-[10px] mt-1"
          style={{ color: 'var(--a-text-muted)', opacity: 0.7 }}>
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight size={13} style={{ color: 'var(--a-text-muted)' }} />
        <button
          onClick={(e) => onDismiss(n.id, e)}
          className="p-1 transition-colors"
          style={{ color: 'var(--a-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
        >
          <X size={13} />
        </button>
      </div>
    </Link>
  )
}
```

---

## TASK 8 — Add Partnership Notification

Open the partnership/payment success flow and add:

```typescript
import { createNotification } from '@/lib/notify'

// After successful payment verification:
await createNotification('partner', `₦${(amount / 100).toLocaleString()} gift from ${name}`)
```

---

## COMPLETION CHECKLIST

**Partnership Fix**
- [ ] SUPER_ADMIN can access `/admin/partnership` without error
- [ ] Permission check updated in `permissions.ts` and/or `middleware.ts`

**Database**
- [ ] `AdminNotification` model added to schema
- [ ] `npx prisma db push` succeeds

**Real-time SSE**
- [ ] `src/lib/notify.ts` created with SSE client registry
- [ ] `GET /api/admin/notifications/stream` returns SSE stream
- [ ] Admin topbar connects to SSE on mount
- [ ] New notification triggers instant bell update without refresh

**Notification Triggers**
- [ ] Prayer request → notification created
- [ ] Testimony submission → notification created
- [ ] New member join → notification created
- [ ] Contact form submission → notification created
- [ ] Event registration → notification created
- [ ] Partner gift → notification created

**Notification Panel**
- [ ] Bell click opens slide-in panel from right
- [ ] Panel shows unread count badge on bell
- [ ] "New" section shows unread notifications
- [ ] "Earlier" section shows read notifications
- [ ] Each item shows icon, title, body, time ago
- [ ] Clicking item navigates to relevant page + marks as read
- [ ] Individual dismiss (X) removes notification
- [ ] "Mark all read" clears all unread badges
- [ ] Panel closes on backdrop click or X button
- [ ] Empty state shows when no notifications

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- SSE (Server-Sent Events) uses a persistent HTTP connection. The `ReadableStream` in the route handler stays open until the client disconnects. The `req.signal` `abort` event fires when the browser closes the connection.
- The `sseClients` Set in `src/lib/notify.ts` is a module-level singleton — it persists for the lifetime of the Node.js process. This works correctly with PM2 in fork mode (single process). If running in cluster mode, you'd need Redis pub/sub instead.
- `X-Accel-Buffering: no` header is required to prevent nginx/Apache from buffering the SSE stream. Without it, events won't arrive in real-time.
- The `EventSource` API in the browser automatically reconnects if the connection drops. This means the admin will always be connected without any manual reconnect logic.
- The `AdminNotification` table grows over time. Consider adding a cleanup cron that deletes notifications older than 30 days. This can be added to the existing cron infrastructure.
- `formatDistanceToNow` from `date-fns` shows "2 minutes ago", "1 hour ago" etc. This is already installed in the project.
- The partnership page access error is likely a missing permission entry — `SUPER_ADMIN` should always have access to everything. Check if there's a hardcoded role check that accidentally excludes SUPER_ADMIN.
