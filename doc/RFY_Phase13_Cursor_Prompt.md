# ROOM FOR YOU — Phase 13 Cursor Prompt
## Master Join Form · Join Page · Email Automation System

---

## CONTEXT

Phase 13 builds three interconnected systems:

1. **Master Join Form** — A dedicated community registration form at `/join` with conditional country/state logic. This is NOT built with the form builder — it is a standalone system. All community member counts on the admin dashboard pull from this form's submissions.

2. **Join Page** — A full-screen split layout at `/join`. Left side: bold animated text that feels like a movement. Right side: the master join form.

3. **Email Automation System** — Three automated email types:
   - **Confirmation email** — sent immediately on join form submission
   - **Daily devotional email** — sent every morning, pulls from the daily scripture system
   - **Event reminder emails** — sent 1 week before + 24 hours before each upcoming event, to all members who joined before the event date

---

## INSTALL DEPENDENCIES

```bash
npm install @vercel/cron
```

---

## TASK 1 — Prisma Schema Additions

Add to `prisma/schema.prisma`:

```prisma
// ── MASTER JOIN FORM ──────────────────────────────────────────

model CommunityMember {
  id           String    @id @default(cuid())
  name         String
  phone        String
  email        String    @unique
  country      String
  state        String?   // only for Nigeria
  city         String?   // for non-Nigeria countries
  // Extra fields added by admin over time (stored as JSON)
  extraFields  Json?
  // Email automation
  isSubscribed Boolean   @default(true)
  confirmedAt  DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Email logs
  emailLogs    EmailLog[]
}

model JoinFormField {
  id          String    @id @default(cuid())
  label       String
  type        FieldType // reuse existing enum
  placeholder String?
  required    Boolean   @default(false)
  options     Json?
  order       Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
}

// ── EMAIL AUTOMATION ──────────────────────────────────────────

model EmailLog {
  id         String      @id @default(cuid())
  memberId   String?
  member     CommunityMember? @relation(fields: [memberId], references: [id], onDelete: SetNull)
  type       EmailType
  subject    String
  sentAt     DateTime    @default(now())
  status     String      @default("sent") // sent, failed
  meta       Json?       // event id, scripture id etc.
}

model AutomationSettings {
  id                    String  @id @default(cuid())
  whatsappChannelUrl    String  @default("")
  devotionalEmailTime   String  @default("07:00") // HH:mm UTC
  isDevotionalActive    Boolean @default(true)
  isEventReminderActive Boolean @default(true)
  updatedAt             DateTime @updatedAt
}

enum EmailType {
  CONFIRMATION
  DAILY_DEVOTIONAL
  EVENT_REMINDER_WEEK
  EVENT_REMINDER_DAY
}
```

Run:
```bash
npx prisma db push
```

---

## TASK 2 — All Countries + Nigeria States Data

Create `src/lib/geo-data.ts`:

```typescript
export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NG', name: 'Nigeria' }, // duplicate removed below
].filter((c, i, arr) => arr.findIndex(x => x.code === c.code) === i)
  // Nigeria always first, rest alphabetical
  .sort((a, b) => {
    if (a.code === 'NG') return -1
    if (b.code === 'NG') return 1
    return a.name.localeCompare(b.name)
  })

export const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
].sort()
```

---

## TASK 3 — Join Form API Routes

#### `src/app/api/join/route.ts` — Submit join form

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendConfirmationEmail } from '@/lib/emails/confirmation'
import { z } from 'zod'

export const runtime = 'nodejs'

const JoinSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().min(7, 'Valid phone number required').max(20),
  email: z.string().email('Valid email required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().optional(),
  city: z.string().optional(),
  extraFields: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`join:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = JoinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, phone, email, country, state, city, extraFields } = parsed.data

  // Check if already registered
  const existing = await db.communityMember.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({
      error: 'This email is already registered with Room For You.',
      alreadyRegistered: true,
    }, { status: 409 })
  }

  // Create member
  const member = await db.communityMember.create({
    data: {
      name,
      phone,
      email,
      country,
      state: country === 'Nigeria' ? (state ?? null) : null,
      city: country !== 'Nigeria' ? (city ?? null) : null,
      extraFields: extraFields ?? null,
    },
  })

  // Get WhatsApp URL from automation settings
  const settings = await db.automationSettings.findFirst()
  const whatsappUrl = settings?.whatsappChannelUrl || ''

  // Send confirmation email
  try {
    await sendConfirmationEmail({ member, whatsappUrl })
    await db.emailLog.create({
      data: {
        memberId: member.id,
        type: 'CONFIRMATION',
        subject: 'Welcome to Room For You 🙏',
        status: 'sent',
        meta: { whatsappUrl },
      },
    })
  } catch (err) {
    console.error('[Join] Failed to send confirmation email:', err)
    await db.emailLog.create({
      data: {
        memberId: member.id,
        type: 'CONFIRMATION',
        subject: 'Welcome to Room For You 🙏',
        status: 'failed',
      },
    })
  }

  return NextResponse.json({
    success: true,
    memberId: member.id,
    whatsappUrl,
  }, { status: 201 })
}
```

#### `src/app/api/join/members/route.ts` — Admin: list + export

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') // 'csv' for export
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  if (format === 'csv') {
    const members = await db.communityMember.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Name', 'Email', 'Phone', 'Country', 'State/City', 'Joined', 'Subscribed']
    const rows = members.map(m => [
      `"${m.name}"`,
      m.email,
      m.phone,
      m.country,
      m.state ?? m.city ?? '',
      new Date(m.createdAt).toISOString(),
      m.isSubscribed ? 'Yes' : 'No',
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="rfy-members-${Date.now()}.csv"`,
      },
    })
  }

  const [members, total] = await Promise.all([
    db.communityMember.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.communityMember.count(),
  ])

  return NextResponse.json({ members, total, page, totalPages: Math.ceil(total / limit) })
}
```

#### `src/app/api/join/fields/route.ts` — Admin: manage extra fields

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const fields = await db.joinFormField.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(fields)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const field = await db.joinFormField.create({ data: body })
  return NextResponse.json(field, { status: 201 })
}
```

---

## TASK 4 — Email Templates

Create `src/lib/emails/confirmation.ts`:

```typescript
import { sendEmail } from '@/lib/brevo'
import type { CommunityMember } from '@prisma/client'

interface ConfirmationEmailParams {
  member: CommunityMember
  whatsappUrl: string
}

export async function sendConfirmationEmail({ member, whatsappUrl }: ConfirmationEmailParams) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">

        <!-- Header -->
        <div style="background:#0F0F0F;padding:40px 40px 0;text-align:center;border-bottom:1px solid #C9A84C;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 16px;">
            Room For You
          </p>
          <h1 style="color:#F8F8F8;font-size:36px;font-weight:700;margin:0 0 8px;line-height:1.1;">
            Welcome, ${member.name.split(' ')[0]}.
          </h1>
          <p style="color:#C9A84C;font-size:14px;font-style:italic;margin:0 0 40px;">
            There is room for you here.
          </p>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
            You have just taken a step that matters. Welcome to the Room For You community —
            a community of young men and women who sing songs of salvation, study the Word,
            pray, and get others saved.
          </p>

          <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
            You are not alone in your faith anymore. You are surrounded by people running the same race.
          </p>

          <!-- Divider -->
          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:0 0 32px;"></div>

          <!-- What's next -->
          <h2 style="color:#F8F8F8;font-size:18px;font-weight:600;margin:0 0 16px;">
            What happens next
          </h2>

          <div style="margin:0 0 16px;">
            <div style="display:flex;align-items:flex-start;margin:0 0 12px;">
              <span style="color:#C9A84C;font-size:18px;margin-right:12px;line-height:1.4;">01</span>
              <p style="color:#A0A0A0;font-size:14px;line-height:1.6;margin:0;">
                <strong style="color:#F8F8F8;">Join our WhatsApp community</strong> — 
                stay connected, get announcements, and meet other members.
              </p>
            </div>
            <div style="display:flex;align-items:flex-start;margin:0 0 12px;">
              <span style="color:#C9A84C;font-size:18px;margin-right:12px;line-height:1.4;">02</span>
              <p style="color:#A0A0A0;font-size:14px;line-height:1.6;margin:0;">
                <strong style="color:#F8F8F8;">Expect daily scriptures</strong> — 
                every morning, the Word comes to you.
              </p>
            </div>
            <div style="display:flex;align-items:flex-start;">
              <span style="color:#C9A84C;font-size:18px;margin-right:12px;line-height:1.4;">03</span>
              <p style="color:#A0A0A0;font-size:14px;line-height:1.6;margin:0;">
                <strong style="color:#F8F8F8;">Watch for event reminders</strong> — 
                we will notify you before every Room For You gathering near you.
              </p>
            </div>
          </div>

          <!-- WhatsApp CTA -->
          ${whatsappUrl ? `
          <div style="text-align:center;margin:32px 0;">
            <a href="${whatsappUrl}"
              style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              Join the WhatsApp Community →
            </a>
          </div>
          ` : ''}

          <!-- Divider -->
          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:32px 0;"></div>

          <!-- Scripture -->
          <div style="text-align:center;padding:24px 0;">
            <p style="color:#C9A84C;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">
              A Word For You
            </p>
            <p style="color:#F8F8F8;font-size:20px;font-style:italic;font-weight:400;line-height:1.6;margin:0 0 8px;">
              "Therefore, if anyone is in Christ, the new creation has come:
              The old has gone, the new is here!"
            </p>
            <p style="color:#C9A84C;font-size:13px;margin:0;">— 2 Corinthians 5:17</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:24px 40px;border-top:1px solid #1A1A1A;text-align:center;">
          <p style="color:#585858;font-size:11px;margin:0 0 4px;">
            Room For You · rfyglobal.org · A SonsHub Media Initiative
          </p>
          <p style="color:#585858;font-size:11px;margin:0;">
            Jesus to Nations — 2 Cor 5:17-21
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to: member.email,
    subject: `Welcome to Room For You, ${member.name.split(' ')[0]} 🙏`,
    html,
  })
}
```

Create `src/lib/emails/devotional.ts`:

```typescript
import { sendEmail } from '@/lib/brevo'
import { db } from '@/lib/db'

export async function sendDailyDevotionalEmails() {
  // Get today's scripture
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let scripture = await db.scripture.findFirst({
    where: {
      scheduledAt: { gte: today, lt: tomorrow },
      isActive: true,
    },
  })

  if (!scripture) {
    const pool = await db.scripture.findMany({ where: { scheduledAt: null, isActive: true } })
    if (pool.length > 0) {
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      scripture = pool[seed % pool.length]
    }
  }

  if (!scripture) {
    console.log('[Devotional] No scripture found for today — skipping')
    return { sent: 0, skipped: true }
  }

  // Get all subscribed members
  const members = await db.communityMember.findMany({
    where: { isSubscribed: true },
    select: { id: true, name: true, email: true },
  })

  if (members.length === 0) {
    console.log('[Devotional] No subscribed members — skipping')
    return { sent: 0 }
  }

  const subject = `Today's Word: ${scripture.reference}`
  const dateStr = today.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })

  let sent = 0
  let failed = 0

  // Send in batches of 50
  const BATCH_SIZE = 50
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE)

    await Promise.all(batch.map(async (member) => {
      try {
        const html = buildDevotionalEmail({ member, scripture: scripture!, dateStr })
        await sendEmail({ to: member.email, subject, html })
        await db.emailLog.create({
          data: {
            memberId: member.id,
            type: 'DAILY_DEVOTIONAL',
            subject,
            status: 'sent',
            meta: { scriptureId: scripture!.id, reference: scripture!.reference },
          },
        })
        sent++
      } catch (err) {
        console.error(`[Devotional] Failed to send to ${member.email}:`, err)
        await db.emailLog.create({
          data: {
            memberId: member.id,
            type: 'DAILY_DEVOTIONAL',
            subject,
            status: 'failed',
          },
        })
        failed++
      }
    }))
  }

  console.log(`[Devotional] Sent: ${sent}, Failed: ${failed}`)
  return { sent, failed }
}

function buildDevotionalEmail({
  member,
  scripture,
  dateStr,
}: {
  member: { name: string; email: string }
  scripture: { reference: string; text: string; translation: string }
  dateStr: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">
        <div style="padding:40px;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Daily Word
          </p>
          <p style="color:#585858;font-size:12px;margin:0 0 32px;">${dateStr}</p>

          <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:0 0 32px;"></div>

          <p style="color:#585858;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px;">
            ${scripture.translation}
          </p>
          <h1 style="color:#C9A84C;font-size:28px;font-weight:600;margin:0 0 20px;">
            ${scripture.reference}
          </h1>
          <blockquote style="color:#F8F8F8;font-size:20px;font-style:italic;line-height:1.7;margin:0 0 32px;padding:0 0 0 20px;border-left:3px solid #C9A84C;">
            "${scripture.text}"
          </blockquote>

          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:0 0 32px;"></div>

          <p style="color:#585858;font-size:12px;text-align:center;margin:0;">
            <a href="https://rfyglobal.org/word" style="color:#C9A84C;text-decoration:none;">
              Read more on rfyglobal.org →
            </a>
          </p>
        </div>

        <div style="padding:20px 40px;border-top:1px solid #1A1A1A;text-align:center;">
          <p style="color:#585858;font-size:11px;margin:0;">
            Room For You · rfyglobal.org ·
            <a href="https://rfyglobal.org/unsubscribe?email=${member.email}"
              style="color:#585858;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
```

Create `src/lib/emails/event-reminder.ts`:

```typescript
import { sendEmail } from '@/lib/brevo'
import { db } from '@/lib/db'
import { format } from 'date-fns'

export async function sendEventReminderEmails(type: 'WEEK' | 'DAY') {
  const now = new Date()
  const targetDate = new Date(now)

  if (type === 'WEEK') {
    targetDate.setDate(targetDate.getDate() + 7)
  } else {
    targetDate.setDate(targetDate.getDate() + 1)
  }

  // Find events happening on the target date
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const events = await db.event.findMany({
    where: {
      isActive: true,
      date: { gte: startOfDay, lte: endOfDay },
    },
  })

  if (events.length === 0) {
    console.log(`[EventReminder] No events in ${type === 'WEEK' ? '7 days' : '24 hours'}`)
    return { sent: 0 }
  }

  // Get all subscribed members
  const members = await db.communityMember.findMany({
    where: { isSubscribed: true },
    select: { id: true, name: true, email: true, city: true, state: true, country: true },
  })

  let sent = 0

  for (const event of events) {
    const subject = type === 'WEEK'
      ? `Room For You is coming to ${event.city} in 1 week 🙌`
      : `Room For You is tomorrow in ${event.city}! 🙌`

    const emailType = type === 'WEEK' ? 'EVENT_REMINDER_WEEK' : 'EVENT_REMINDER_DAY'

    for (const member of members) {
      try {
        const html = buildEventReminderEmail({ member, event, type })
        await sendEmail({ to: member.email, subject, html })
        await db.emailLog.create({
          data: {
            memberId: member.id,
            type: emailType,
            subject,
            status: 'sent',
            meta: { eventId: event.id, eventCity: event.city },
          },
        })
        sent++
      } catch (err) {
        console.error(`[EventReminder] Failed for ${member.email}:`, err)
        await db.emailLog.create({
          data: {
            memberId: member.id,
            type: emailType,
            subject,
            status: 'failed',
          },
        })
      }
    }
  }

  return { sent, events: events.length }
}

function buildEventReminderEmail({
  member,
  event,
  type,
}: {
  member: { name: string; email: string }
  event: {
    title: string; city: string; venue: string
    date: Date; time?: string | null; description?: string | null
  }
  type: 'WEEK' | 'DAY'
}) {
  const dateStr = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const urgency = type === 'DAY' ? 'TOMORROW' : 'NEXT WEEK'

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">
        <div style="padding:40px;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Event Reminder
          </p>

          <div style="background:#C9A84C;display:inline-block;padding:4px 12px;margin:0 0 24px;">
            <p style="color:#0F0F0F;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0;">
              ${urgency}
            </p>
          </div>

          <h1 style="color:#F8F8F8;font-size:28px;font-weight:700;margin:0 0 8px;line-height:1.2;">
            ${event.title}
          </h1>

          <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:24px 0;"></div>

          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:12px;width:100px;">
                DATE
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${dateStr}
              </td>
            </tr>
            ${event.time ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:12px;">TIME</td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">${event.time}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:12px;">CITY</td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">${event.city}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#585858;font-size:12px;">VENUE</td>
              <td style="padding:10px 0;color:#F8F8F8;font-size:14px;">${event.venue}</td>
            </tr>
          </table>

          ${event.description ? `
          <p style="color:#A0A0A0;font-size:14px;line-height:1.7;margin:0 0 32px;">
            ${event.description}
          </p>
          ` : ''}

          <div style="text-align:center;margin:32px 0;">
            <a href="https://rfyglobal.org/events"
              style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              View Event Details →
            </a>
          </div>
        </div>

        <div style="padding:20px 40px;border-top:1px solid #1A1A1A;text-align:center;">
          <p style="color:#585858;font-size:11px;margin:0;">
            Room For You · rfyglobal.org ·
            <a href="https://rfyglobal.org/unsubscribe?email=${member.email}"
              style="color:#585858;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
```

---

## TASK 5 — Cron Job Routes

Create `src/app/api/cron/devotional/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDevotionalEmails } from '@/lib/emails/devotional'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendDailyDevotionalEmails()
  return NextResponse.json({ success: true, ...result })
}
```

Create `src/app/api/cron/event-reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendEventReminderEmails } from '@/lib/emails/event-reminder'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [weekResult, dayResult] = await Promise.all([
    sendEventReminderEmails('WEEK'),
    sendEventReminderEmails('DAY'),
  ])

  return NextResponse.json({ success: true, weekReminders: weekResult, dayReminders: dayResult })
}
```

---

## TASK 6 — Vercel Cron Config

Update `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["lhr1"],
  "crons": [
    {
      "path": "/api/cron/devotional",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/event-reminders",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Add to `.env.local` and Vercel env vars:
```env
CRON_SECRET=""   # generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## TASK 7 — Unsubscribe Route

Create `src/app/api/unsubscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  await db.communityMember.updateMany({
    where: { email },
    data: { isSubscribed: false },
  })

  return NextResponse.redirect(new URL('/unsubscribed', req.url))
}
```

Create `src/app/(public)/unsubscribed/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function UnsubscribedPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="label-text mb-6">Room For You</p>
          <h1 className="font-display text-4xl text-snow mb-4">Unsubscribed</h1>
          <div className="gold-line max-w-[80px] mx-auto mb-6 opacity-40" />
          <p className="font-body text-mist leading-relaxed">
            You have been unsubscribed from Room For You emails.
            You can re-join the community at any time.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

---

## TASK 8 — Join Page

Create `src/app/(public)/join/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { JoinPageClient } from '@/components/join/JoinPageClient'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join the Community — Room For You',
  description: 'Join Room For You — a community of young men and women singing songs of salvation, studying the Word, and getting others saved.',
}

export default async function JoinPage() {
  const extraFields = await db.joinFormField.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })

  const settings = await db.automationSettings.findFirst()
  const whatsappUrl = settings?.whatsappChannelUrl ?? ''

  return (
    <>
      <Navbar />
      <JoinPageClient extraFields={extraFields} whatsappUrl={whatsappUrl} />
      <Footer />
    </>
  )
}
```

---

## TASK 9 — JoinPageClient Component

Create `src/components/join/JoinPageClient.tsx`:

**Layout:** Full-screen split. Left 50% — bold animated text. Right 50% — the form. On mobile: stacked, text above form.

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { COUNTRIES, NIGERIA_STATES } from '@/lib/geo-data'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { JoinFormField } from '@prisma/client'

const MOVEMENT_LINES = [
  { text: 'A MOVEMENT', style: 'text-outline' },
  { text: 'OF YOUNG', style: 'text-snow' },
  { text: 'BELIEVERS', style: 'text-gold-gradient' },
  { text: 'ON FIRE', style: 'text-snow' },
  { text: 'FOR JESUS.', style: 'text-outline-gold' },
]

interface JoinPageClientProps {
  extraFields: JoinFormField[]
  whatsappUrl: string
}

export function JoinPageClient({ extraFields, whatsappUrl }: JoinPageClientProps) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', country: 'Nigeria', state: '', city: '',
  })
  const [extraValues, setExtraValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isNigeria = form.country === 'Nigeria'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.phone || !form.email || !form.country) {
      toast.error('Please fill in all required fields')
      return
    }
    if (isNigeria && !form.state) {
      toast.error('Please select your state')
      return
    }
    if (!isNigeria && !form.city) {
      toast.error('Please enter your city')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          extraFields: extraValues,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyRegistered) {
          toast.error('This email is already registered. Welcome back!')
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

  return (
    <main className="min-h-screen bg-void">
      <div className="flex flex-col lg:flex-row min-h-screen pt-20 lg:pt-0">

        {/* ── LEFT — Bold animated text ── */}
        <div className="relative lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-20 lg:py-0 overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute pointer-events-none animate-breathe"
            style={{
              width: '500px', height: '500px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="label-text mb-10"
            >
              Room For You
            </motion.p>

            <div className="space-y-1 mb-12">
              {MOVEMENT_LINES.map((line, i) => (
                <motion.h1
                  key={i}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 + i * 0.12,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className={`font-display font-bold leading-none ${line.style}`}
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}
                >
                  {line.text}
                </motion.h1>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <div className="gold-line-left w-16 mb-6 opacity-50" />
              <p className="font-body text-mist text-base leading-relaxed max-w-sm">
                Join a community of young men and women singing songs of salvation,
                studying the Word, praying, and getting others saved.
                <span className="text-gold"> Jesus to Nations.</span>
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.2 }}
              className="flex items-center gap-8 mt-10"
            >
              {[
                { value: '100M+', label: 'Streams' },
                { value: '600K+', label: 'Community' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-snow text-2xl font-semibold">{s.value}</p>
                  <p className="label-text opacity-50">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT — Form ── */}
        <div className="lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-12 lg:py-0"
          style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

          {!submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-md w-full mx-auto"
            >
              <p className="label-text mb-3">Join the Community</p>
              <h2 className="font-display text-3xl text-snow mb-2">
                There is room for you.
              </h2>
              <p className="font-body text-mist text-sm mb-10">
                Fill in your details below. It takes less than a minute.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                {/* Country */}
                <div>
                  <label style={labelStyle}>Country *</label>
                  <select
                    value={form.country}
                    onChange={e => setForm(p => ({ ...p, country: e.target.value, state: '', city: '' }))}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}
                        style={{ background: '#1A1A1A', color: '#F8F8F8' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nigeria state — conditional */}
                {isNigeria && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label style={labelStyle}>State *</label>
                    <select
                      value={form.state}
                      onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    >
                      <option value="" style={{ background: '#1A1A1A' }}>Select your state</option>
                      {NIGERIA_STATES.map(s => (
                        <option key={s} value={s} style={{ background: '#1A1A1A', color: '#F8F8F8' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* Other country city — conditional */}
                {!isNigeria && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <label style={labelStyle}>City *</label>
                    <input
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="Your city"
                      required
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    />
                  </motion.div>
                )}

                {/* Extra fields added by admin */}
                {extraFields.map(field => (
                  <div key={field.id}>
                    <label style={labelStyle}>
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {field.type === 'LONG_TEXT' ? (
                      <textarea
                        value={extraValues[field.id] ?? ''}
                        onChange={e => setExtraValues(p => ({ ...p, [field.id]: e.target.value }))}
                        placeholder={field.placeholder ?? ''}
                        required={field.required}
                        rows={3}
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    ) : (
                      <input
                        value={extraValues[field.id] ?? ''}
                        onChange={e => setExtraValues(p => ({ ...p, [field.id]: e.target.value }))}
                        placeholder={field.placeholder ?? ''}
                        required={field.required}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    )}
                  </div>
                ))}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 font-body font-semibold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                  style={{ background: '#C9A84C', color: '#0F0F0F' }}
                >
                  {submitting ? 'Joining…' : 'Join the Community →'}
                </button>

                <p className="font-body text-xs text-center" style={{ color: '#585858' }}>
                  By joining, you agree to receive emails from Room For You.
                  You can unsubscribe at any time.
                </p>
              </form>
            </motion.div>
          ) : (
            /* ── SUCCESS STATE ── */
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full mx-auto text-center"
            >
              {/* Gold check */}
              <div
                className="w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto mb-8"
                style={{ borderColor: '#C9A84C' }}
              >
                <span className="text-gold text-3xl">✓</span>
              </div>

              <div className="gold-line max-w-[60px] mx-auto mb-8 opacity-40" />

              <h2 className="font-display text-4xl text-snow mb-4">
                You're in.
              </h2>
              <p className="font-body text-mist leading-relaxed mb-10">
                Welcome to Room For You. Check your email for a confirmation
                and everything you need to get started.
                <span className="text-gold"> There is room for you here.</span>
              </p>

              {/* WhatsApp CTA */}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 font-body text-sm font-semibold tracking-widest uppercase transition-all duration-300 mb-6"
                  style={{ background: '#25D366', color: '#FFFFFF' }}
                >
                  Join our WhatsApp Community →
                </a>
              )}

              <div className="mt-4">
                <Link
                  href="/"
                  className="font-body text-sm tracking-widest uppercase"
                  style={{ color: '#C9A84C' }}
                >
                  ← Back to Home
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
```

---

## TASK 10 — Admin Members Page

Add Members to admin sidebar under OVERVIEW:
```typescript
{ label: 'Members', href: '/admin/members', icon: Users },
```

Create `src/app/admin/(dashboard)/members/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { MembersManager } from '@/components/admin/members/MembersManager'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const [members, total, extraFields] = await Promise.all([
    db.communityMember.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.communityMember.count(),
    db.joinFormField.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ])

  return <MembersManager initialMembers={members} total={total} extraFields={extraFields} />
}
```

Create `src/components/admin/members/MembersManager.tsx`:

This component must include:

**Header:**
- Title: "Community Members"
- Total count badge
- **Export CSV** button → GET `/api/join/members?format=csv`
- **Add Field** button → opens slide-in to add extra form fields

**Members Table:**
- Columns: Name, Email, Phone, Country, State/City, Joined, Subscribed
- Each row shows the member data clearly
- Subscribed toggle (PATCH to update isSubscribed)
- Pagination (load more button calls `/api/join/members?page=N`)

**Add Field Panel (slide-in):**
- Field label input
- Field type selector (Short Text, Long Text, Phone, Email, Number, Dropdown)
- Placeholder input
- Required toggle
- Save button → POST `/api/join/fields`
- After save, the new field immediately appears on the public `/join` form

```typescript
'use client'

import { useState } from 'react'
import { Plus, Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { CommunityMember, JoinFormField } from '@prisma/client'

interface MembersManagerProps {
  initialMembers: CommunityMember[]
  total: number
  extraFields: JoinFormField[]
}

export function MembersManager({ initialMembers, total, extraFields: initialFields }: MembersManagerProps) {
  const [members, setMembers] = useState(initialMembers)
  const [extraFields, setExtraFields] = useState(initialFields)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [addFieldOpen, setAddFieldOpen] = useState(false)

  // New field form state
  const [newField, setNewField] = useState({
    label: '', type: 'SHORT_TEXT', placeholder: '', required: false, order: extraFields.length,
  })
  const [savingField, setSavingField] = useState(false)

  const loadMore = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/join/members?page=${page + 1}`)
      const data = await res.json()
      setMembers(prev => [...prev, ...data.members])
      setPage(p => p + 1)
    } catch {
      toast.error('Failed to load more')
    } finally {
      setLoading(false)
    }
  }

  const saveField = async () => {
    if (!newField.label.trim()) { toast.error('Label is required'); return }
    setSavingField(true)
    try {
      const res = await fetch('/api/join/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newField),
      })
      if (!res.ok) throw new Error('Failed to save')
      const field = await res.json()
      setExtraFields(prev => [...prev, field])
      toast.success('Field added to join form')
      setAddFieldOpen(false)
      setNewField({ label: '', type: 'SHORT_TEXT', placeholder: '', required: false, order: extraFields.length + 1 })
    } catch {
      toast.error('Failed to add field')
    } finally {
      setSavingField(false)
    }
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
            Community Members
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
            {total.toLocaleString()} registered members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/join/members?format=csv"
            className="flex items-center gap-2 px-4 py-2.5 font-body text-sm border transition-all"
            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)', background: 'var(--a-surface)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--a-gold-border)'
              e.currentTarget.style.color = 'var(--a-gold)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--a-border)'
              e.currentTarget.style.color = 'var(--a-text-secondary)'
            }}
          >
            <Download size={14} /> Export CSV
          </a>
          <button
            onClick={() => setAddFieldOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 font-body text-sm font-medium text-white transition-all"
            style={{ background: 'var(--a-gold)' }}
          >
            <Plus size={14} /> Add Field
          </button>
        </div>
      </div>

      {/* Extra fields list */}
      {extraFields.length > 0 && (
        <div className="mb-6 p-4 border rounded-sm" style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}>
          <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--a-gold)' }}>
            Custom Fields on Join Form
          </p>
          <div className="flex flex-wrap gap-2">
            {extraFields.map(f => (
              <span key={f.id} className="font-body text-xs px-3 py-1 border"
                style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)', background: 'var(--a-surface)' }}>
                {f.label} {f.required ? '*' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr style={{ background: 'var(--a-sidebar)', borderBottom: `1px solid var(--a-border)` }}>
                {['Name', 'Email', 'Phone', 'Location', 'Joined', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest"
                    style={{ color: 'var(--a-gold)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id}
                  style={{
                    borderBottom: `1px solid var(--a-border)`,
                    background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)',
                  }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--a-text)' }}>{m.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>{m.email}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>{m.phone}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {m.state ? `${m.state}, ${m.country}` : m.city ? `${m.city}, ${m.country}` : m.country}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-muted)' }}>
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase"
                      style={{
                        background: m.isSubscribed ? 'var(--a-gold-light)' : 'var(--a-sidebar)',
                        color: m.isSubscribed ? 'var(--a-gold)' : 'var(--a-text-muted)',
                        border: `1px solid ${m.isSubscribed ? 'var(--a-gold-border)' : 'var(--a-border)'}`,
                      }}>
                      {m.isSubscribed ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length < total && (
          <div className="p-4 text-center border-t" style={{ borderColor: 'var(--a-border)' }}>
            <button
              onClick={loadMore}
              disabled={loading}
              className="font-body text-sm transition-colors disabled:opacity-40"
              style={{ color: 'var(--a-gold)' }}
            >
              {loading ? 'Loading…' : `Load more (${total - members.length} remaining)`}
            </button>
          </div>
        )}
      </div>

      {/* Add Field Panel */}
      <AnimatePresence>
        {addFieldOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddFieldOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
              style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
            >
              <div className="p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
                    Add Field to Join Form
                  </h3>
                  <button onClick={() => setAddFieldOpen(false)}
                    style={{ color: 'var(--a-text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="h-px" style={{ background: 'var(--a-border)' }} />

                <div>
                  <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
                    style={{ color: 'var(--a-text-secondary)' }}>Field Label *</label>
                  <input
                    value={newField.label}
                    onChange={e => setNewField(p => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. What are your expectations?"
                    className="w-full border px-4 py-3 font-body text-sm focus:outline-none transition-colors"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
                    style={{ color: 'var(--a-text-secondary)' }}>Field Type</label>
                  <select
                    value={newField.type}
                    onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}
                    className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                  >
                    <option value="SHORT_TEXT">Short Text</option>
                    <option value="LONG_TEXT">Long Text</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="NUMBER">Number</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
                    style={{ color: 'var(--a-text-secondary)' }}>Placeholder</label>
                  <input
                    value={newField.placeholder}
                    onChange={e => setNewField(p => ({ ...p, placeholder: e.target.value }))}
                    placeholder="Optional placeholder text"
                    className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewField(p => ({ ...p, required: !p.required }))}
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ background: newField.required ? 'var(--a-gold)' : 'var(--a-border)' }}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${newField.required ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm font-body" style={{ color: 'var(--a-text-secondary)' }}>Required</span>
                </div>

                <button
                  onClick={saveField}
                  disabled={savingField}
                  className="w-full py-3 font-body font-medium text-sm tracking-widest uppercase text-white transition-colors disabled:opacity-40"
                  style={{ background: 'var(--a-gold)' }}
                >
                  {savingField ? 'Adding…' : 'Add to Join Form'}
                </button>

                <p className="text-xs font-body" style={{ color: 'var(--a-text-muted)' }}>
                  This field will immediately appear on the public /join page for new registrations.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## TASK 11 — Admin Automation Settings Page

Create `src/app/admin/(dashboard)/automation/page.tsx` and add to sidebar under SETTINGS:
```typescript
{ label: 'Automation', href: '/admin/automation', icon: Zap },
```

The automation page shows:
- WhatsApp channel URL input (saved to `AutomationSettings`)
- Toggle for devotional emails on/off
- Toggle for event reminder emails on/off
- Last sent info from `EmailLog`
- Manual trigger buttons for testing: "Send Today's Devotional Now" + "Check Event Reminders Now"

```typescript
import { db } from '@/lib/db'
import { AutomationManager } from '@/components/admin/automation/AutomationManager'

export const dynamic = 'force-dynamic'

export default async function AutomationPage() {
  let settings = await db.automationSettings.findFirst()
  if (!settings) {
    settings = await db.automationSettings.create({
      data: {
        whatsappChannelUrl: '',
        devotionalEmailTime: '07:00',
        isDevotionalActive: true,
        isEventReminderActive: true,
      },
    })
  }

  const recentLogs = await db.emailLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 10,
    include: { member: { select: { name: true, email: true } } },
  })

  return <AutomationManager settings={settings} recentLogs={recentLogs} />
}
```

Create `src/components/admin/automation/AutomationManager.tsx`:

This component includes:
- WhatsApp URL form (save to `/api/automation/settings`)
- Devotional toggle
- Event reminder toggle
- "Send test devotional" button → POST `/api/cron/devotional` (admin only, no cron auth needed)
- Recent email log table showing: type, subject, sent time, status

---

## TASK 12 — Automation Settings API

Create `src/app/api/automation/settings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const existing = await db.automationSettings.findFirst()
  const settings = existing
    ? await db.automationSettings.update({ where: { id: existing.id }, data: body })
    : await db.automationSettings.create({ data: body })

  return NextResponse.json(settings)
}
```

Create admin cron trigger route `src/app/api/admin/cron/[type]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendDailyDevotionalEmails } from '@/lib/emails/devotional'
import { sendEventReminderEmails } from '@/lib/emails/event-reminder'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { type: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (params.type === 'devotional') {
    const result = await sendDailyDevotionalEmails()
    return NextResponse.json({ success: true, ...result })
  }

  if (params.type === 'event-reminders') {
    const [week, day] = await Promise.all([
      sendEventReminderEmails('WEEK'),
      sendEventReminderEmails('DAY'),
    ])
    return NextResponse.json({ success: true, week, day })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
```

---

## TASK 13 — Update Navbar Join Link

Open `src/components/layout/Navbar.tsx`.

The "Join Us" CTA button currently links to `/forms/join-room-for-you`. Update it to link to `/join`:

```typescript
// BEFORE:
href="/forms/join-room-for-you"

// AFTER:
href="/join"
```

Also update the mobile menu join link to `/join`.

---

## TASK 14 — Update Landing Page CTAs

Find all instances of `/forms/join-room-for-you` across the codebase and replace with `/join`:

```bash
# Files to check:
src/components/landing/Hero.tsx
src/components/landing/CTASection.tsx
src/components/confession/ConfessionPageClient.tsx
src/components/about/AboutClient.tsx
src/app/(public)/about/page.tsx
```

---

## TASK 15 — Update Admin Dashboard Member Count

Open `src/app/admin/(dashboard)/page.tsx`.

The "Community Members" stat currently counts `formSubmission` where slug contains 'join'. Update it to count `CommunityMember` directly:

```typescript
// BEFORE:
db.formSubmission.count({
  where: { form: { slug: { contains: 'join' } } },
})

// AFTER:
db.communityMember.count()
```

---

## PHASE 13 COMPLETION CHECKLIST

**Join Page**
- [ ] `/join` loads with split layout (bold text left, form right)
- [ ] All 5 animated headline lines render correctly
- [ ] Country dropdown shows Nigeria first, then all countries alphabetically
- [ ] Selecting Nigeria shows state dropdown (animated entrance)
- [ ] Selecting any other country shows city text input (animated entrance)
- [ ] Form submits successfully and shows thank-you screen
- [ ] WhatsApp button shows on thank-you screen (when URL is configured)
- [ ] Duplicate email shows appropriate error message

**Email Automation**
- [ ] Confirmation email sends immediately on join
- [ ] Confirmation email renders correctly with WhatsApp CTA
- [ ] Daily devotional cron route exists at `/api/cron/devotional`
- [ ] Event reminder cron route exists at `/api/cron/event-reminders`
- [ ] `vercel.json` cron schedule configured
- [ ] Unsubscribe link works and redirects to `/unsubscribed`

**Admin**
- [ ] `/admin/members` shows all community members
- [ ] Export CSV downloads correctly
- [ ] "Add Field" panel works — new field appears on `/join` immediately
- [ ] `/admin/automation` loads with WhatsApp URL form
- [ ] Automation toggles save correctly
- [ ] Manual "Send test" button works
- [ ] Email log shows recent sends
- [ ] Dashboard home member count pulls from `CommunityMember` table

**General**
- [ ] All CTA links updated from `/forms/join-room-for-you` to `/join`
- [ ] `npx prisma db push` applies new models
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `CommunityMember` model uses `email` as `@unique` — duplicate registrations return a 409 with `alreadyRegistered: true`. The frontend handles this gracefully without crashing.
- The `AutomationSettings` table is designed as a singleton — there is always exactly one row. The API uses `findFirst()` + upsert pattern to ensure this.
- Cron jobs on Vercel free tier run at most once per day — the `0 6 * * *` schedule (6am UTC = 7am WAT) is appropriate for Nigerian users. Vercel crons require the project to be on a paid plan for guaranteed execution — flag this to Nony.
- The `sendDailyDevotionalEmails` function sends in batches of 50 using `Promise.all` per batch. With 15 demo members this is fine. At scale (1000+ members) consider moving to a queue system.
- `CRON_SECRET` must be added to Vercel environment variables and `.env.local`. Generate it with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- The WhatsApp channel URL is stored in `AutomationSettings` — admin must go to `/admin/automation` and save the URL before the confirmation email shows the WhatsApp button.
- All CTA links site-wide now point to `/join` not `/forms/join-room-for-you`. The old form builder join form can remain in the system but is no longer the primary registration path.
