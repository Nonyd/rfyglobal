# ROOM FOR YOU — Automation System Cursor Prompt
## Birthday Wishes · Welcome Email · Event Reminder · Daily Scripture · Daily Study · Live Chat Alert

---

## CONTEXT

Build a full automation system wired to the existing `/admin/automation` page. Each automation has an **on/off toggle** so admin can enable or disable without touching code. All automations send emails via Brevo using the existing `sendEmail` helper.

**Automations to build:**
1. **Birthday Wishes** — daily cron, sends personalized birthday email to any member whose date of birth matches today's date (from any form submission that collected DOB)
2. **Welcome Email** — sends when someone joins via the join form (`/join`)
3. **Event Reminder** — sends 24 hours before an event to all registered attendees
4. **Daily Scripture** — sends today's published scripture from the Word page to all community members
5. **Daily Study** — sends today's published study material to all community members

**Live Chat Alert** — sends admin an email on every new chat message (separate from automations)

---

## TASK 1 — Automation Settings Schema

Open `prisma/schema.prisma`.

Add an `AutomationSetting` model to store each automation's on/off state and config:

```prisma
model AutomationSetting {
  id          String   @id @default(cuid())
  key         String   @unique  // 'birthday', 'welcome', 'event_reminder', 'daily_scripture', 'daily_study'
  enabled     Boolean  @default(false)
  config      Json?    // Optional JSON config per automation
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}
```

Run: `npx prisma db push`

---

## TASK 2 — Automation Settings API

Create `src/app/api/admin/automations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AUTOMATION_KEYS = ['birthday', 'welcome', 'event_reminder', 'daily_scripture', 'daily_study']

// GET — return all automation settings
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Upsert defaults for any missing keys
  for (const key of AUTOMATION_KEYS) {
    await db.automationSetting.upsert({
      where: { key },
      create: { key, enabled: false },
      update: {},
    })
  }

  const settings = await db.automationSetting.findMany({
    where: { key: { in: AUTOMATION_KEYS } },
    orderBy: { key: 'asc' },
  })

  return NextResponse.json(settings)
}

// POST — toggle or update an automation
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, enabled, config } = await req.json()

  if (!AUTOMATION_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Invalid automation key' }, { status: 400 })
  }

  const setting = await db.automationSetting.upsert({
    where: { key },
    create: { key, enabled, config: config ?? undefined },
    update: { enabled, ...(config !== undefined ? { config } : {}) },
  })

  return NextResponse.json(setting)
}
```

Also add POST handler via method override (Cloudflare WAF fix — same pattern as other routes).

---

## TASK 3 — Automation Helper

Create `src/lib/automations.ts`:

```typescript
import { db } from './db'

export async function isAutomationEnabled(key: string): Promise<boolean> {
  try {
    const setting = await db.automationSetting.findUnique({ where: { key } })
    return setting?.enabled ?? false
  } catch {
    return false
  }
}
```

---

## TASK 4 — Cron Endpoint

Create `src/app/api/cron/automations/route.ts`:

This endpoint runs daily automations. It should be called by a cron job (set up via Webuzo cron or external service like cron-job.org).

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAutomationEnabled } from '@/lib/automations'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Secure with CRON_SECRET
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, string> = {}

  // 1. Birthday Wishes
  if (await isAutomationEnabled('birthday')) {
    results.birthday = await runBirthdayAutomation()
  }

  // 2. Daily Scripture
  if (await isAutomationEnabled('daily_scripture')) {
    results.daily_scripture = await runDailyScriptureAutomation()
  }

  // 3. Daily Study
  if (await isAutomationEnabled('daily_study')) {
    results.daily_study = await runDailyStudyAutomation()
  }

  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() })
}
```

---

## TASK 5 — Birthday Wishes Automation

Add `runBirthdayAutomation` to the cron route or a separate file `src/lib/automation-runners/birthday.ts`:

```typescript
export async function runBirthdayAutomation(): Promise<string> {
  try {
    const today = new Date()
    const todayMonth = today.getMonth() + 1  // 1-12
    const todayDay = today.getDate()

    // Find all form submissions that have a dateOfBirth field matching today's month and day
    // Date of birth is stored in form submissions as a field value
    const submissions = await db.formSubmission.findMany({
      include: {
        values: { include: { field: true } },
        form: true,
      },
    })

    let sent = 0

    for (const submission of submissions) {
      // Find DOB field value
      const dobValue = submission.values.find(v =>
        v.field.type === 'DATE' &&
        (v.field.label.toLowerCase().includes('birth') ||
         v.field.label.toLowerCase().includes('dob'))
      )

      if (!dobValue?.value) continue

      const dob = new Date(dobValue.value)
      if (isNaN(dob.getTime())) continue

      // Check if today is their birthday (ignore year)
      if (dob.getMonth() + 1 !== todayMonth || dob.getDate() !== todayDay) continue

      // Get their name and email from other fields
      const nameValue = submission.values.find(v =>
        v.field.label.toLowerCase().includes('name')
      )
      const emailValue = submission.values.find(v =>
        v.field.type === 'EMAIL'
      )

      if (!emailValue?.value) continue

      const name = nameValue?.value?.split(' ')[0] ?? 'Friend'

      await sendEmail({
        to: emailValue.value,
        subject: `Happy Birthday, ${name}! 🎂`,
        html: buildBirthdayEmail(name),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })

      sent++
    }

    return `${sent} birthday wishes sent`
  } catch (error) {
    console.error('[automation:birthday]', error)
    return `Error: ${error}`
  }
}

function buildBirthdayEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Happy Birthday</p>
      <h1 style="font-size:32px;margin:0 0 16px;line-height:1.2;">
        🎂 Happy Birthday, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
        On your special day, the entire Room For You family celebrates you. 
        May this year be filled with God's grace, joy, and every good thing He has promised you.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        <em>"This is the day the Lord has made; let us rejoice and be glad in it."</em><br/>
        <span style="color:#585858;font-size:13px;">— Psalm 118:24</span>
      </p>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}
```

---

## TASK 6 — Welcome Email Automation

Open `src/app/api/join/route.ts` or wherever join form submissions are processed.

After successfully saving a new member, check if welcome automation is enabled and send:

```typescript
import { isAutomationEnabled } from '@/lib/automations'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

// After saving member:
if (await isAutomationEnabled('welcome')) {
  const firstName = member.name?.split(' ')[0] ?? 'Friend'
  await sendEmail({
    to: member.email,
    subject: `Welcome to Room For You, ${firstName}! 🙏`,
    html: buildWelcomeEmail(firstName),
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  }).catch(err => console.error('[automation:welcome]', err))
}
```

Create `src/lib/automation-runners/welcome.ts`:

```typescript
export function buildWelcomeEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Welcome</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        Welcome to Room For You, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        We are so glad you are here. Room For You is a community of young men and women 
        singing songs of salvation, studying the Word, and getting others saved.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        There is room for you — in worship, in prayer, in community, and in the purposes of God.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px;">
        <a href="https://rfyglobal.org/events" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
          Upcoming Events →
        </a>
        <a href="https://rfyglobal.org/word" style="display:inline-block;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
          Daily Word
        </a>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>Minister Yadah & The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}
```

---

## TASK 7 — Event Reminder Automation

Create `src/lib/automation-runners/event-reminder.ts`.

This runs via a separate cron endpoint or as part of the daily cron — it checks for events happening in the next 24 hours and emails all registered attendees:

```typescript
export async function runEventReminderAutomation(): Promise<string> {
  try {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000)

    // Find events starting in the next 23-24 hours (1-hour window to avoid double-sending)
    const events = await db.event.findMany({
      where: {
        date: { gte: in23Hours, lte: in24Hours },
        isPublished: true,
      },
      include: {
        registrations: true,
      },
    })

    let sent = 0

    for (const event of events) {
      for (const registration of event.registrations) {
        if (!registration.email) continue

        const firstName = registration.name?.split(' ')[0] ?? 'Friend'
        const eventDate = new Date(event.date)
        const formattedDate = eventDate.toLocaleDateString('en-NG', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
        const formattedTime = eventDate.toLocaleTimeString('en-NG', {
          hour: '2-digit', minute: '2-digit',
        })

        await sendEmail({
          to: registration.email,
          subject: `Reminder: ${event.title} is tomorrow! 🙏`,
          html: buildEventReminderEmail(firstName, event, formattedDate, formattedTime),
          fromName: EMAIL_SENDERS.events.name,
          fromEmail: EMAIL_SENDERS.events.email,
        })

        sent++
      }
    }

    return `${sent} event reminders sent for ${events.length} events`
  } catch (error) {
    console.error('[automation:event_reminder]', error)
    return `Error: ${error}`
  }
}

function buildEventReminderEmail(
  firstName: string,
  event: any,
  formattedDate: string,
  formattedTime: string
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Event Reminder</p>
      <h1 style="font-size:24px;margin:0 0 8px;">See you tomorrow, ${firstName}!</h1>
      <h2 style="font-size:20px;color:#E8001C;margin:0 0 24px;">${event.title}</h2>
      <div style="background:#1A1A1A;padding:20px;margin-bottom:24px;border-left:3px solid #E8001C;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Time:</strong> ${formattedTime}</p>
        ${event.location ? `<p style="margin:0;font-size:14px;"><strong>Location:</strong> ${event.location}</p>` : ''}
      </div>
      ${event.description ? `<p style="color:#A0A0A0;font-size:14px;line-height:1.7;margin:0 0 24px;">${event.description}</p>` : ''}
      <a href="https://rfyglobal.org/events/${event.slug}" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;margin-bottom:32px;">
        View Event Details →
      </a>
      <p style="color:#F8F8F8;font-size:14px;">See you there,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org</p>
      </div>
    </div>
  `
}
```

Add `runEventReminderAutomation` to the cron endpoint.

---

## TASK 8 — Daily Scripture Automation

Add `runDailyScriptureAutomation` to `src/lib/automation-runners/daily-scripture.ts`:

```typescript
export async function runDailyScriptureAutomation(): Promise<string> {
  try {
    // Get today's published scripture
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const scripture = await db.scripture.findFirst({
      where: {
        isPublished: true,
        date: { gte: today, lt: tomorrow },
      },
    })

    if (!scripture) return 'No scripture published for today'

    // Get all community members
    const members = await db.communityMember.findMany({
      where: { email: { not: '' } },
      select: { email: true, name: true },
    })

    let sent = 0
    for (const member of members) {
      if (!member.email) continue
      const firstName = member.name?.split(' ')[0] ?? 'Friend'

      await sendEmail({
        to: member.email,
        subject: `Today's Word — ${scripture.reference ?? 'Daily Scripture'}`,
        html: buildDailyScriptureEmail(firstName, scripture),
        fromName: EMAIL_SENDERS.word.name,
        fromEmail: EMAIL_SENDERS.word.email,
      })
      sent++
    }

    return `Daily scripture sent to ${sent} members`
  } catch (error) {
    console.error('[automation:daily_scripture]', error)
    return `Error: ${error}`
  }
}

function buildDailyScriptureEmail(firstName: string, scripture: any): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Daily Word</p>
      <p style="font-size:14px;color:#A0A0A0;margin:0 0 24px;">Good morning, ${firstName} 🌅</p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:24px;margin-bottom:24px;">
        <p style="font-size:18px;line-height:1.7;font-style:italic;margin:0 0 12px;">"${scripture.verse}"</p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">${scripture.reference}</p>
      </div>
      ${scripture.reflection ? `
        <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0 0 24px;">${scripture.reflection}</p>
      ` : ''}
      <a href="https://rfyglobal.org/word" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
        Read More on the Word Page →
      </a>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · <a href="https://rfyglobal.org/unsubscribe" style="color:#585858;">Unsubscribe</a></p>
      </div>
    </div>
  `
}
```

---

## TASK 9 — Daily Study Automation

Same pattern as Daily Scripture. Add `runDailyStudyAutomation` to `src/lib/automation-runners/daily-study.ts`:

```typescript
export async function runDailyStudyAutomation(): Promise<string> {
  try {
    // Get today's published study material
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check the study model — find published study for today
    const study = await db.studyMaterial.findFirst({
      where: {
        isPublished: true,
        publishedAt: { gte: today, lt: tomorrow },
      },
    }) ?? await db.studyMaterial.findFirst({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    })

    if (!study) return 'No study material available'

    const members = await db.communityMember.findMany({
      where: { email: { not: '' } },
      select: { email: true, name: true },
    })

    let sent = 0
    for (const member of members) {
      if (!member.email) continue
      const firstName = member.name?.split(' ')[0] ?? 'Friend'

      await sendEmail({
        to: member.email,
        subject: `Today's Study — ${study.title}`,
        html: buildDailyStudyEmail(firstName, study),
        fromName: EMAIL_SENDERS.word.name,
        fromEmail: EMAIL_SENDERS.word.email,
      })
      sent++
    }

    return `Daily study sent to ${sent} members`
  } catch (error) {
    console.error('[automation:daily_study]', error)
    return `Error: ${error}`
  }
}

function buildDailyStudyEmail(firstName: string, study: any): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Daily Study</p>
      <p style="font-size:14px;color:#A0A0A0;margin:0 0 24px;">Good morning, ${firstName} 📖</p>
      <h2 style="font-size:22px;margin:0 0 16px;line-height:1.3;">${study.title}</h2>
      ${study.excerpt || study.description ? `
        <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0 0 24px;">${study.excerpt ?? study.description}</p>
      ` : ''}
      <a href="https://rfyglobal.org/study" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
        Continue Studying →
      </a>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · <a href="https://rfyglobal.org/unsubscribe" style="color:#585858;">Unsubscribe</a></p>
      </div>
    </div>
  `
}
```

---

## TASK 10 — Live Chat Email Alert

Open `src/app/api/chat/[sessionToken]/route.ts`.

In the POST handler (visitor sends a message), after saving the message, always send admin an email:

```typescript
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

// After saving message, send admin alert:
try {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@rfyglobal.org'
  
  await sendEmail({
    to: adminEmail,
    subject: `💬 New chat message from ${session.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;">
        <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:40px;margin-bottom:24px;display:block;" />
        <p style="color:#E8001C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">New Live Chat</p>
        <p style="font-size:15px;margin:0 0 8px;"><strong>${session.name}</strong> (${session.email}) sent a message:</p>
        <div style="background:#1A1A1A;border-left:3px solid #E8001C;padding:16px 20px;margin:16px 0 24px;">
          <p style="margin:0;font-size:14px;line-height:1.7;">${body.trim().replace(/\n/g, '<br>')}</p>
        </div>
        <a href="https://rfyglobal.org/admin/live-chat" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
          Reply Now →
        </a>
        <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You Admin · rfyglobal.org</p>
      </div>
    `,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  })
} catch (err) {
  console.error('[chat] admin email alert failed:', err)
}
```

Also do the same in `src/app/api/chat/session/route.ts` (new session start):

```typescript
// Send admin email when a new chat session starts:
await sendEmail({
  to: adminEmail,
  subject: `💬 New chat started by ${session.name}`,
  // ... same template but says "started a chat"
})
```

---

## TASK 11 — Admin Automation UI

Open `src/app/admin/(dashboard)/automation/page.tsx` or `src/components/admin/AutomationManager.tsx`.

Replace or update the automation UI to show all 5 automations as toggle cards:

```typescript
const AUTOMATIONS = [
  {
    key: 'birthday',
    title: 'Birthday Wishes',
    description: 'Automatically sends a personalized birthday email to anyone who provided their date of birth in a form.',
    icon: '🎂',
    badge: 'Daily Cron',
  },
  {
    key: 'welcome',
    title: 'Welcome Email',
    description: 'Sends a warm welcome email when someone joins the community via the join form.',
    icon: '👋',
    badge: 'On Join',
  },
  {
    key: 'event_reminder',
    title: 'Event Reminders',
    description: 'Sends a reminder email to all registered attendees 24 hours before each event.',
    icon: '📅',
    badge: 'Daily Cron',
  },
  {
    key: 'daily_scripture',
    title: 'Daily Scripture',
    description: "Sends today's published scripture from the Word page to all community members every morning.",
    icon: '📖',
    badge: 'Daily Cron',
  },
  {
    key: 'daily_study',
    title: 'Daily Study',
    description: "Sends today's study material to all community members every morning.",
    icon: '✍️',
    badge: 'Daily Cron',
  },
]
```

Each automation card shows:
- Icon + title + badge (Daily Cron / On Join)
- Description
- **AdminToggle** — on/off switch
- Toggle saves immediately via `POST /api/admin/automations`
- Toast confirms save

---

## TASK 12 — Set Up Cron Job on Server

Add instructions in a comment at the top of the cron route:

```typescript
/**
 * CRON SETUP — Run daily at 8:00 AM Nigeria time (7:00 AM UTC)
 * 
 * Add to Webuzo cron jobs:
 * 0 7 * * * curl -s "https://rfyglobal.org/api/cron/automations?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
 * 
 * Or use cron-job.org (free external cron service):
 * URL: https://rfyglobal.org/api/cron/automations?secret=YOUR_CRON_SECRET
 * Schedule: Every day at 07:00 UTC
 */
```

The `CRON_SECRET` is already in `.env` — use the existing value.

---

## COMPLETION CHECKLIST

**Schema & API**
- [ ] `AutomationSetting` model added to schema
- [ ] `npx prisma db push` run
- [ ] `GET /api/admin/automations` returns all 5 settings
- [ ] `POST /api/admin/automations` toggles on/off

**Automations**
- [ ] Birthday — checks DOB field in form submissions, sends on matching day
- [ ] Welcome — fires on join form submission when enabled
- [ ] Event Reminder — sends 24h before events to all registrations
- [ ] Daily Scripture — sends today's scripture to all members
- [ ] Daily Study — sends today's study to all members

**Live Chat Alert**
- [ ] Admin receives email on every new chat message
- [ ] Admin receives email on new chat session start
- [ ] Email has "Reply Now →" link to `/admin/live-chat`

**Admin UI**
- [ ] 5 automation cards on `/admin/automation`
- [ ] Each card has on/off toggle
- [ ] Toggle saves immediately
- [ ] Toast confirms save
- [ ] Cards show icon, title, description, badge

**Cron**
- [ ] `GET /api/cron/automations?secret=CRON_SECRET` runs all enabled daily automations
- [ ] Returns results summary
- [ ] Secured by CRON_SECRET

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `AutomationSetting` model uses `key` as unique identifier — `upsert` on key so we never get duplicates
- Birthday automation: DOB is stored as a form submission field value, not on a Member model. Search all form submissions for fields with type `DATE` and label containing "birth" or "dob". This is intentional — the spec says "any form that asks DOB".
- Welcome email fires inside the join API route when `isAutomationEnabled('welcome')` returns true. Wrap in try/catch so a failed email never breaks join.
- Event reminder: use a 1-hour window (`in23Hours` to `in24Hours`) to avoid double-sending if cron runs at slightly different times.
- Daily Scripture and Daily Study: check for today's published content first. If none, skip (don't send yesterday's).
- The live chat email alert fires on EVERY message — this was the spec. Keep it in try/catch so email failure never blocks the chat.
- Cron is secured by `CRON_SECRET` env var — already exists in the app.
- After deploying, set up the cron job on Webuzo or cron-job.org pointing to `https://rfyglobal.org/api/cron/automations?secret=YOUR_CRON_SECRET`.
