# ROOM FOR YOU — Phase 34 Cursor Prompt
## Floating Chat Widget + Live Chat Admin Inbox

---

## CONTEXT

Build a two-part live chat system separate from the existing contact/email threads:

- `/contact` page → stays as formal email threads (existing Messages system — unchanged)
- **New: Floating chat widget** → casual live chat bubble on every public page
- **New: Admin Live Chat inbox** → separate section in admin dashboard

**How it works:**
1. Visitor sees gold chat bubble bottom-right on any public page
2. They enter name + email, then start chatting
3. Messages appear instantly in admin `/admin/live-chat` dashboard
4. Admin replies from dashboard → visitor sees it instantly if still on page, or sees it next time they open the widget
5. Admin gets email notification at `hello@rfyglobal.org` for new chats and first messages

---

## TASK 1 — Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model LiveChatSession {
  id           String            @id @default(cuid())
  name         String
  email        String
  sessionToken String            @unique @default(cuid())
  status       String            @default("active")
  isOnline     Boolean           @default(false)
  lastSeenAt   DateTime          @default(now())
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  messages     LiveChatMessage[]
}

model LiveChatMessage {
  id        String          @id @default(cuid())
  sessionId String
  session   LiveChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  body      String          @db.Text
  fromAdmin Boolean         @default(false)
  isRead    Boolean         @default(false)
  createdAt DateTime        @default(now())
}
```

Run: `npx prisma db push`

---

## TASK 2 — Visitor SSE Stream

Create `src/app/api/chat/stream/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Registry of visitor SSE clients keyed by sessionToken
const visitorClients = new Map<string, Set<(data: string) => void>>()

export function addVisitorSSEClient(
  sessionToken: string,
  send: (data: string) => void
): () => void {
  if (!visitorClients.has(sessionToken)) {
    visitorClients.set(sessionToken, new Set())
  }
  visitorClients.get(sessionToken)!.add(send)
  return () => {
    visitorClients.get(sessionToken)?.delete(send)
    if (visitorClients.get(sessionToken)?.size === 0) {
      visitorClients.delete(sessionToken)
    }
  }
}

export function broadcastToVisitor(sessionToken: string, payload: object): void {
  const clients = visitorClients.get(sessionToken)
  if (!clients || clients.size === 0) return
  const message = `data: ${JSON.stringify(payload)}\n\n`
  clients.forEach(send => {
    try { send(message) } catch {}
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionToken = searchParams.get('token')

  if (!sessionToken) {
    return new Response('Token required', { status: 400 })
  }

  const session = await db.liveChatSession.findUnique({
    where: { sessionToken },
  })
  if (!session) return new Response('Not found', { status: 404 })

  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null
  let keepAlive: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: string) => {
        try { controller.enqueue(encoder.encode(data)) } catch {}
      }

      enqueue('data: {"type":"connected"}\n\n')
      cleanup = addVisitorSSEClient(sessionToken, enqueue)

      keepAlive = setInterval(() => {
        try { enqueue('data: {"type":"ping"}\n\n') } catch {
          if (keepAlive) clearInterval(keepAlive)
          if (cleanup) cleanup()
        }
      }, 25000)

      req.signal.addEventListener('abort', () => {
        if (keepAlive) clearInterval(keepAlive)
        if (cleanup) cleanup()
        try { controller.close() } catch {}
      })
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive)
      if (cleanup) cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
```

---

## TASK 3 — Update notify.ts to broadcast to visitors

Open `src/lib/notify.ts`.

Import `broadcastToVisitor` and update `broadcastSSE` to also notify visitors when a chat reply is sent:

```typescript
// Add import at top:
import { broadcastToVisitor } from '@/app/api/chat/stream/route'

// Update broadcastSSE to handle chat replies:
export function broadcastSSE(payload: Record<string, unknown>): void {
  const message = `data: ${JSON.stringify(payload)}\n\n`
  sseClients.forEach(send => {
    try { send(message) } catch {}
  })

  // Also broadcast to visitor if this is a chat reply
  if (payload.sessionToken && typeof payload.sessionToken === 'string') {
    broadcastToVisitor(payload.sessionToken, payload)
  }
}
```

---

## TASK 4 — Chat API Routes

### Create/resume session
Create `src/app/api/chat/session/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { broadcastSSE } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, sessionToken } = await req.json()

    // Resume existing session
    if (sessionToken) {
      const existing = await db.liveChatSession.findUnique({
        where: { sessionToken },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      if (existing) {
        await db.liveChatSession.update({
          where: { id: existing.id },
          data: { isOnline: true, lastSeenAt: new Date() },
        })
        return NextResponse.json(existing)
      }
    }

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const session = await db.liveChatSession.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        isOnline: true,
      },
      include: { messages: true },
    })

    // Notify admin via SSE
    broadcastSSE({
      type: 'notification',
      event: 'new_chat',
      sessionId: session.id,
      timestamp: Date.now(),
    })

    // Email admin
    await sendEmail({
      to: 'hello@rfyglobal.org',
      subject: `New live chat from ${session.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
          <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">New Live Chat Started</p>
          <p style="font-size:16px;font-weight:bold;margin:0 0 4px;">${session.name}</p>
          <p style="color:#A0A0A0;font-size:13px;margin:0 0 24px;">${session.email}</p>
          <a href="https://rfyglobal.org/admin/live-chat" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:12px 24px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;">Open in Dashboard →</a>
          <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You · rfyglobal.org</p>
        </div>
      `,
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('[chat session]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Visitor messages
Create `src/app/api/chat/[sessionToken]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { broadcastSSE } from '@/lib/notify'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — fetch session messages
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionToken: string } }
) {
  try {
    const session = await db.liveChatSession.findUnique({
      where: { sessionToken: params.sessionToken },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.liveChatSession.update({
      where: { id: session.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    })

    // Mark admin messages as read (visitor has seen them)
    await db.liveChatMessage.updateMany({
      where: { sessionId: session.id, fromAdmin: true, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ ...session, messages: session.messages })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST — visitor sends message
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionToken: string } }
) {
  try {
    const session = await db.liveChatSession.findUnique({
      where: { sessionToken: params.sessionToken },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    await db.liveChatMessage.create({
      data: {
        sessionId: session.id,
        body: body.trim(),
        fromAdmin: false,
        isRead: false,
      },
    })

    await db.liveChatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date(), isOnline: true, lastSeenAt: new Date() },
    })

    // Notify admin
    broadcastSSE({
      type: 'notification',
      event: 'new_chat_message',
      sessionId: session.id,
      timestamp: Date.now(),
    })

    // Email admin on first message only
    const count = await db.liveChatMessage.count({
      where: { sessionId: session.id, fromAdmin: false },
    })
    if (count === 1) {
      await sendEmail({
        to: 'hello@rfyglobal.org',
        subject: `Live chat message from ${session.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
            <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">Live Chat Message</p>
            <p style="font-size:15px;font-weight:bold;margin:0 0 4px;">${session.name} · ${session.email}</p>
            <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:16px;margin:16px 0 24px;">
              <p style="margin:0;color:#F8F8F8;font-size:14px;line-height:1.6;">${body.trim()}</p>
            </div>
            <a href="https://rfyglobal.org/admin/live-chat" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:12px 24px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;">Reply in Dashboard →</a>
          </div>
        `,
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Admin reply
Create `src/app/api/admin/live-chat/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { broadcastSSE } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const chatSession = await db.liveChatSession.findUnique({
      where: { id: params.id },
    })
    if (!chatSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    await db.liveChatMessage.create({
      data: {
        sessionId: chatSession.id,
        body: body.trim(),
        fromAdmin: true,
        isRead: false,
      },
    })

    await db.liveChatSession.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    // Broadcast to visitor's SSE stream via sessionToken
    broadcastSSE({
      type: 'chat_reply',
      event: 'chat_reply',
      sessionId: chatSession.id,
      sessionToken: chatSession.sessionToken,
      timestamp: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin live-chat reply]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Admin get all sessions
Create `src/app/api/admin/live-chat/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sessions = await db.liveChatSession.findMany({
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: { messages: { where: { isRead: false, fromAdmin: false } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Admin get session messages
Create `src/app/api/admin/live-chat/[id]/messages/route.ts`:

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

    const chatSession = await db.liveChatSession.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!chatSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.liveChatMessage.updateMany({
      where: { sessionId: params.id, fromAdmin: false, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json(chatSession)
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## TASK 5 — Floating Chat Widget

Create `src/components/chat/ChatWidget.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface ChatMsg {
  id: string
  body: string
  fromAdmin: boolean
  createdAt: string
}

const SESSION_KEY = 'rfy_chat_session'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'chat'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [starting, setStarting] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async (t: string) => {
    try {
      const res = await fetch(`/api/chat/${t}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
      if (!open) {
        const u = (data.messages ?? []).filter((m: ChatMsg) => m.fromAdmin).length
        setUnread(u)
      }
    } catch {}
  }, [open])

  const connectSSE = useCallback((t: string) => {
    esRef.current?.close()
    const es = new EventSource(`/api/chat/stream?token=${t}`)
    esRef.current = es
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.event === 'chat_reply' || d.event === 'new_chat_message') {
          fetchMessages(t)
        }
      } catch {}
    }
    es.onerror = () => { es.close(); setTimeout(() => connectSSE(t), 3000) }
  }, [fetchMessages])

  // Load existing session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(SESSION_KEY)
    if (!saved) return
    const { sessionToken: t } = JSON.parse(saved)
    if (!t) return

    fetch(`/api/chat/${t}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { localStorage.removeItem(SESSION_KEY); return }
        setToken(t)
        setMessages(data.messages ?? [])
        setStep('chat')
        connectSSE(t)
      })
      .catch(() => {})
  }, [connectSSE])

  useEffect(() => () => { esRef.current?.close() }, [])

  useEffect(() => {
    if (open && token) { setUnread(0); fetchMessages(token) }
  }, [open, token, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const startChat = async () => {
    if (!name.trim() || !email.trim() || starting) return
    setStarting(true)
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      if (!res.ok) return
      const data = await res.json()
      const t = data.sessionToken
      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionToken: t }))
      setToken(t)
      setMessages(data.messages ?? [])
      setStep('chat')
      connectSSE(t)
      setTimeout(() => inputRef.current?.focus(), 150)
    } catch {} finally { setStarting(false) }
  }

  const sendMessage = async () => {
    if (!body.trim() || !token || sending) return
    setSending(true)
    const text = body.trim()
    setBody('')

    // Optimistic
    const temp: ChatMsg = { id: `tmp-${Date.now()}`, body: text, fromAdmin: false, createdAt: new Date().toISOString() }
    setMessages(p => [...p, temp])

    try {
      await fetch(`/api/chat/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      fetchMessages(token)
    } catch {
      setMessages(p => p.filter(m => m.id !== temp.id))
      setBody(text)
    } finally { setSending(false) }
  }

  const fmt = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
        style={{ background: '#C9A84C' }}
        aria-label="Chat with Room For You"
      >
        {open
          ? <X size={20} style={{ color: '#0F0F0F' }} />
          : <MessageCircle size={20} style={{ color: '#0F0F0F' }} />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white"
            style={{ background: '#E53E3E', color: 'white', fontSize: '10px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Window */}
      <div
        className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden"
        style={{
          width: 'min(360px, calc(100vw - 24px))',
          height: '500px',
          background: '#0F0F0F',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1), opacity 0.2s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: '#C9A84C', borderRadius: '16px 16px 0 0' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.15)' }}>
            <MessageCircle size={15} style={{ color: '#0F0F0F' }} />
          </div>
          <div className="flex-1">
            <p style={{ color: '#0F0F0F', fontSize: '13px', fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>
              Room For You
            </p>
            <p style={{ color: 'rgba(0,0,0,0.55)', fontSize: '10px', margin: 0, fontFamily: 'sans-serif' }}>
              We usually reply within a few hours
            </p>
          </div>
          <button onClick={() => setOpen(false)} style={{ color: 'rgba(0,0,0,0.4)', lineHeight: 0 }}>
            <X size={15} />
          </button>
        </div>

        {step === 'form' ? (
          <div className="flex-1 flex flex-col justify-center px-5 py-6 gap-4">
            <div>
              <p style={{ color: '#F8F8F8', fontSize: '15px', fontWeight: 600, marginBottom: '6px', fontFamily: 'sans-serif' }}>
                👋 Hi there!
              </p>
              <p style={{ color: '#A0A0A0', fontSize: '12px', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
                Send us a message and we'll get back to you as soon as possible.
              </p>
            </div>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name" className="w-full outline-none"
              onKeyDown={e => e.key === 'Enter' && document.getElementById('chat-email-input')?.focus()}
              style={{ padding: '10px 14px', background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', color: '#F8F8F8', fontSize: '13px', fontFamily: 'sans-serif' }} />
            <input id="chat-email-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Your email" className="w-full outline-none"
              onKeyDown={e => e.key === 'Enter' && startChat()}
              style={{ padding: '10px 14px', background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', color: '#F8F8F8', fontSize: '13px', fontFamily: 'sans-serif' }} />
            <button onClick={startChat} disabled={starting || !name.trim() || !email.trim()}
              style={{ padding: '12px', background: '#C9A84C', color: '#0F0F0F', borderRadius: '8px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'sans-serif', opacity: (starting || !name.trim() || !email.trim()) ? 0.4 : 1, cursor: 'pointer', border: 'none' }}>
              {starting ? 'Starting…' : 'Start Chat'}
            </button>
            <p style={{ color: '#585858', fontSize: '10px', textAlign: 'center', fontFamily: 'sans-serif' }}>
              Room For You · rfyglobal.org
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="flex justify-start mb-3">
                  <div style={{ maxWidth: '80%', padding: '8px 12px', background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '12px 12px 12px 4px', fontSize: '12px', color: '#F8F8F8', lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                    Hi! How can we help you today? 👋
                  </div>
                </div>
              )}
              {messages.map((msg, i) => {
                const isAdmin = msg.fromAdmin
                const next = messages[i + 1]
                const isLast = !next || next.fromAdmin !== isAdmin
                return (
                  <div key={msg.id}>
                    <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end', marginBottom: '2px' }}>
                      <div style={{
                        maxWidth: '80%', padding: '8px 12px',
                        background: isAdmin ? '#1A1A1A' : '#C9A84C',
                        color: isAdmin ? '#F8F8F8' : '#0F0F0F',
                        border: isAdmin ? '1px solid rgba(201,168,76,0.15)' : 'none',
                        borderRadius: isAdmin ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                        fontSize: '12px', lineHeight: '1.5', fontFamily: 'sans-serif',
                        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                      }}>
                        {msg.body}
                      </div>
                    </div>
                    {isLast && (
                      <p style={{ fontSize: '10px', color: '#585858', textAlign: isAdmin ? 'left' : 'right', marginBottom: '8px', fontFamily: 'sans-serif' }}>
                        {fmt(msg.createdAt)}
                      </p>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-2 px-3 py-3 border-t shrink-0"
              style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
              <input ref={inputRef} value={body} onChange={e => setBody(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Type a message…" className="flex-1 outline-none"
                style={{ padding: '8px 12px', background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '20px', color: '#F8F8F8', fontSize: '12px', fontFamily: 'sans-serif' }} />
              <button onClick={sendMessage} disabled={sending || !body.trim()}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#C9A84C', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || !body.trim()) ? 0.4 : 1, cursor: 'pointer' }}>
                {sending
                  ? <Loader2 size={13} style={{ color: '#0F0F0F', animation: 'spin 1s linear infinite' }} />
                  : <Send size={13} style={{ color: '#0F0F0F' }} />
                }
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
```

---

## TASK 6 — Add Widget to Public Layout

Open `src/app/(public)/layout.tsx`.

Add import and render the widget at the bottom:

```typescript
import { ChatWidget } from '@/components/chat/ChatWidget'

// In the layout JSX, just before the closing tag:
<ChatWidget />
```

---

## TASK 7 — Admin Live Chat Page

Create `src/app/admin/(dashboard)/live-chat/page.tsx`:

```typescript
import { LiveChatManager } from '@/components/admin/live-chat/LiveChatManager'

export default function AdminLiveChatPage() {
  return <LiveChatManager />
}
```

Create `src/components/admin/live-chat/LiveChatManager.tsx` — same split-view iMessage UI as the Messages page but for live chat sessions.

The layout is identical to `MessagesPage` from Phase 33 with these differences:
- Sessions list shows an online/offline green/grey dot per session avatar
- Header shows visitor name, email, and "Online" (green) or "Offline" (grey) status
- Admin replies via `POST /api/admin/live-chat/[id]`
- Session list from `GET /api/admin/live-chat`
- Session messages from `GET /api/admin/live-chat/[id]/messages`
- SSE events to listen for: `new_chat` and `new_chat_message`
- Toast: `💬 New live chat message`

Reuse the same bubble style, date separators, reply textarea, and send button from `MessagesPage`.

---

## TASK 8 — Extend useAdminSSE Types

Open `src/hooks/useAdminSSE.ts`.

Add new event types:

```typescript
type SSEEventType =
  | 'new_prayer'
  | 'new_testimony'
  | 'new_message'
  | 'new_member'
  | 'new_partner'
  | 'new_event_registration'
  | 'new_chat'
  | 'new_chat_message'
  | 'chat_reply'
  | 'notification'
```

---

## TASK 9 — Admin Sidebar + Permissions

Open `src/components/admin/AdminSidebar.tsx`.

Add to the CONTENT nav group (above Messages):

```typescript
{ label: 'Live Chat', href: '/admin/live-chat', icon: MessageCircle },
```

Also add to `AdminMobileDrawer.tsx`.

Open `src/lib/permissions.ts`:
```typescript
'live-chat': ['SUPER_ADMIN', 'ADMIN'],
```

Open `src/middleware.ts`:
```typescript
'/admin/live-chat': ['SUPER_ADMIN', 'ADMIN'],
```

---

## COMPLETION CHECKLIST

**Database**
- [ ] `LiveChatSession` and `LiveChatMessage` models added
- [ ] `npx prisma db push` succeeds

**Widget (public)**
- [ ] Gold chat bubble fixed bottom-right on all public pages
- [ ] Does NOT appear on admin pages
- [ ] Opens/closes with smooth animation
- [ ] Name + email form on first visit
- [ ] After form → chat messages area
- [ ] Enter key sends message
- [ ] Optimistic message (appears instantly before server confirms)
- [ ] Session token saved in localStorage
- [ ] Returning visitor resumes conversation
- [ ] Admin replies appear instantly via SSE
- [ ] Unread badge on bubble when closed and admin replied

**Admin Live Chat**
- [ ] `/admin/live-chat` page loads
- [ ] Split view — sessions left, chat right
- [ ] Green dot = online, grey dot = offline
- [ ] iMessage-style bubbles (gold = admin, surface = visitor)
- [ ] Admin types reply and sends
- [ ] Visitor sees reply instantly
- [ ] Live updates — new sessions/messages appear without refresh
- [ ] Green "Live" indicator
- [ ] Toast on new message

**Email notifications**
- [ ] `hello@rfyglobal.org` gets email when new chat starts
- [ ] Email on first visitor message
- [ ] "Open in Dashboard →" link in email

**Navigation**
- [ ] "Live Chat" in admin sidebar
- [ ] Permissions set

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `localStorage` must only be accessed inside `useEffect` — never during SSR. Always check `typeof window !== 'undefined'` before accessing it.
- The visitor SSE stream uses a query parameter `?token=` rather than a path parameter to avoid Next.js route conflicts with the `[sessionToken]` route.
- The `ChatWidget` is added to the public layout so it appears on every public page automatically. Since admin uses a separate layout, it never appears there.
- The `broadcastToVisitor` function in `notify.ts` uses the `sessionToken` from the SSE payload to find the right visitor client and push the reply to them.
- The online indicator: update `isOnline: true` and `lastSeenAt: new Date()` every time the visitor fetches messages or sends a message. Consider a visitor "offline" if `lastSeenAt` is more than 5 minutes ago.
- The `LiveChatManager` component reuses the same design patterns as `MessagesPage` for consistency — same bubble style, date separators, reply box.
- Run `npx prisma db push` before deploying. Since these are new tables (not modifying existing ones), there will be no data loss warning.
