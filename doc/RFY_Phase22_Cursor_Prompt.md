# ROOM FOR YOU — Phase 22 Cursor Prompt
## Prayer Wall · Testimony System · Admin Messaging

---

## CONTEXT

Phase 22 adds three major community features:

1. **Prayer Wall** — Private prayer request submission. Members only (email verified against CommunityMember). Anonymous option. Admin sees all requests, marks as prayed, optionally replies via email.

2. **Testimony System** — Public submission of text/image/video testimonies. Admin approves and selects featured ones. Public masonry grid page at `/testimonies`.

3. **Admin Messaging** — WhatsApp-style chat threads per contact. Admin can message individuals, groups, or form entry lists.

4. **Admin Notifications** — Bell icon in topbar showing unread counts for new prayer requests, testimonies, and messages.

---

## TASK 1 — Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
// ── PRAYER REQUESTS ──────────────────────────────────────────

model PrayerRequest {
  id          String              @id @default(cuid())
  email       String
  name        String?             // null if anonymous
  isAnonymous Boolean             @default(false)
  subject     String
  body        String              @db.Text
  status      PrayerRequestStatus @default(PENDING)
  adminNote   String?             @db.Text
  prayedAt    DateTime?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

enum PrayerRequestStatus {
  PENDING
  PRAYED
  REPLIED
}

// ── TESTIMONIES ───────────────────────────────────────────────

model Testimony {
  id          String          @id @default(cuid())
  email       String
  name        String?
  isAnonymous Boolean         @default(false)
  title       String
  body        String?         @db.Text
  imageUrls   Json?           // string[]
  videoUrl    String?         // YouTube/Vimeo or uploaded video URL
  status      TestimonyStatus @default(PENDING)
  isFeatured  Boolean         @default(false)
  adminNote   String?
  publishedAt DateTime?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

enum TestimonyStatus {
  PENDING
  APPROVED
  REJECTED
}

// ── MESSAGING ─────────────────────────────────────────────────

model MessageThread {
  id          String    @id @default(cuid())
  // Recipient info
  recipientEmail String
  recipientName  String?
  // Thread metadata
  subject     String?
  lastMessage String?   @db.Text
  lastAt      DateTime  @default(now())
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())
  messages    Message[]
}

model Message {
  id        String        @id @default(cuid())
  threadId  String
  thread    MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  fromAdmin Boolean       @default(true)  // true = sent by admin, false = received
  body      String        @db.Text
  sentAt    DateTime      @default(now())
  isRead    Boolean       @default(false)
}
```

Run: `npx prisma db push`

---

## TASK 2 — Prayer Request API Routes

#### `src/app/api/prayer/route.ts` — Submit prayer request (public)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'

export const runtime = 'nodejs'

const PrayerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(2000),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`prayer:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = PrayerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, name, isAnonymous, subject, body: prayerBody } = parsed.data

  // Verify email is a community member
  const member = await db.communityMember.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true },
  })

  if (!member) {
    return NextResponse.json({
      error: 'You need to be a member of the Room For You community to submit a prayer request.',
      notMember: true,
    }, { status: 403 })
  }

  const request = await db.prayerRequest.create({
    data: {
      email: email.toLowerCase().trim(),
      name: isAnonymous ? null : (name || member.name),
      isAnonymous,
      subject,
      body: prayerBody,
    },
  })

  return NextResponse.json({ success: true, id: request.id }, { status: 201 })
}
```

#### `src/app/api/admin/prayer/route.ts` — Admin: list all

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // PENDING, PRAYED, REPLIED
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const where = status ? { status: status as any } : {}

  const [requests, total] = await Promise.all([
    db.prayerRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.prayerRequest.count({ where }),
  ])

  return NextResponse.json({ requests, total })
}
```

#### `src/app/api/admin/prayer/[id]/route.ts` — Admin: update + reply

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, adminNote, sendReply, replyMessage } = body

  const updateData: Record<string, unknown> = {}
  if (status) updateData.status = status
  if (adminNote !== undefined) updateData.adminNote = adminNote
  if (status === 'PRAYED') updateData.prayedAt = new Date()
  if (status === 'REPLIED') updateData.status = 'REPLIED'

  const request = await db.prayerRequest.update({
    where: { id: params.id },
    data: updateData,
  })

  // Send reply email if requested
  if (sendReply && replyMessage && request.email) {
    const displayName = request.isAnonymous ? 'Friend' : (request.name || 'Friend')
    await sendEmail({
      to: request.email,
      subject: `Re: Your Prayer Request — ${request.subject}`,
      html: `
        <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Prayer Team
          </p>
          <h2 style="color:#F8F8F8;font-size:24px;margin:0 0 24px;">
            We prayed for you, ${displayName}.
          </h2>
          <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:0 0 24px;"></div>
          <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0 0 24px;">
            ${replyMessage.replace(/\n/g, '<br>')}
          </p>
          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:24px 0;"></div>
          <p style="color:#585858;font-size:12px;text-align:center;">
            Room For You · rfyglobal.org · Jesus to Nations
          </p>
        </div>
      `,
    })
  }

  return NextResponse.json(request)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.prayerRequest.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

---

## TASK 3 — Testimony API Routes

#### `src/app/api/testimony/route.ts` — Submit testimony (public)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'

export const runtime = 'nodejs'

const TestimonySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  title: z.string().min(3).max(200),
  body: z.string().max(5000).optional(),
  imageUrls: z.array(z.string()).max(5).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`testimony:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = TestimonySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, name, isAnonymous, title, body: testimonyBody, imageUrls, videoUrl } = parsed.data

  // Check if community member
  const member = await db.communityMember.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true },
  })

  if (!member) {
    return NextResponse.json({
      error: 'You need to be a member of the Room For You community to share a testimony.',
      notMember: true,
    }, { status: 403 })
  }

  const testimony = await db.testimony.create({
    data: {
      email: email.toLowerCase().trim(),
      name: isAnonymous ? null : (name || member.name),
      isAnonymous,
      title,
      body: testimonyBody || null,
      imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
      videoUrl: videoUrl || null,
    },
  })

  return NextResponse.json({ success: true, id: testimony.id }, { status: 201 })
}

// Public GET — approved testimonies only
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const featured = searchParams.get('featured') === 'true'

  const where: any = { status: 'APPROVED' }
  if (featured) where.isFeatured = true

  const testimonies = await db.testimony.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      isAnonymous: true,
      title: true,
      body: true,
      imageUrls: true,
      videoUrl: true,
      isFeatured: true,
      publishedAt: true,
    },
  })

  return NextResponse.json(testimonies)
}
```

#### `src/app/api/admin/testimony/route.ts` — Admin: list all

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where = status ? { status: status as any } : {}

  const testimonies = await db.testimony.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(testimonies)
}
```

#### `src/app/api/admin/testimony/[id]/route.ts` — Admin: approve/reject/feature

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.status !== undefined) {
    updateData.status = body.status
    if (body.status === 'APPROVED') updateData.publishedAt = new Date()
  }
  if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
  if (body.adminNote !== undefined) updateData.adminNote = body.adminNote

  const testimony = await db.testimony.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json(testimony)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.testimony.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

---

## TASK 4 — Messaging API Routes

#### `src/app/api/admin/messages/route.ts` — List threads + create

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const threads = await db.messageThread.findMany({
    orderBy: { lastAt: 'desc' },
    include: {
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  })

  return NextResponse.json(threads)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { recipientEmail, recipientName, subject, message, sendEmailNow } = body

  // Handle bulk sending to multiple recipients
  if (Array.isArray(body.recipients)) {
    const results = await Promise.allSettled(
      body.recipients.map(async (r: { email: string; name?: string }) => {
        const thread = await db.messageThread.create({
          data: {
            recipientEmail: r.email,
            recipientName: r.name ?? null,
            subject: subject ?? null,
            lastMessage: message,
            lastAt: new Date(),
            messages: {
              create: { body: message, fromAdmin: true },
            },
          },
        })

        if (sendEmailNow) {
          await sendEmail({
            to: r.email,
            subject: subject ?? 'Message from Room For You',
            html: buildMessageEmail(r.name ?? r.email, message),
          })
        }

        return thread
      })
    )

    return NextResponse.json({ success: true, count: results.length })
  }

  // Single recipient
  const thread = await db.messageThread.create({
    data: {
      recipientEmail,
      recipientName: recipientName ?? null,
      subject: subject ?? null,
      lastMessage: message,
      lastAt: new Date(),
      messages: {
        create: { body: message, fromAdmin: true },
      },
    },
    include: { messages: true },
  })

  if (sendEmailNow) {
    await sendEmail({
      to: recipientEmail,
      subject: subject ?? 'Message from Room For You',
      html: buildMessageEmail(recipientName ?? recipientEmail, message),
    })
  }

  return NextResponse.json(thread, { status: 201 })
}

function buildMessageEmail(name: string, message: string) {
  return `
    <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
      <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
        Room For You
      </p>
      <p style="color:#F8F8F8;font-size:18px;font-weight:600;margin:0 0 24px;">
        A message for you, ${name}
      </p>
      <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:0 0 24px;"></div>
      <p style="color:#A0A0A0;font-size:14px;line-height:1.8;">
        ${message.replace(/\n/g, '<br>')}
      </p>
      <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:24px 0;"></div>
      <p style="color:#585858;font-size:11px;text-align:center;">
        Room For You · rfyglobal.org
      </p>
    </div>
  `
}
```

#### `src/app/api/admin/messages/[id]/route.ts` — Thread messages

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thread = await db.messageThread.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { sentAt: 'asc' } },
    },
  })

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark thread as read
  await db.messageThread.update({
    where: { id: params.id },
    data: { isRead: true },
  })

  return NextResponse.json(thread)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body: messageBody, sendEmailNow } = await req.json()

  const thread = await db.messageThread.findUnique({
    where: { id: params.id },
  })
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const message = await db.message.create({
    data: {
      threadId: params.id,
      body: messageBody,
      fromAdmin: true,
    },
  })

  await db.messageThread.update({
    where: { id: params.id },
    data: { lastMessage: messageBody, lastAt: new Date() },
  })

  if (sendEmailNow) {
    await sendEmail({
      to: thread.recipientEmail,
      subject: thread.subject ?? 'Message from Room For You',
      html: `
        <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">Room For You</p>
          <p style="color:#A0A0A0;font-size:14px;line-height:1.8;">${messageBody.replace(/\n/g, '<br>')}</p>
          <p style="color:#585858;font-size:11px;margin-top:24px;text-align:center;">rfyglobal.org</p>
        </div>
      `,
    })
  }

  return NextResponse.json(message, { status: 201 })
}
```

---

## TASK 5 — Admin Notifications API

Create `src/app/api/admin/notifications/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [newPrayers, newTestimonies, unreadMessages] = await Promise.all([
    db.prayerRequest.count({ where: { status: 'PENDING' } }),
    db.testimony.count({ where: { status: 'PENDING' } }),
    db.messageThread.count({ where: { isRead: false } }),
  ])

  return NextResponse.json({
    prayers: newPrayers,
    testimonies: newTestimonies,
    messages: unreadMessages,
    total: newPrayers + newTestimonies + unreadMessages,
  })
}
```

---

## TASK 6 — Admin Topbar Notification Bell

Update `src/components/admin/AdminTopbar.tsx`.

Add a notification bell that polls the notifications API every 30 seconds:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'

// Inside AdminTopbar component:
const [notifications, setNotifications] = useState({ prayers: 0, testimonies: 0, messages: 0, total: 0 })

useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch {}
  }

  fetchNotifications()
  const interval = setInterval(fetchNotifications, 30000) // every 30s
  return () => clearInterval(interval)
}, [])

// Add bell button to topbar right side (before theme toggle):
<div className="relative">
  <button
    onClick={() => {/* navigate to /admin/prayer or show dropdown */}}
    className="w-8 h-8 flex items-center justify-center border transition-all relative"
    style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
    title="Notifications"
  >
    <Bell size={14} />
    {notifications.total > 0 && (
      <span
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-body font-bold"
        style={{ background: 'var(--a-red)', color: 'white', fontSize: '9px' }}
      >
        {notifications.total > 9 ? '9+' : notifications.total}
      </span>
    )}
  </button>
</div>
```

---

## TASK 7 — Public Prayer Wall Page

Create `src/app/(public)/prayer/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PrayerWallClient } from '@/components/prayer/PrayerWallClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prayer Wall — Room For You',
  description: 'Submit your prayer request to the Room For You prayer team.',
}

export default function PrayerWallPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="label-text mb-4">Prayer Wall</p>
          <h1 className="font-display text-snow font-bold mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            We will pray<br />with you.
          </h1>

          <div className="gold-line-left w-12 mb-6 opacity-50" />

          <p className="font-body text-mist leading-relaxed mb-4">
            Share your prayer request with the Room For You prayer team.
            Minister Yadah and the team will personally pray over every request.
          </p>

          {/* Privacy note */}
          <div className="flex items-start gap-3 p-4 mb-10 border"
            style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
            <span className="text-gold text-lg shrink-0">🔒</span>
            <p className="font-body text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>
              Your prayer request is <strong style={{ color: '#C9A84C' }}>completely private</strong> —
              it is seen only by Minister Yadah and the Room For You prayer team.
              It will never be publicly displayed.
            </p>
          </div>

          <PrayerWallClient />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

Create `src/components/prayer/PrayerWallClient.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'

export function PrayerWallClient() {
  const [form, setForm] = useState({
    email: '', name: '', subject: '', body: '', isAnonymous: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notMember, setNotMember] = useState(false)

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#F8F8F8',
    padding: '14px 16px',
    fontSize: '14px',
    fontFamily: 'General Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: '#A0A0A0',
    marginBottom: '8px',
    fontFamily: 'General Sans, sans-serif',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotMember(false)

    if (!form.email || !form.subject || !form.body) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.notMember) {
          setNotMember(true)
        } else {
          throw new Error(data.error?.formErrors?.[0] ?? 'Submission failed')
        }
        return
      }

      setSubmitted(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-6"
          style={{ borderColor: '#C9A84C' }}>
          <span className="text-gold text-2xl">🙏</span>
        </div>
        <div className="gold-line max-w-[60px] mx-auto mb-6 opacity-30" />
        <h2 className="font-display text-snow text-3xl font-bold mb-3">
          Received.
        </h2>
        <p className="font-body text-mist leading-relaxed max-w-md mx-auto">
          Your prayer request has been received. Minister Yadah and the prayer team
          will be lifting you up in prayer.
          <span className="text-gold"> Jesus cares about what concerns you.</span>
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <label style={labelStyle}>Email Address *</label>
        <input
          type="email"
          value={form.email}
          onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setNotMember(false) }}
          placeholder="your@email.com"
          required
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        <p className="font-body text-xs mt-1" style={{ color: '#585858' }}>
          Must be the email you used to join the community.
        </p>
      </div>

      {/* Not a member warning */}
      <AnimatePresence>
        {notMember && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 border"
            style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}
          >
            <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
            <div>
              <p className="font-body text-sm" style={{ color: '#FCA5A5' }}>
                This email is not registered with Room For You.
              </p>
              <p className="font-body text-xs mt-1" style={{ color: 'rgba(252,165,165,0.7)' }}>
                Please{' '}
                <Link href="/join" className="underline" style={{ color: '#C9A84C' }}>
                  join the community
                </Link>
                {' '}first — it only takes a minute.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anonymous toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm(p => ({ ...p, isAnonymous: !p.isAnonymous }))}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{ background: form.isAnonymous ? '#C9A84C' : 'rgba(255,255,255,0.15)' }}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <span className="font-body text-sm" style={{ color: '#A0A0A0' }}>
          Submit anonymously (your name won't be shown to the team)
        </span>
      </div>

      {/* Name — only if not anonymous */}
      {!form.isAnonymous && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label style={labelStyle}>Your Name</label>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Your full name"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
          />
        </motion.div>
      )}

      {/* Subject */}
      <div>
        <label style={labelStyle}>Prayer Topic *</label>
        <input
          value={form.subject}
          onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
          placeholder="e.g. Healing, Provision, Guidance..."
          required
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      </div>

      {/* Body */}
      <div>
        <label style={labelStyle}>Your Prayer Request *</label>
        <textarea
          value={form.body}
          onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
          placeholder="Share what you need prayer for..."
          required
          rows={6}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        <p className="font-body text-xs mt-1 text-right"
          style={{ color: form.body.length > 1800 ? '#F87171' : '#585858' }}>
          {form.body.length}/2000
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || notMember}
        className="w-full py-4 font-body font-semibold text-xs tracking-widest uppercase transition-all disabled:opacity-40"
        style={{ background: '#C9A84C', color: '#0F0F0F' }}
      >
        {submitting ? 'Submitting…' : 'Submit Prayer Request →'}
      </button>

      <p className="font-body text-xs text-center" style={{ color: '#585858' }}>
        🔒 Your request is completely private — only the prayer team will see it.
      </p>
    </form>
  )
}
```

---

## TASK 8 — Public Testimony Submission Page

Create `src/app/(public)/testimonies/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { TestimonyGrid } from '@/components/testimony/TestimonyGrid'
import { TestimonySubmitButton } from '@/components/testimony/TestimonySubmitButton'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testimonies — Room For You',
  description: 'Stories of what God has done in the Room For You community.',
}

export const dynamic = 'force-dynamic'

export default async function TestimoniesPage() {
  const testimonies = await db.testimony.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      isAnonymous: true,
      title: true,
      body: true,
      imageUrls: true,
      videoUrl: true,
      isFeatured: true,
      publishedAt: true,
    },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-8">
          <p className="label-text mb-4">Testimonies</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-snow font-bold mb-3"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
                What God<br />has done.
              </h1>
              <p className="font-body text-mist max-w-lg">
                Real stories from the Room For You community.
                God is moving — here is the evidence.
              </p>
            </div>
            <TestimonySubmitButton />
          </div>
        </div>

        <TestimonyGrid testimonies={testimonies} />
      </main>
      <Footer />
    </>
  )
}
```

Create `src/components/testimony/TestimonyGrid.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Play, Star } from 'lucide-react'
import { format } from 'date-fns'

interface TestimonyData {
  id: string
  name: string | null
  isAnonymous: boolean
  title: string
  body: string | null
  imageUrls: unknown
  videoUrl: string | null
  isFeatured: boolean
  publishedAt: string | null
}

export function TestimonyGrid({ testimonies }: { testimonies: TestimonyData[] }) {
  const getImages = (imageUrls: unknown): string[] => {
    if (!imageUrls) return []
    try {
      return Array.isArray(imageUrls) ? imageUrls : JSON.parse(imageUrls as string)
    } catch {
      return []
    }
  }

  const getVideoEmbed = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.includes('youtu.be')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('vimeo.com')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  }

  if (testimonies.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="font-display text-snow text-2xl mb-3">
          Testimonies are coming.
        </p>
        <p className="font-body text-mist">
          Check back soon — God is at work in this community.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 pt-12">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {testimonies.map((t, i) => {
          const images = getImages(t.imageUrls)
          const embedUrl = t.videoUrl ? getVideoEmbed(t.videoUrl) : null
          const displayName = t.isAnonymous ? 'Anonymous' : (t.name ?? 'Community Member')
          const hasMedia = images.length > 0 || t.videoUrl

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3) }}
              className="break-inside-avoid border overflow-hidden"
              style={{
                borderColor: t.isFeatured ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)',
                background: t.isFeatured ? 'rgba(201,168,76,0.03)' : 'rgba(255,255,255,0.02)',
              }}
            >
              {/* Featured badge */}
              {t.isFeatured && (
                <div className="flex items-center gap-1.5 px-4 py-2 border-b"
                  style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.08)' }}>
                  <Star size={11} className="text-gold fill-gold" />
                  <p className="label-text text-[10px]">Featured Testimony</p>
                </div>
              )}

              {/* Video embed */}
              {embedUrl && (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Direct video */}
              {t.videoUrl && !embedUrl && (
                <video
                  src={t.videoUrl}
                  controls
                  className="w-full"
                  style={{ maxHeight: '300px', background: '#0F0F0F' }}
                />
              )}

              {/* Images */}
              {images.length > 0 && (
                <div className={`grid ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5`}>
                  {images.slice(0, 4).map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden">
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                      {images.length > 4 && idx === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.7)' }}>
                          <p className="font-display text-white text-xl font-bold">
                            +{images.length - 4}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Text content */}
              <div className="p-5">
                <h3 className="font-display text-snow text-lg font-semibold mb-2 leading-tight">
                  {t.title}
                </h3>
                {t.body && (
                  <p className="font-body text-mist text-sm leading-relaxed mb-4 line-clamp-4">
                    {t.body}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-body text-xs" style={{ color: '#585858' }}>
                    — {displayName}
                  </p>
                  {t.publishedAt && (
                    <p className="font-body text-xs" style={{ color: '#585858' }}>
                      {format(new Date(t.publishedAt), 'MMM yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
```

Create `src/components/testimony/TestimonySubmitButton.tsx` — a button that opens a modal for testimony submission (similar to event registration modal pattern):

```typescript
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TestimonySubmitModal } from './TestimonySubmitModal'

export function TestimonySubmitButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-6 py-3 font-body text-xs font-semibold tracking-widest uppercase transition-all"
        style={{ background: '#C9A84C', color: '#0F0F0F' }}
      >
        <Plus size={13} />
        Share Your Testimony
      </button>
      <TestimonySubmitModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
```

Create `src/components/testimony/TestimonySubmitModal.tsx` — full testimony submission modal with text, image upload (UploadZone), video URL input, email verification, anonymous toggle, success state. Follow the same pattern as `EventRegistrationModal`.

---

## TASK 9 — Admin Prayer Requests Page

Add to sidebar under OVERVIEW (visible to SUPER_ADMIN + ADMIN):
```typescript
{ label: 'Prayer', href: '/admin/prayer', icon: Heart },
```

Create `src/app/admin/(dashboard)/prayer/page.tsx` and `src/components/admin/prayer/PrayerManager.tsx`:

**PrayerManager features:**
- Tabs: Pending / Prayed / Replied
- Each request card shows: subject, body preview, email (or "Anonymous"), date
- Expand to see full request
- "Mark as Prayed" button
- "Reply by Email" button — opens a slide-in with a text area and "Send Reply" button
- Delete button (SUPER_ADMIN only)
- Pending count badge on sidebar nav item

---

## TASK 10 — Admin Testimony Manager

Add to sidebar under CONTENT:
```typescript
{ label: 'Testimonies', href: '/admin/testimonies', icon: Star },
```

Create `src/app/admin/(dashboard)/testimonies/page.tsx` and `src/components/admin/testimony/TestimonyManager.tsx`:

**TestimonyManager features:**
- Tabs: Pending / Approved / Rejected
- Each testimony card shows: title, preview, name, media indicators (📷 📹 📝)
- Preview panel: full content, images, video
- "Approve" button → moves to Approved tab
- "Reject" button → moves to Rejected tab
- "Feature" toggle → marks as featured (shown prominently on public page)
- Delete button
- Pending count badge

---

## TASK 11 — Admin Messaging Page

Add to sidebar under OVERVIEW:
```typescript
{ label: 'Messages', href: '/admin/messages', icon: MessageSquare },
```

Create `src/app/admin/(dashboard)/messages/page.tsx` and `src/components/admin/messaging/MessagingManager.tsx`:

**MessagingManager layout — two panel (like Gmail):**

**Left panel — Thread list:**
- "+ New Message" button at top
- Each thread: avatar circle (initials), name/email, last message preview, time, unread indicator
- Clicking a thread opens it in the right panel
- Unread threads have a gold left border

**Right panel — Thread chat view:**
- Header: recipient name + email
- Messages displayed as chat bubbles:
  - Admin messages: right-aligned, gold background
  - Future received messages: left-aligned, dark background
- Message input at bottom with "Send" button + "Send as Email" toggle
- On "Send as Email" toggle on, message is also emailed to recipient via Brevo

**New Message modal:**
- To: input (type email or select from members dropdown)
- Or: "Select Group" → All Members / City filter / Form entries
- Subject: optional
- Message: textarea
- "Send as Email" checkbox
- Send button

---

## TASK 12 — Update Footer Links

Open `src/components/layout/Footer.tsx` and `src/components/layout/FooterInteractive.tsx`.

Add Prayer Wall and Testimonies links to the footer — above the privacy policy line, as a separate row:

```typescript
{/* Community links — above legal links */}
<div className="flex items-center justify-center gap-6 mb-4">
  <a href="/prayer"
    style={{ color: '#A0A0A0', fontSize: '12px', fontFamily: 'General Sans, sans-serif' }}
    onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
    onMouseLeave={e => (e.currentTarget.style.color = '#A0A0A0')}
  >
    Prayer Wall
  </a>
  <a href="/testimonies"
    style={{ color: '#A0A0A0', fontSize: '12px', fontFamily: 'General Sans, sans-serif' }}
    onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
    onMouseLeave={e => (e.currentTarget.style.color = '#A0A0A0')}
  >
    Testimonies
  </a>
</div>
```

---

## PHASE 22 COMPLETION CHECKLIST

**Prayer Wall**
- [ ] `/prayer` page loads with privacy notice
- [ ] Email check verifies community membership
- [ ] Non-member sees friendly error with join link
- [ ] Anonymous toggle works
- [ ] Form submits and shows success state
- [ ] Admin `/admin/prayer` shows all requests
- [ ] Mark as Prayed works
- [ ] Reply by email sends correctly
- [ ] Notification bell shows pending prayer count

**Testimonies**
- [ ] `/testimonies` shows approved testimonies in masonry grid
- [ ] "Share Your Testimony" modal opens
- [ ] Text, image upload, video URL all work
- [ ] Email verified against community members
- [ ] Admin `/admin/testimonies` shows pending/approved/rejected tabs
- [ ] Approve moves to public page
- [ ] Feature toggle marks as featured
- [ ] Notification bell shows pending testimony count
- [ ] Footer links work

**Admin Messaging**
- [ ] `/admin/messages` shows thread list
- [ ] Clicking thread opens chat view
- [ ] Admin can send message in thread
- [ ] "Send as Email" toggle works
- [ ] New message modal works for individual/group/form entries
- [ ] Unread thread indicator shows on bell
- [ ] Thread marked as read on open

**Schema**
- [ ] `npx prisma db push` succeeds
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `PrayerRequest` and `Testimony` both verify email against `CommunityMember` — this is the gate that requires joining the community first. The error response includes `notMember: true` so the frontend can show the specific "join first" message with a link.
- The notification bell polls every 30 seconds — this is intentional. Real-time websockets are overkill for an admin panel. 30s polling is sufficient and doesn't require additional infrastructure.
- The messaging system is one-directional for now (admin sends, no reply pathway). Members cannot reply via the platform — they can only reply to the email they receive. This keeps the system simple.
- Video URLs support YouTube, Vimeo, and direct video file URLs. For YouTube/Vimeo, extract the embed URL. For direct URLs (Cloudinary), use a `<video>` tag.
- The `imageUrls` field on Testimony is stored as JSON string — always parse with try/catch.
- Prayer requests have `isAnonymous` but the email is always stored — the admin can always see who submitted even for anonymous requests, but the name shown to the prayer team is hidden. This is intentional for follow-up purposes.
