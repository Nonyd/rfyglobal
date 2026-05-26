# ROOM FOR YOU — Special Date Automations + Full Template Editor Cursor Prompt
## Christmas · New Year · Easter · All Automation Templates Editable

---

## CONTEXT

Two additions:

1. **Special date automations** — Christmas (Dec 25), New Year (Jan 1), and Easter (admin-set date) send greetings to all community members. Each has an on/off toggle in `/admin/automation`.

2. **All automation email templates editable** — Every automation email (birthday, welcome, event reminder, daily scripture, daily study, Christmas, New Year, Easter) must have an editable template in `/admin/email-templates` using the Unlayer editor.

---

## TASK 1 — Add Special Date Automations to AutomationSetting

The `AutomationSetting` model already exists. Add three new keys:

```typescript
const AUTOMATION_KEYS = [
  'birthday',
  'welcome',
  'event_reminder',
  'daily_scripture',
  'daily_study',
  'christmas',    // ← new
  'new_year',     // ← new
  'easter',       // ← new
]
```

Update `src/app/api/admin/automations/route.ts` to include the new keys.

---

## TASK 2 — Easter Date Setting

Easter's date changes every year — admin must set it.

Open `src/app/api/admin/automations/route.ts`.

The `AutomationSetting` model has a `config` JSON field. Store the Easter date there:

```typescript
// Easter config example:
{
  "easterDate": "2026-04-05"  // ISO date string, admin sets this each year
}
```

In the admin automation UI, the Easter card shows a date input when enabled:

```typescript
// Easter card UI:
{
  key: 'easter',
  title: 'Easter Greetings',
  description: 'Send Easter greetings to all community members. Set the Easter date each year.',
  icon: '✝️',
  badge: 'Annual',
  hasDateConfig: true,  // shows date picker
  configLabel: 'Easter Date this year',
}
```

---

## TASK 3 — Add Special Date Automation Runners

Create `src/lib/automation-runners/special-dates.ts`:

```typescript
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

async function getAllMemberEmails(): Promise<{ email: string; name: string }[]> {
  const members = await db.communityMember.findMany({
    where: { email: { not: '' } },
    select: { email: true, name: true },
  })
  return members.filter(m => m.email?.trim())
}

// ── Christmas ────────────────────────────────────────────────
export async function runChristmasAutomation(): Promise<string> {
  try {
    const today = new Date()
    if (today.getMonth() + 1 !== 12 || today.getDate() !== 25) {
      return 'Not Christmas today — skipped'
    }

    const members = await getAllMemberEmails()
    let sent = 0

    for (const member of members) {
      const firstName = member.name?.split(' ')[0] ?? 'Friend'
      await sendEmail({
        to: member.email,
        subject: `Merry Christmas, ${firstName}! 🎄`,
        html: buildChristmasEmail(firstName),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
      sent++
    }

    return `Christmas greetings sent to ${sent} members`
  } catch (error) {
    console.error('[automation:christmas]', error)
    return `Error: ${error}`
  }
}

// ── New Year ─────────────────────────────────────────────────
export async function runNewYearAutomation(): Promise<string> {
  try {
    const today = new Date()
    if (today.getMonth() + 1 !== 1 || today.getDate() !== 1) {
      return 'Not New Year today — skipped'
    }

    const members = await getAllMemberEmails()
    let sent = 0

    for (const member of members) {
      const firstName = member.name?.split(' ')[0] ?? 'Friend'
      await sendEmail({
        to: member.email,
        subject: `Happy New Year, ${firstName}! 🎉`,
        html: buildNewYearEmail(firstName),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
      sent++
    }

    return `New Year greetings sent to ${sent} members`
  } catch (error) {
    console.error('[automation:new_year]', error)
    return `Error: ${error}`
  }
}

// ── Easter ───────────────────────────────────────────────────
export async function runEasterAutomation(): Promise<string> {
  try {
    // Get Easter date from config
    const setting = await db.automationSetting.findUnique({
      where: { key: 'easter' },
    })

    const config = setting?.config as { easterDate?: string } | null
    if (!config?.easterDate) {
      return 'Easter date not set — go to Admin → Automation → Easter to set the date'
    }

    const easterDate = new Date(config.easterDate)
    const today = new Date()

    if (
      easterDate.getMonth() !== today.getMonth() ||
      easterDate.getDate() !== today.getDate()
    ) {
      return 'Not Easter today — skipped'
    }

    const members = await getAllMemberEmails()
    let sent = 0

    for (const member of members) {
      const firstName = member.name?.split(' ')[0] ?? 'Friend'
      await sendEmail({
        to: member.email,
        subject: `Happy Easter, ${firstName}! ✝️`,
        html: buildEasterEmail(firstName),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
      sent++
    }

    return `Easter greetings sent to ${sent} members`
  } catch (error) {
    console.error('[automation:easter]', error)
    return `Error: ${error}`
  }
}

// ── Email templates ──────────────────────────────────────────
function buildChristmasEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Merry Christmas</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        🎄 Merry Christmas, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        On this glorious day, we celebrate the greatest gift ever given — 
        Jesus Christ, born for our salvation.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        May this Christmas fill your heart with joy, your home with peace, 
        and your spirit with the wonder of God's love.
      </p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:20px;margin:0 0 32px;">
        <p style="font-size:16px;line-height:1.7;font-style:italic;margin:0 0 8px;">
          "For unto us a child is born, unto us a son is given…"
        </p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">— Isaiah 9:6</p>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}

function buildNewYearEmail(firstName: string): string {
  const year = new Date().getFullYear()
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Happy New Year</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        🎉 Happy New Year, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        Welcome to ${year}! A brand new year, full of God's mercies and new beginnings.
        We believe this will be your greatest year yet.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        May God's favour go before you in everything you do this year.
      </p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:20px;margin:0 0 32px;">
        <p style="font-size:16px;line-height:1.7;font-style:italic;margin:0 0 8px;">
          "Behold, I am doing a new thing; now it springs forth, do you not perceive it?"
        </p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">— Isaiah 43:19</p>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}

function buildEasterEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Happy Easter</p>
      <h1 style="font-size:28px;margin:0 0 16px;line-height:1.2;">
        ✝️ He is Risen, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 20px;">
        Today we celebrate the resurrection of Jesus Christ — the greatest victory 
        in all of history. Because He lives, we live. Because He rose, we rise.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        Happy Easter from all of us at Room For You. May the power of the resurrection 
        be real and alive in your life today.
      </p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:20px;margin:0 0 32px;">
        <p style="font-size:16px;line-height:1.7;font-style:italic;margin:0 0 8px;">
          "He is not here; he has risen, just as he said."
        </p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">— Matthew 28:6</p>
      </div>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}
```

---

## TASK 4 — Wire Special Dates into Cron

Open `src/app/api/cron/automations/route.ts`.

Add the three new runners:

```typescript
import {
  runChristmasAutomation,
  runNewYearAutomation,
  runEasterAutomation,
} from '@/lib/automation-runners/special-dates'

// In the GET handler, add after existing automations:
if (await isAutomationEnabled('christmas')) {
  results.christmas = await runChristmasAutomation()
}

if (await isAutomationEnabled('new_year')) {
  results.new_year = await runNewYearAutomation()
}

if (await isAutomationEnabled('easter')) {
  results.easter = await runEasterAutomation()
}
```

---

## TASK 5 — Update Admin Automation UI

Open `src/app/admin/(dashboard)/automation/page.tsx` or `AutomationManager` component.

Add the three new automation cards to `AUTOMATIONS`:

```typescript
{
  key: 'christmas',
  title: 'Christmas Greetings',
  description: 'Sends Christmas greetings to all community members on December 25th every year.',
  icon: '🎄',
  badge: 'Dec 25',
},
{
  key: 'new_year',
  title: 'New Year Greetings',
  description: 'Sends New Year greetings to all community members on January 1st every year.',
  icon: '🎉',
  badge: 'Jan 1',
},
{
  key: 'easter',
  title: 'Easter Greetings',
  description: 'Sends Easter greetings to all community members. Set the Easter date each year below.',
  icon: '✝️',
  badge: 'Annual',
  hasDateConfig: true,
},
```

For the **Easter card**, when enabled, show a date input below the toggle:

```typescript
{automation.key === 'easter' && settings[automation.key]?.enabled && (
  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--a-border)' }}>
    <label className="font-body text-sm font-medium block mb-2"
      style={{ color: 'var(--a-text)' }}>
      Easter Date {new Date().getFullYear()}
    </label>
    <input
      type="date"
      value={easterDate}
      onChange={e => saveEasterDate(e.target.value)}
      className="px-3 py-2 font-body text-sm border outline-none"
      style={{
        background: 'var(--a-bg)',
        borderColor: 'var(--a-border)',
        color: 'var(--a-text)',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
      onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
    />
    <p className="font-body text-xs mt-1.5" style={{ color: 'var(--a-text-muted)' }}>
      Update this date each year before Easter Sunday.
    </p>
  </div>
)}
```

Add `easterDate` state and `saveEasterDate` function:

```typescript
const [easterDate, setEasterDate] = useState('')

// Load Easter date on mount:
useEffect(() => {
  fetch('/api/admin/automations')
    .then(r => r.json())
    .then((data: AutomationSetting[]) => {
      const easter = data.find(s => s.key === 'easter')
      if (easter?.config) {
        const config = easter.config as { easterDate?: string }
        setEasterDate(config.easterDate ?? '')
      }
    })
}, [])

const saveEasterDate = async (date: string) => {
  setEasterDate(date)
  try {
    const current = automationSettings.find(s => s.key === 'easter')
    await fetch('/api/admin/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'easter',
        enabled: current?.enabled ?? false,
        config: { easterDate: date },
      }),
    })
    toast.success('Easter date saved')
  } catch {
    toast.error('Failed to save Easter date')
  }
}
```

---

## TASK 6 — Add All Automation Templates to Email Template Editor

Open `src/lib/email-defaults.ts`.

Add default templates for ALL automations that aren't already there:

```typescript
export const EMAIL_TEMPLATE_DEFAULTS: Record<string, EmailTemplateDefault> = {
  // Existing templates (keep as-is):
  welcome: { ... },
  devotional: { ... },
  // ... existing ones

  // New automation templates:
  birthday: {
    key: 'birthday',
    name: 'Birthday Wishes',
    subject: 'Happy Birthday, {{first_name}}! 🎂',
    description: 'Sent automatically on a member\'s birthday',
    mergeTags: ['first_name'],
    defaultHtml: buildBirthdayEmailHtml('{{first_name}}'),
  },
  event_reminder: {
    key: 'event_reminder',
    name: 'Event Reminder',
    subject: 'Reminder: {{event_title}} is tomorrow! 🙏',
    description: 'Sent 24 hours before an event to registered attendees',
    mergeTags: ['first_name', 'event_title', 'event_date', 'event_time', 'event_location', 'event_url'],
    defaultHtml: `<!-- Event reminder template -->`,
  },
  daily_scripture: {
    key: 'daily_scripture',
    name: 'Daily Scripture',
    subject: "Today's Word — {{scripture_reference}}",
    description: 'Daily scripture email sent to all community members',
    mergeTags: ['first_name', 'scripture_verse', 'scripture_reference', 'scripture_reflection'],
    defaultHtml: `<!-- Daily scripture template -->`,
  },
  daily_study: {
    key: 'daily_study',
    name: 'Daily Study',
    subject: "Today's Study — {{study_title}}",
    description: 'Daily study material email sent to all community members',
    mergeTags: ['first_name', 'study_title', 'study_excerpt'],
    defaultHtml: `<!-- Daily study template -->`,
  },
  christmas: {
    key: 'christmas',
    name: 'Christmas Greetings',
    subject: 'Merry Christmas, {{first_name}}! 🎄',
    description: 'Christmas greeting sent to all community members on December 25th',
    mergeTags: ['first_name'],
    defaultHtml: `<!-- Christmas template -->`,
  },
  new_year: {
    key: 'new_year',
    name: 'New Year Greetings',
    subject: 'Happy New Year, {{first_name}}! 🎉',
    description: 'New Year greeting sent to all community members on January 1st',
    mergeTags: ['first_name', 'year'],
    defaultHtml: `<!-- New year template -->`,
  },
  easter: {
    key: 'easter',
    name: 'Easter Greetings',
    subject: 'Happy Easter, {{first_name}}! ✝️',
    description: 'Easter greeting sent to all community members on the admin-set Easter date',
    mergeTags: ['first_name'],
    defaultHtml: `<!-- Easter template -->`,
  },
}
```

For each new template, use the HTML from the `buildXxxEmail()` functions in `special-dates.ts` and `birthday.ts` as the `defaultHtml` — replace the placeholder `<!-- ... template -->` with the actual HTML.

---

## TASK 7 — Use Saved Templates in Automation Runners

Update each automation runner to check if a saved template exists in the DB and use it, falling back to the hardcoded HTML if not:

```typescript
// Helper to get template HTML from DB:
async function getTemplateHtml(key: string, fallback: string): Promise<string> {
  try {
    const template = await db.emailTemplate.findUnique({ where: { key } })
    if (template?.html) return template.html
  } catch {}
  return fallback
}

// In each runner, use:
const html = await getTemplateHtml('christmas', buildChristmasEmail(firstName))
```

Apply this pattern to:
- `birthday.ts` → key `'birthday'`
- `special-dates.ts` → keys `'christmas'`, `'new_year'`, `'easter'`
- `daily-scripture.ts` → key `'daily_scripture'`
- `daily-study.ts` → key `'daily_study'`
- `welcome.ts` (join email) → key `'welcome'`
- `event-reminder.ts` → key `'event_reminder'`

This means when admin edits a template in `/admin/email-templates`, the automation uses the edited version.

---

## COMPLETION CHECKLIST

**Special Date Automations**
- [ ] `christmas`, `new_year`, `easter` added to `AUTOMATION_KEYS`
- [ ] `runChristmasAutomation` — sends on Dec 25 only
- [ ] `runNewYearAutomation` — sends on Jan 1 only
- [ ] `runEasterAutomation` — sends on admin-set date
- [ ] All three wired into cron endpoint
- [ ] Cron skips with message if not the right date

**Admin UI**
- [ ] 3 new cards in `/admin/automation`
- [ ] Easter card shows date input when enabled
- [ ] Easter date saves to `config` field
- [ ] Loads Easter date on mount
- [ ] Toast confirms save

**Email Templates**
- [ ] All 8 automation templates appear in `/admin/email-templates`
- [ ] Each has correct name, subject, description, merge tags
- [ ] Admin can edit and save each template via Unlayer
- [ ] Automation runners use saved template HTML from DB
- [ ] Fall back to hardcoded HTML if no saved template exists

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Christmas and New Year checks use `today.getMonth() + 1` (1-indexed) for month comparison.
- Easter date comparison uses `getMonth()` and `getDate()` — NOT `getFullYear()` since only month+day matters.
- The `getTemplateHtml` helper is the key bridge between the template editor and the automation runners. Every automation email should go through it.
- The `EmailTemplate` model already exists in Prisma with a `key` field — `findUnique({ where: { key } })` works directly.
- Merge tags in templates (`{{first_name}}` etc.) should be replaced before sending — add simple string replacement in each runner before passing to `sendEmail`.
- For the `new_year` template, `{{year}}` should be replaced with `new Date().getFullYear()`.
- The Easter toggle saving should preserve the existing `enabled` state — only update `config`, not `enabled`.
