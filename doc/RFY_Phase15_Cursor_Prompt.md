# ROOM FOR YOU — Phase 15 Cursor Prompt
## Event Registration Popup · Per-Event Registrations Admin · Navbar Hero Fix

---

## CONTEXT

Phase 15 adds three things:

1. **Event Registration Popup** — "Register to Attend" opens a modal form on the event single page. Fields: Name, Email, Phone, Location, Expectations. On submit: saves to DB + sends confirmation email with event details.

2. **Per-Event Registrations in Admin** — Each event in the admin shows a "Registrations" tab/section with all people who registered, plus CSV export.

3. **Navbar Hero Fix** — On the single event page (`/events/[slug]`), the page content starts too high and overlaps the navbar. The hero section needs `padding-top` to push content below the fixed navbar.

---

## TASK 1 — Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model EventRegistration {
  id           String   @id @default(cuid())
  eventId      String
  event        Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name         String
  email        String
  phone        String
  location     String
  expectations String?  @db.Text
  createdAt    DateTime @default(now())

  @@unique([eventId, email]) // prevent duplicate registrations per event
}
```

Also update the `Event` model to include the relation:

```prisma
model Event {
  // ... existing fields ...
  registrations EventRegistration[]
}
```

Run: `npx prisma db push`

---

## TASK 2 — Event Registration API

Create `src/app/api/events/[slug]/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendEventRegistrationEmail } from '@/lib/emails/event-registration'
import { z } from 'zod'

export const runtime = 'nodejs'

const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7).max(20),
  location: z.string().min(1, 'Location is required').max(200),
  expectations: z.string().max(1000).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`event-reg:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Find event by slug or id
  const event = await db.event.findFirst({
    where: {
      OR: [{ slug: params.slug }, { id: params.slug }],
      isActive: true,
    },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Check event is in the future
  if (new Date(event.date) < new Date()) {
    return NextResponse.json({ error: 'This event has already passed' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, phone, location, expectations } = parsed.data

  // Check duplicate
  const existing = await db.eventRegistration.findUnique({
    where: { eventId_email: { eventId: event.id, email } },
  })

  if (existing) {
    return NextResponse.json({
      error: 'You are already registered for this event.',
      alreadyRegistered: true,
    }, { status: 409 })
  }

  // Create registration
  const registration = await db.eventRegistration.create({
    data: { eventId: event.id, name, email, phone, location, expectations },
  })

  // Send confirmation email
  try {
    await sendEventRegistrationEmail({ name, email, event })
  } catch (err) {
    console.error('[EventReg] Failed to send confirmation email:', err)
  }

  return NextResponse.json({ success: true, registrationId: registration.id }, { status: 201 })
}
```

Create `src/app/api/events/[slug]/registrations/route.ts` — Admin: view registrations:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: 'desc' },
  })

  if (format === 'csv') {
    const headers = ['Name', 'Email', 'Phone', 'Location', 'Expectations', 'Registered At']
    const rows = registrations.map(r => [
      `"${r.name}"`,
      r.email,
      r.phone,
      `"${r.location}"`,
      `"${(r.expectations ?? '').replace(/"/g, '""')}"`,
      new Date(r.createdAt).toISOString(),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${event.slug ?? event.id}-registrations.csv"`,
      },
    })
  }

  return NextResponse.json({ registrations, total: registrations.length, event })
}
```

---

## TASK 3 — Event Registration Confirmation Email

Create `src/lib/emails/event-registration.ts`:

```typescript
import { sendEmail } from '@/lib/brevo'
import { format } from 'date-fns'
import type { Event } from '@prisma/client'

export async function sendEventRegistrationEmail({
  name,
  email,
  event,
}: {
  name: string
  email: string
  event: Event
}) {
  const dateStr = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const firstName = name.split(' ')[0]

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">

        <div style="padding:40px;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Event Registration
          </p>

          <h1 style="color:#F8F8F8;font-size:32px;font-weight:700;margin:0 0 8px;line-height:1.1;">
            You're registered, ${firstName}!
          </h1>
          <p style="color:#A0A0A0;font-size:14px;margin:0 0 32px;">
            We'll see you there.
          </p>

          <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:0 0 32px;"></div>

          <!-- Event details -->
          <h2 style="color:#C9A84C;font-size:16px;font-weight:600;margin:0 0 20px;letter-spacing:0.05em;">
            ${event.title}
          </h2>

          <table style="width:100%;border-collapse:collapse;margin:0 0 32px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;width:100px;">
                Date
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${dateStr}
              </td>
            </tr>
            ${event.time ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
                Time
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${event.time}
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
                Venue
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${event.venue}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
                City
              </td>
              <td style="padding:10px 0;color:#F8F8F8;font-size:14px;">
                ${event.city}
              </td>
            </tr>
          </table>

          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:0 0 32px;"></div>

          <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0 0 24px;">
            We are looking forward to seeing you. Come ready to worship, pray,
            study the Word, and connect with other believers.
            <strong style="color:#F8F8F8;">There is room for you.</strong>
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="https://rfyglobal.org/events"
              style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:14px 32px;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              View All Events →
            </a>
          </div>
        </div>

        <div style="padding:20px 40px;border-top:1px solid #1A1A1A;text-align:center;">
          <p style="color:#585858;font-size:11px;margin:0;">
            Room For You · rfyglobal.org · A SonsHub Media Initiative
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: `You're registered: ${event.title} 🙌`,
    html,
  })
}
```

---

## TASK 4 — Event Registration Popup Component

Create `src/components/events/EventRegistrationModal.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  eventSlug: string
  eventTitle: string
  eventDate: string
  eventCity: string
}

export function EventRegistrationModal({
  isOpen,
  onClose,
  eventSlug,
  eventTitle,
  eventDate,
  eventCity,
}: EventRegistrationModalProps) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '', expectations: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.phone || !form.location) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${eventSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyRegistered) {
          toast.error('You are already registered for this event!')
        } else {
          throw new Error(data.error?.formErrors?.[0] ?? 'Registration failed')
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

  const handleClose = () => {
    onClose()
    // Reset after animation
    setTimeout(() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', location: '', expectations: '' }) }, 300)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#F8F8F8',
    padding: '12px 16px',
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
    marginBottom: '6px',
    fontFamily: 'General Sans, sans-serif',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
              style={{ background: '#0F0F0F', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {!submitted ? (
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="label-text mb-2">Register to Attend</p>
                      <h2 className="font-display text-snow text-xl font-bold leading-tight">
                        {eventTitle}
                      </h2>
                      <p className="font-body text-mist text-sm mt-1">
                        {eventDate} · {eventCity}
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="text-mist hover:text-snow transition-colors ml-4 mt-1 shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Gold divider */}
                  <div className="gold-line mb-8 opacity-30" />

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your full name"
                        required
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={labelStyle}>Email Address *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+234..."
                        required
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label style={labelStyle}>Location (City, Country) *</label>
                      <input
                        value={form.location}
                        onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                        placeholder="e.g. Abuja, Nigeria"
                        required
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    {/* Expectations */}
                    <div>
                      <label style={labelStyle}>Expectations (Optional)</label>
                      <textarea
                        value={form.expectations}
                        onChange={e => setForm(p => ({ ...p, expectations: e.target.value }))}
                        placeholder="What are you expecting from this gathering?"
                        rows={3}
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 font-body font-semibold text-xs tracking-widest uppercase transition-all duration-300 disabled:opacity-50 mt-2"
                      style={{ background: '#C9A84C', color: '#0F0F0F' }}
                    >
                      {submitting ? 'Registering…' : 'Complete Registration →'}
                    </button>

                    <p className="font-body text-xs text-center" style={{ color: '#585858' }}>
                      A confirmation email will be sent to you.
                    </p>
                  </form>
                </div>
              ) : (
                /* Success state */
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-6"
                    style={{ borderColor: '#C9A84C' }}>
                    <CheckCircle size={28} className="text-gold" />
                  </div>

                  <div className="gold-line max-w-[60px] mx-auto mb-6 opacity-40" />

                  <h2 className="font-display text-snow text-3xl font-bold mb-3">
                    You're in!
                  </h2>
                  <p className="font-body text-mist text-sm leading-relaxed mb-2">
                    You are registered for
                  </p>
                  <p className="font-display text-gold text-lg mb-6">
                    {eventTitle}
                  </p>
                  <p className="font-body text-mist text-sm leading-relaxed mb-8">
                    Check your email for confirmation and event details.
                    We'll see you there. 🙌
                  </p>

                  <button
                    onClick={handleClose}
                    className="px-8 py-3 font-body text-xs tracking-widest uppercase border transition-all"
                    style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C' }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## TASK 5 — Update SingleEventClient

Open `src/components/events/SingleEventClient.tsx`.

**Fix 1 — Push hero below navbar:**

The `<main>` element currently starts at the top of the viewport. The hero grid needs top padding to clear the fixed navbar (height ~72px):

```typescript
// Change the section className:
<section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 pt-20 lg:pt-0">

// The left image panel on desktop should be sticky from the navbar height down:
className="relative min-h-[50vh] lg:min-h-screen lg:sticky lg:top-0 lg:pt-20"

// The right content panel needs top padding on desktop to clear navbar:
className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-24 lg:py-32 lg:pt-28"
```

**Fix 2 — Replace Register CTA with modal trigger:**

```typescript
'use client'  // ensure this is a client component

import { useState } from 'react'
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal'
import { format } from 'date-fns'

// Inside the component, add state:
const [registrationOpen, setRegistrationOpen] = useState(false)
const dateFormatted = format(new Date(event.date), 'EEEE, MMMM do yyyy')

// Replace the Register Link with a button:
// BEFORE:
<Link href="/join" ...>Register to Attend →</Link>

// AFTER:
<button
  onClick={() => setRegistrationOpen(true)}
  className="inline-flex items-center gap-2 px-8 py-4 font-body text-xs font-semibold tracking-widest uppercase transition-all duration-300"
  style={{ background: '#C9A84C', color: '#0F0F0F' }}
>
  Register to Attend →
</button>

// Add modal at the end of the component (before closing tag):
<EventRegistrationModal
  isOpen={registrationOpen}
  onClose={() => setRegistrationOpen(false)}
  eventSlug={event.slug ?? event.id}
  eventTitle={event.title}
  eventDate={dateFormatted}
  eventCity={event.city}
/>
```

---

## TASK 6 — Admin Events Manager — Add Registrations View

Open `src/components/admin/events/EventsManager.tsx`.

Add a "View Registrations" button to each event card that opens a slide-in panel showing all registrations for that event.

The registrations panel must show:
- Event title at the top
- Total registrations count
- Export CSV button → GET `/api/events/[slug]/registrations?format=csv`
- Table with columns: Name, Email, Phone, Location, Registered At
- Empty state when no registrations yet

```typescript
// Add to each event card actions:
<button
  onClick={() => openRegistrations(event)}
  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-body border transition-all"
  style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'var(--a-gold-border)'
    e.currentTarget.style.color = 'var(--a-gold)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--a-border)'
    e.currentTarget.style.color = 'var(--a-text-secondary)'
  }}
>
  <Users size={12} />
  Registrations
</button>
```

Add state and the slide-in panel for registrations:

```typescript
const [registrationsEvent, setRegistrationsEvent] = useState<EventType | null>(null)
const [registrations, setRegistrations] = useState<EventRegistration[]>([])
const [loadingRegs, setLoadingRegs] = useState(false)

const openRegistrations = async (event: EventType) => {
  setRegistrationsEvent(event)
  setLoadingRegs(true)
  try {
    const res = await fetch(`/api/events/${event.slug ?? event.id}/registrations`)
    const data = await res.json()
    setRegistrations(data.registrations ?? [])
  } catch {
    toast.error('Failed to load registrations')
  } finally {
    setLoadingRegs(false)
  }
}
```

Registrations slide-in panel:

```typescript
<AnimatePresence>
  {registrationsEvent && (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setRegistrationsEvent(null)}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto"
        style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="font-body text-xs uppercase tracking-widest mb-1"
                style={{ color: 'var(--a-gold)' }}>
                Event Registrations
              </p>
              <h3 className="font-display text-xl font-semibold"
                style={{ color: 'var(--a-text)' }}>
                {registrationsEvent.title}
              </h3>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
                {registrations.length} registered
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/api/events/${registrationsEvent.slug ?? registrationsEvent.id}/registrations?format=csv`}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-body border transition-all"
                style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)', background: 'var(--a-bg)' }}
              >
                <Download size={12} /> Export CSV
              </a>
              <button onClick={() => setRegistrationsEvent(null)}
                style={{ color: 'var(--a-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="h-px mb-6" style={{ background: 'var(--a-border)' }} />

          {/* Table */}
          {loadingRegs ? (
            <div className="text-center py-12">
              <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                Loading registrations…
              </p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12 border border-dashed"
              style={{ borderColor: 'var(--a-border)' }}>
              <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                No registrations yet for this event.
              </p>
            </div>
          ) : (
            <div className="border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr style={{ background: 'var(--a-sidebar)', borderBottom: `1px solid var(--a-border)` }}>
                      {['Name', 'Email', 'Phone', 'Location', 'When'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs uppercase tracking-widest"
                          style={{ color: 'var(--a-gold)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r, i) => (
                      <tr key={r.id}
                        style={{
                          borderBottom: `1px solid var(--a-border)`,
                          background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)',
                        }}>
                        <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--a-text)' }}>
                          {r.name}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--a-text-secondary)' }}>
                          {r.email}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--a-text-secondary)' }}>
                          {r.phone}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--a-text-secondary)' }}>
                          {r.location}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--a-text-muted)' }}>
                          {formatDate(r.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

Import `Users`, `Download`, `X` from `lucide-react` and `EventRegistration` type from `@prisma/client`.

---

## TASK 7 — Add Registration Count to Admin Events List

In `EventsManager.tsx`, each event card should show a registration count badge:

```typescript
// Add to event card header area, next to city/date info:
<span className="text-xs font-body px-2 py-0.5 border"
  style={{
    borderColor: 'var(--a-gold-border)',
    color: 'var(--a-gold)',
    background: 'var(--a-gold-light)',
  }}>
  {event._count?.registrations ?? 0} registered
</span>
```

Update the API to include registration count:

In `src/app/api/events/route.ts` GET handler, include `_count`:

```typescript
const events = await db.event.findMany({
  where,
  orderBy: { date: 'asc' },
  include: {
    _count: { select: { registrations: true } },
  },
})
```

---

## PHASE 15 COMPLETION CHECKLIST

**Event Registration Popup**
- [ ] `EventRegistration` model in Prisma schema and pushed to DB
- [ ] `POST /api/events/[slug]/register` works correctly
- [ ] Duplicate registration returns friendly error
- [ ] Confirmation email sends with event details
- [ ] Modal opens when "Register to Attend" is clicked
- [ ] Form validates required fields
- [ ] Success state shows after registration
- [ ] Modal closes cleanly and resets form

**Admin Registrations**
- [ ] "Registrations" button on each event card in admin
- [ ] Slide-in panel shows all registrations for an event
- [ ] Registration count badge on event card
- [ ] CSV export downloads correctly
- [ ] Empty state when no registrations

**Navbar/Hero Fix**
- [ ] Single event page content is pushed below the fixed navbar
- [ ] No content hidden behind navbar on scroll
- [ ] Date badge visible on image

**General**
- [ ] `npx prisma db push` applies `EventRegistration` model
- [ ] `npm run build` passes without errors

---

## NOTES FOR CURSOR

- The `EventRegistration` model uses `@@unique([eventId, email])` — this prevents the same person registering twice for the same event. The API returns `alreadyRegistered: true` which the modal handles gracefully.
- The modal is a `'use client'` component. `SingleEventClient` must also be `'use client'` since it manages the modal open/close state. This is already the case from Phase 14.
- The navbar fix: the issue is the hero `<section>` starts at `top: 0` and the image bleeds under the transparent navbar. On the single event page, add `pt-20` to the main container or the first section to push content below the ~80px fixed navbar.
- Import `EventRegistration` from `@prisma/client` in `EventsManager` for the type. If there are issues with the Prisma type not being available yet, use a local interface instead.
- The `_count.registrations` on events requires the `EventRegistration` relation to exist in the schema first. Make sure `npx prisma db push` is run before deploying.
