# ROOM FOR YOU — Phase 33 Cursor Prompt
## Messages Page Redesign — iMessage Style + Email Reply Flow + Live Updates

---

## CONTEXT

Redesign the `/admin/messages` page into a fully functional email communication system:

- **Layout:** Split view — threads list on left, active thread on right (like Gmail)
- **Thread style:** iMessage-style clean bubbles with timestamps between messages
- **Reply flow:**
  1. Admin replies via dashboard → email sent to sender's inbox
  2. Sender replies to email → comes back into the dashboard thread via a reply link
  3. Live updates — new messages appear without refresh

---

## HOW EMAIL THREADING WORKS

When admin sends a reply:
- Email is sent to the sender with RFY branding
- The email contains a **"Reply to Room For You"** button → `https://rfyglobal.org/reply/THREAD_TOKEN`
- Sender clicks the link, types their reply in a clean public page
- Reply is saved to the DB and triggers instant notification to admin via SSE

This approach:
- Works reliably with Brevo (no complex inbound email parsing needed)
- Keeps all communication in one thread
- Works for the sender on any device

---

## TASK 1 — Update Prisma Schema

Check `prisma/schema.prisma`. Ensure `MessageThread` has a `replyToken` field and `Message` has `fromAdmin` and `isRead`:

```prisma
model MessageThread {
  id          String    @id @default(cuid())
  subject     String
  fromName    String
  fromEmail   String
  phone       String?
  status      String    @default("open")  // 'open' | 'archived'
  replyToken  String    @unique @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  messages    Message[]
}

model Message {
  id        String        @id @default(cuid())
  threadId  String
  thread    MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  body      String        @db.Text
  fromAdmin Boolean       @default(false)
  isRead    Boolean       @default(false)
  createdAt DateTime      @default(now())
}
```

Run: `npx prisma db push`

After db push, update any existing threads that have no replyToken. Run this in Neon SQL editor:
```sql
UPDATE "MessageThread" SET "replyToken" = gen_random_uuid()::text WHERE "replyToken" IS NULL OR "replyToken" = '';
```

---

## TASK 2 — Public Reply Page

Create `src/app/(public)/reply/[token]/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ReplyForm } from '@/components/reply/ReplyForm'

export const metadata = {
  title: 'Reply — Room For You',
  robots: { index: false },
}

export default async function ReplyPage({
  params,
}: {
  params: { token: string }
}) {
  const thread = await db.messageThread.findUnique({
    where: { replyToken: params.token },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  })

  if (!thread || thread.status === 'archived') notFound()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: '#0F0F0F' }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src="/images/logo-white.png"
            alt="Room For You"
            style={{ height: '48px', width: 'auto' }}
          />
        </div>

        {/* Thread context */}
        <div
          className="mb-6 px-5 py-4 border"
          style={{
            borderColor: 'rgba(201,168,76,0.2)',
            background: 'rgba(201,168,76,0.04)',
          }}
        >
          <p
            className="font-body text-[10px] uppercase tracking-widest mb-2"
            style={{ color: '#C9A84C' }}
          >
            Replying to Room For You
          </p>
          <p
            className="font-body text-sm font-semibold mb-1"
            style={{ color: '#F8F8F8' }}
          >
            {thread.subject}
          </p>
          <p className="font-body text-xs" style={{ color: '#A0A0A0' }}>
            {thread.fromName} · {thread.fromEmail}
          </p>
        </div>

        <ReplyForm token={params.token} fromName={thread.fromName} />
      </div>
    </div>
  )
}
```

Create `src/components/reply/ReplyForm.tsx`:

```typescript
'use client'

import { useState } from 'react'

export function ReplyForm({
  token,
  fromName,
}: {
  token: string
  fromName: string
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!body.trim()) return
    setSending(true)
    setError('')

    try {
      const res = await fetch(`/api/reply/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })

      if (res.ok) {
        setSent(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-12 px-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
        >
          <span style={{ fontSize: '20px' }}>✓</span>
        </div>
        <p
          className="font-display text-xl mb-2"
          style={{ color: '#C9A84C' }}
        >
          Message sent
        </p>
        <p className="font-body text-sm" style={{ color: '#A0A0A0' }}>
          The Room For You team will get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Type your reply here…"
        rows={6}
        className="w-full px-4 py-3 font-body text-sm resize-none border outline-none"
        style={{
          background: '#1A1A1A',
          borderColor: body ? '#C9A84C' : 'rgba(255,255,255,0.1)',
          color: '#F8F8F8',
          lineHeight: '1.6',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
        onBlur={e => (e.target.style.borderColor = body ? '#C9A84C' : 'rgba(255,255,255,0.1)')}
      />

      {error && (
        <p className="font-body text-xs" style={{ color: '#E53E3E' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={sending || !body.trim()}
        className="w-full py-3.5 font-body text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
        style={{ background: '#C9A84C', color: '#0F0F0F' }}
      >
        {sending ? 'Sending…' : 'Send Reply'}
      </button>

      <p
        className="font-body text-xs text-center"
        style={{ color: '#585858' }}
      >
        Room For You · rfyglobal.org
      </p>
    </div>
  )
}
```

---

## TASK 3 — Public Reply API Route

Create `src/app/api/reply/[token]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notify'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const thread = await db.messageThread.findUnique({
      where: { replyToken: params.token },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const body = await req.json()
    const messageBody = body?.body?.trim()

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body required' }, { status: 400 })
    }

    // Save message to DB
    await db.message.create({
      data: {
        threadId: thread.id,
        body: messageBody,
        fromAdmin: false,
        isRead: false,
      },
    })

    // Update thread timestamp
    await db.messageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date(), status: 'open' },
    })

    // Notify admin via SSE + DB
    await createNotification(
      'message',
      `${thread.fromName} replied: "${messageBody.slice(0, 80)}${messageBody.length > 80 ? '…' : ''}"`
    )

    // Send notification email to admin
    await sendEmail({
      to: 'hello@rfyglobal.org',
      subject: `Re: ${thread.subject} — reply from ${thread.fromName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
          <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 20px;">New Reply Received</p>
          <p style="font-size:16px;font-weight:bold;margin:0 0 4px;color:#F8F8F8;">${thread.subject}</p>
          <p style="color:#A0A0A0;font-size:13px;margin:0 0 20px;">From: ${thread.fromName} &lt;${thread.fromEmail}&gt;</p>
          <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0;line-height:1.7;color:#F8F8F8;font-size:14px;">${messageBody.replace(/\n/g, '<br>')}</p>
          </div>
          <a href="https://rfyglobal.org/admin/messages" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:12px 24px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;">View in Dashboard →</a>
          <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You · rfyglobal.org</p>
        </div>
      `,
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[reply POST]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## TASK 4 — Admin Reply API

Update `src/app/api/admin/messages/[id]/route.ts`.

Add or update the POST handler for admin replies:

```typescript
import { broadcastSSE } from '@/lib/notify'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const thread = await db.messageThread.findUnique({
      where: { id: params.id },
    })
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const messageBody = body?.body?.trim()
    if (!messageBody) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    // Save admin message
    const message = await db.message.create({
      data: {
        threadId: thread.id,
        body: messageBody,
        fromAdmin: true,
        isRead: true,
      },
    })

    await db.messageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    })

    // Reply URL for the sender
    const replyUrl = `https://rfyglobal.org/reply/${thread.replyToken}`

    // Send email to sender
    await sendEmail({
      to: thread.fromEmail,
      subject: `Re: ${thread.subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0F0F;color:#F8F8F8;padding:0;">
          <!-- Header -->
          <div style="background:#0F0F0F;padding:32px 32px 0;border-top:3px solid #C9A84C;">
            <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;width:auto;display:block;margin:0 0 28px;" />
          </div>
          <!-- Body -->
          <div style="padding:0 32px 32px;">
            <p style="font-size:15px;margin:0 0 8px;color:#F8F8F8;">Hi ${thread.fromName},</p>
            <p style="font-size:13px;color:#A0A0A0;margin:0 0 20px;">A message from the Room For You team:</p>
            <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:20px;margin:0 0 28px;">
              <p style="margin:0;line-height:1.8;color:#F8F8F8;font-size:14px;">${messageBody.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="font-size:13px;color:#A0A0A0;margin:0 0 20px;">
              Want to reply? Click the button below:
            </p>
            <a href="${replyUrl}" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:14px 28px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">
              Reply to Room For You →
            </a>
            <p style="font-size:11px;color:#585858;margin:8px 0 0;">
              Or paste this link in your browser: ${replyUrl}
            </p>
          </div>
          <!-- Footer -->
          <div style="padding:20px 32px;border-top:1px solid #2A2A2A;">
            <p style="font-size:11px;color:#585858;margin:0;text-align:center;">
              Room For You · rfyglobal.org · Jesus to Nations
            </p>
          </div>
        </div>
      `,
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
      replyTo: 'hello@rfyglobal.org',
    })

    // Broadcast SSE so open thread updates live
    broadcastSSE({
      type: 'notification',
      event: 'new_message',
      threadId: thread.id,
      timestamp: Date.now(),
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('[admin messages POST]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## TASK 5 — Thread Messages API

Create `src/app/api/admin/messages/[id]/messages/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const thread = await db.messageThread.findUnique({
      where: { id: params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Mark unread messages as read
    await db.message.updateMany({
      where: { threadId: params.id, isRead: false, fromAdmin: false },
      data: { isRead: true },
    })

    return NextResponse.json(thread)
  } catch (error) {
    console.error('[thread messages GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## TASK 6 — Threads List API

Update `src/app/api/admin/messages/route.ts` GET handler:

```typescript
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const threads = await db.messageThread.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { isRead: false, fromAdmin: false } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(threads)
  } catch (error) {
    console.error('[messages GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## TASK 7 — Messages Page UI

Create `src/components/admin/messaging/MessagesPage.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Mail, Send, X, Archive, RotateCcw } from 'lucide-react'
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { LiveIndicator } from '@/components/admin/shared/LiveIndicator'
import toast from 'react-hot-toast'

interface Message {
  id: string
  body: string
  fromAdmin: boolean
  isRead: boolean
  createdAt: string
}

interface Thread {
  id: string
  subject: string
  fromName: string
  fromEmail: string
  status: string
  updatedAt: string
  messages: Message[]
  _count: { messages: number }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = []
  let current = ''
  messages.forEach(msg => {
    const d = new Date(msg.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    if (label !== current) {
      current = label
      groups.push({ label, messages: [msg] })
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  })
  return groups
}

export function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<(Thread & { messages: Message[] }) | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'open' | 'archived' | 'all'>('open')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/messages?status=${filter}`)
      if (res.ok) setThreads(await res.json())
    } catch {}
  }, [filter])

  useEffect(() => { loadThreads() }, [loadThreads])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread?.messages?.length])

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/admin/messages/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setActiveThread(data)
        setThreads(prev => prev.map(t => t.id === id ? { ...t, _count: { messages: 0 } } : t))
      }
    } finally {
      setLoadingThread(false)
    }
  }, [])

  // Live updates
  useAdminSSE({
    events: ['new_message'],
    onEvent: useCallback(async () => {
      await loadThreads()
      if (activeThread) await loadThread(activeThread.id)
      toast('💬 New message', {
        style: { background: 'var(--a-surface)', color: 'var(--a-text)', border: '1px solid rgba(201,168,76,0.3)' },
        duration: 3000,
      })
    }, [loadThreads, activeThread, loadThread]),
  })

  const sendReply = async () => {
    if (!activeThread || !replyBody.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/messages/${activeThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      if (res.ok) {
        setReplyBody('')
        await loadThread(activeThread.id)
      } else {
        toast.error('Failed to send reply')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const filtered = threads.filter(t =>
    !search ||
    t.fromName.toLowerCase().includes(search.toLowerCase()) ||
    t.fromEmail.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  )

  const groups = activeThread ? groupByDate(activeThread.messages) : []

  return (
    <div
      className="flex border overflow-hidden"
      style={{
        borderColor: 'var(--a-border)',
        height: 'calc(100vh - 80px)',
        background: 'var(--a-bg)',
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        className="w-72 xl:w-80 shrink-0 flex flex-col border-r"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: 'var(--a-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display text-base font-semibold flex-1"
              style={{ color: 'var(--a-text)' }}>
              Messages
            </span>
            <LiveIndicator />
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--a-text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 font-body text-xs border outline-none"
              style={{
                background: 'var(--a-bg)',
                borderColor: 'var(--a-border)',
                color: 'var(--a-text)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
              onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {(['open', 'archived', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-1 py-1.5 font-body text-[10px] uppercase tracking-widest capitalize transition-all"
                style={{
                  background: filter === f ? 'var(--a-gold)' : 'transparent',
                  color: filter === f ? '#0F0F0F' : 'var(--a-text-muted)',
                  border: `1px solid ${filter === f ? 'var(--a-gold)' : 'var(--a-border)'}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Mail size={20} style={{ color: 'var(--a-text-muted)', opacity: 0.3 }} />
              <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                No messages
              </p>
            </div>
          ) : filtered.map(thread => {
            const isActive = activeThread?.id === thread.id
            const hasUnread = thread._count.messages > 0
            const preview = thread.messages[0]

            return (
              <button
                key={thread.id}
                onClick={() => loadThread(thread.id)}
                className="w-full text-left px-4 py-3 border-b transition-colors"
                style={{
                  borderColor: 'var(--a-border)',
                  background: isActive ? 'var(--a-gold-light)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--a-gold)' : 'transparent'}`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5"
                    style={{ background: 'var(--a-bg)', color: 'var(--a-gold)' }}
                  >
                    {thread.fromName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1 mb-0.5">
                      <p
                        className="text-xs truncate"
                        style={{
                          color: 'var(--a-text)',
                          fontFamily: 'var(--font-body)',
                          fontWeight: hasUnread ? 700 : 500,
                        }}
                      >
                        {thread.fromName}
                      </p>
                      <span className="font-body text-[10px] shrink-0"
                        style={{ color: 'var(--a-text-muted)' }}>
                        {timeAgo(thread.updatedAt)}
                      </span>
                    </div>
                    <p
                      className="font-body text-[11px] truncate mb-0.5"
                      style={{ color: hasUnread ? 'var(--a-text)' : 'var(--a-text-muted)', fontWeight: hasUnread ? 600 : 400 }}
                    >
                      {thread.subject}
                    </p>
                    {preview && (
                      <p className="font-body text-[11px] truncate"
                        style={{ color: 'var(--a-text-muted)' }}>
                        {preview.fromAdmin ? 'You: ' : ''}{preview.body}
                      </p>
                    )}
                  </div>

                  {hasUnread && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ background: 'var(--a-gold)' }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeThread ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Mail size={36} style={{ color: 'var(--a-text-muted)' }} />
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Select a conversation
            </p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div
              className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
              style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
                style={{ background: 'var(--a-bg)', color: 'var(--a-gold)' }}
              >
                {activeThread.fromName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold truncate"
                  style={{ color: 'var(--a-text)' }}>
                  {activeThread.fromName}
                </p>
                <p className="font-body text-xs truncate"
                  style={{ color: 'var(--a-text-muted)' }}>
                  {activeThread.fromEmail} · {activeThread.subject}
                </p>
              </div>
              <button
                onClick={() => setActiveThread(null)}
                className="w-8 h-8 flex items-center justify-center ml-auto"
                style={{ color: 'var(--a-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {loadingThread ? (
                <div className="flex justify-center py-12">
                  <div
                    className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
                  />
                </div>
              ) : groups.length === 0 ? (
                <p className="text-center font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                  No messages yet
                </p>
              ) : (
                groups.map(group => (
                  <div key={group.label} className="mb-6">
                    {/* Date separator */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px" style={{ background: 'var(--a-border)' }} />
                      <span
                        className="font-body text-[10px] uppercase tracking-widest px-2 shrink-0"
                        style={{ color: 'var(--a-text-muted)' }}
                      >
                        {group.label}
                      </span>
                      <div className="flex-1 h-px" style={{ background: 'var(--a-border)' }} />
                    </div>

                    {/* Bubbles */}
                    <div className="space-y-1">
                      {group.messages.map((msg, i) => {
                        const isAdmin = msg.fromAdmin
                        const next = group.messages[i + 1]
                        const isLast = !next || next.fromAdmin !== msg.fromAdmin

                        return (
                          <div key={msg.id}>
                            <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className="max-w-[68%] px-4 py-2.5"
                                style={{
                                  background: isAdmin ? '#C9A84C' : 'var(--a-surface)',
                                  color: isAdmin ? '#0F0F0F' : 'var(--a-text)',
                                  border: isAdmin ? 'none' : '1px solid var(--a-border)',
                                  borderRadius: isAdmin
                                    ? '18px 18px 4px 18px'
                                    : '18px 18px 18px 4px',
                                  fontSize: '13px',
                                  lineHeight: '1.6',
                                  fontFamily: 'var(--font-body)',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {msg.body}
                              </div>
                            </div>
                            {isLast && (
                              <p
                                className={`font-body text-[10px] mt-1 mb-2 ${isAdmin ? 'text-right' : 'text-left'}`}
                                style={{ color: 'var(--a-text-muted)' }}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {isAdmin ? ' · Sent' : ''}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div
              className="px-6 py-4 border-t shrink-0"
              style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
            >
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply()
                  }}
                  placeholder="Reply to this message…"
                  rows={3}
                  className="flex-1 px-4 py-3 font-body text-sm resize-none border outline-none"
                  style={{
                    background: 'var(--a-bg)',
                    borderColor: 'var(--a-border)',
                    color: 'var(--a-text)',
                    borderRadius: '12px',
                    lineHeight: '1.5',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !replyBody.trim()}
                  className="w-11 h-11 flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                  style={{ background: 'var(--a-gold)', color: '#0F0F0F', borderRadius: '50%' }}
                  title="Send (Cmd+Enter)"
                >
                  {sending ? (
                    <div
                      className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#0F0F0F' }}
                    />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
              <p className="font-body text-[10px] mt-2" style={{ color: 'var(--a-text-muted)' }}>
                ⌘+Enter to send · Reply goes to {activeThread.fromEmail}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## TASK 8 — Update Messages Admin Page

Replace `src/app/admin/(dashboard)/messages/page.tsx`:

```typescript
import { MessagesPage } from '@/components/admin/messaging/MessagesPage'

export default function AdminMessagesPage() {
  return <MessagesPage />
}
```

---

## TASK 9 — Update Contact Form to Create Message Thread

Open `src/app/api/contact/route.ts`.

Ensure the contact form creates a proper `MessageThread` with the first `Message`:

```typescript
// Replace existing message/thread creation with:
await db.messageThread.create({
  data: {
    subject: subject?.trim() || `Message from ${name}`,
    fromName: name.trim(),
    fromEmail: email.trim(),
    phone: phone ?? null,
    status: 'open',
    messages: {
      create: {
        body: message.trim(),
        fromAdmin: false,
        isRead: false,
      },
    },
  },
})

await createNotification('contact', `${name}: "${message.trim().slice(0, 80)}…"`)
```

---

## COMPLETION CHECKLIST

**Database**
- [ ] `MessageThread.replyToken` field exists and is unique
- [ ] `Message.fromAdmin` and `Message.isRead` fields exist
- [ ] `npx prisma db push` succeeds
- [ ] Existing threads have replyToken set (SQL update if needed)

**Public reply flow**
- [ ] `/reply/[token]` page loads with dark RFY branding
- [ ] ReplyForm submits to `/api/reply/[token]`
- [ ] Reply saved to DB as `fromAdmin: false`
- [ ] Admin notified via SSE + email
- [ ] Success state shows after sending

**Admin reply flow**
- [ ] `POST /api/admin/messages/[id]` saves message as `fromAdmin: true`
- [ ] Email sent to sender with reply link button
- [ ] SSE broadcasts `new_message` after send

**Messages UI**
- [ ] Split view loads — left thread list, right empty state
- [ ] Clicking thread loads messages
- [ ] iMessage bubbles — gold on right (admin), surface on left (sender)
- [ ] Date separators: Today, Yesterday, full date
- [ ] Timestamps below each bubble group
- [ ] Auto-scrolls to bottom on load and new message
- [ ] Search filters thread list
- [ ] Open / Archived / All tabs work
- [ ] Reply textarea with send button
- [ ] Cmd+Enter sends reply
- [ ] Live updates — new reply appears without refresh
- [ ] Green "Live" indicator in header
- [ ] Toast on new message arrival
- [ ] Unread gold dot on thread list items
- [ ] Thread marked read when opened

**Build**
- [ ] `npm run build` passes
