# ROOM FOR YOU — Contact Form Fix + Admin Messaging System Cursor Prompt
## Fix Contact Form · Admin Broadcast Emails · Templates · Group Targeting · Reply-To

---

## CONTEXT

Two features:

1. **Fix contact form** — the contact page form (`/contact`) is not submitting successfully. Find and fix the issue.

2. **Admin messaging system** — extend `/admin/messages` to allow admin to compose and send broadcast emails to selected groups, with template support, personalization, and custom reply-to.

---

## PART A — Fix Contact Form

### TASK A1 — Diagnose Contact Form

Open `src/app/(public)/contact/page.tsx` or the contact form component.

Check:
1. What API endpoint does the form POST to? (e.g. `/api/contact`)
2. Open that API route — does it have proper error handling?
3. Check if it uses `adminFetch` or plain `fetch` — if plain fetch, it may be blocked by Cloudflare WAF

Open `src/app/api/contact/route.ts` (or wherever contact form submissions go).

Ensure:
- It accepts POST requests
- It saves to DB (e.g. `MessageThread` or `ContactSubmission`)
- It sends confirmation email to the visitor
- It notifies admin via `createNotification`
- It returns `{ success: true }` on success

If the route uses `DELETE` or `PATCH` patterns that were previously broken by Cloudflare WAF, ensure it only uses `POST` for submission — contact form should already use POST.

Check the public form component for any JavaScript errors — look for missing env vars, failed imports, or broken fetch calls.

Fix whatever is causing the contact form to not work.

---

## PART B — Admin Messaging System

### TASK B1 — Database Schema

Open `prisma/schema.prisma`.

Add a `BroadcastMessage` model to track sent broadcast messages:

```prisma
model BroadcastMessage {
  id          String   @id @default(cuid())
  subject     String
  body        String   @db.Text
  replyTo     String?
  group       String   // 'all_members' | 'event_registrants' | 'prayer_requesters' | 'testimony_submitters' | 'form_submitters'
  groupFilter String?  // for form_submitters: form ID; for event_registrants: event ID
  templateKey String?  // if sent from a template
  recipientCount Int   @default(0)
  status      String   @default("draft") // 'draft' | 'sent' | 'failed'
  sentAt      DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run: `npx prisma db push`

---

### TASK B2 — Broadcast Message API

Create `src/app/api/admin/broadcast/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list all broadcast messages
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await db.broadcastMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(messages)
}

// POST — send a broadcast message
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, body, replyTo, group, groupFilter, templateKey } = await req.json()

  if (!subject || !body || !group) {
    return NextResponse.json({ error: 'subject, body and group are required' }, { status: 400 })
  }

  // Get recipients based on group
  const recipients = await getRecipients(group, groupFilter)

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found for this group' }, { status: 400 })
  }

  // Save message record
  const message = await db.broadcastMessage.create({
    data: {
      subject,
      body,
      replyTo: replyTo || null,
      group,
      groupFilter: groupFilter || null,
      templateKey: templateKey || null,
      recipientCount: recipients.length,
      status: 'sent',
      sentAt: new Date(),
    },
  })

  // Send emails
  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      const firstName = recipient.name?.split(' ')[0] ?? 'Friend'
      const personalizedBody = body
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{name\}\}/g, recipient.name ?? 'Friend')
        .replace(/\{\{email\}\}/g, recipient.email)

      const personalizedSubject = subject
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{name\}\}/g, recipient.name ?? 'Friend')

      await sendEmail({
        to: recipient.email,
        subject: personalizedSubject,
        html: wrapInEmailTemplate(personalizedBody),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
        replyTo: replyTo || undefined,
      })
      sent++
    } catch (err) {
      console.error(`[broadcast] Failed to send to ${recipient.email}:`, err)
      failed++
    }
  }

  // Update status
  await db.broadcastMessage.update({
    where: { id: message.id },
    data: {
      status: failed === recipients.length ? 'failed' : 'sent',
      recipientCount: sent,
    },
  })

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: recipients.length,
    messageId: message.id,
  })
}

async function getRecipients(
  group: string,
  groupFilter?: string
): Promise<{ email: string; name: string }[]> {
  switch (group) {
    case 'all_members': {
      const members = await db.communityMember.findMany({
        where: { email: { not: '' } },
        select: { email: true, name: true },
      })
      return members.filter(m => m.email?.trim())
    }

    case 'event_registrants': {
      const where = groupFilter
        ? { eventId: groupFilter }
        : {}
      const registrations = await db.eventRegistration.findMany({
        where,
        select: { email: true, name: true },
        distinct: ['email'],
      })
      return registrations.filter(r => r.email?.trim())
    }

    case 'prayer_requesters': {
      const prayers = await db.prayerRequest.findMany({
        select: { email: true, name: true },
        distinct: ['email'],
      })
      return prayers.filter(p => p.email?.trim())
    }

    case 'testimony_submitters': {
      const testimonies = await db.testimony.findMany({
        select: { email: true, name: true },
        distinct: ['email'],
      })
      return testimonies.filter(t => t.email?.trim())
    }

    case 'form_submitters': {
      if (!groupFilter) return []
      const submissions = await db.formSubmission.findMany({
        where: { formId: groupFilter },
        include: {
          values: {
            include: { field: true },
          },
        },
      })

      const recipients: { email: string; name: string }[] = []
      const seen = new Set<string>()

      for (const submission of submissions) {
        const emailValue = submission.values.find(v => v.field.type === 'EMAIL')
        const nameValue = submission.values.find(v =>
          v.field.label.toLowerCase().includes('name')
        )
        if (emailValue?.value && !seen.has(emailValue.value)) {
          seen.add(emailValue.value)
          recipients.push({
            email: emailValue.value,
            name: nameValue?.value ?? 'Friend',
          })
        }
      }

      return recipients
    }

    default:
      return []
  }
}

function wrapInEmailTemplate(body: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <div style="font-size:15px;line-height:1.8;color:#F8F8F8;">
        ${body.replace(/\n/g, '<br>')}
      </div>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}
```

---

### TASK B3 — Preview Recipients API

Create `src/app/api/admin/broadcast/recipients/route.ts`:

```typescript
// GET /api/admin/broadcast/recipients?group=all_members&groupFilter=xxx
// Returns recipient count for a group before sending

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const group = req.nextUrl.searchParams.get('group')
  const groupFilter = req.nextUrl.searchParams.get('groupFilter') ?? undefined

  if (!group) return NextResponse.json({ count: 0 })

  const recipients = await getRecipients(group, groupFilter)
  return NextResponse.json({ count: recipients.length })
}
```

---

### TASK B4 — Admin Messages Page UI

Open `src/app/admin/(dashboard)/messages/page.tsx` or the messages manager component.

Add a **"New Message"** button at the top of the page. When clicked, open a compose panel/modal.

**Compose Panel:**

```typescript
// Compose panel sections:

// 1. TO — group selector
<select value={group} onChange={...}>
  <option value="">Select recipients...</option>
  <option value="all_members">All Community Members</option>
  <option value="event_registrants">Event Registrants</option>
  <option value="prayer_requesters">Prayer Requesters</option>
  <option value="testimony_submitters">Testimony Submitters</option>
  <option value="form_submitters">Form Submitters (specific form)</option>
</select>

// 2. GROUP FILTER — shows when group needs a filter
// For event_registrants: event selector dropdown (fetch from /api/events)
// For form_submitters: form selector dropdown (fetch from /api/forms)

// 3. RECIPIENT PREVIEW — shows count after group selection
<p>Sending to: <strong>{recipientCount} recipients</strong></p>

// 4. TEMPLATE — optional template selector
<select value={templateKey} onChange={...}>
  <option value="">Write new message (no template)</option>
  {templates.map(t => (
    <option key={t.key} value={t.key}>{t.name}</option>
  ))}
</select>

// 5. REPLY-TO
<input
  type="email"
  value={replyTo}
  onChange={...}
  placeholder="hello@rfyglobal.org (optional)"
/>
<p>Recipients who reply will reach this email address.</p>

// 6. SUBJECT
<input
  type="text"
  value={subject}
  placeholder="Message subject..."
/>

// 7. BODY — textarea with merge tag hints
<textarea
  value={body}
  onChange={...}
  placeholder="Write your message here...
  
Use {{first_name}} to personalize with the recipient's first name.
Use {{name}} for their full name."
  rows={12}
/>
<p>Available merge tags: {{first_name}}, {{name}}, {{email}}</p>

// 8. SEND BUTTON
<button onClick={handleSend} disabled={sending}>
  {sending ? 'Sending...' : `Send to ${recipientCount} recipients`}
</button>
```

When a template is selected, pre-fill the subject and body from the template:

```typescript
useEffect(() => {
  if (!templateKey) return
  fetch(`/api/admin/email-templates/${templateKey}`)
    .then(r => r.json())
    .then(data => {
      if (data.subject) setSubject(data.subject)
      if (data.html) {
        // Strip HTML tags for the text body:
        const text = data.html.replace(/<[^>]+>/g, '').trim()
        setBody(text)
      }
    })
}, [templateKey])
```

After sending, show a success summary:
```typescript
// Success toast:
toast.success(`Message sent to ${result.sent} recipients${result.failed > 0 ? ` (${result.failed} failed)` : ''}`)
```

---

### TASK B5 — Broadcast History Section

Below the compose button and existing contact messages, add a **"Sent Broadcasts"** section showing past broadcast messages:

```typescript
// Broadcast history table:
// Columns: Subject | Group | Recipients | Sent At | Status
// Load from GET /api/admin/broadcast
```

---

### TASK B6 — Add POST Handler Override for Broadcast

Since all admin API routes need the Cloudflare WAF override, ensure `src/app/api/admin/broadcast/route.ts` follows the same pattern as other admin routes — POST only, no DELETE/PATCH needed for this route.

---

## COMPLETION CHECKLIST

**Contact Form Fix**
- [ ] Contact form on `/contact` submits successfully
- [ ] Visitor receives confirmation email
- [ ] Admin receives notification
- [ ] Message appears in `/admin/messages`

**Database**
- [ ] `BroadcastMessage` model added
- [ ] `npx prisma db push` run

**Broadcast API**
- [ ] `POST /api/admin/broadcast` sends emails to group
- [ ] `GET /api/admin/broadcast` returns sent history
- [ ] `GET /api/admin/broadcast/recipients` returns count preview
- [ ] All 5 groups supported: all_members, event_registrants, prayer_requesters, testimony_submitters, form_submitters
- [ ] Merge tags `{{first_name}}`, `{{name}}`, `{{email}}` replaced per recipient

**Admin UI**
- [ ] "New Message" button in `/admin/messages`
- [ ] Group selector with all 5 options
- [ ] Event/form filter shows for relevant groups
- [ ] Recipient count preview updates on group selection
- [ ] Template selector pre-fills subject and body
- [ ] Reply-to field
- [ ] Subject and body fields
- [ ] Merge tag hints shown
- [ ] Send button shows recipient count
- [ ] Success toast after sending
- [ ] Sent broadcasts history section

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The compose panel can be a slide-in panel from the right (same pattern as NotificationBell) or a full-page modal — use whatever fits the admin UI style.
- Merge tag replacement happens server-side in the broadcast API — the admin writes `{{first_name}}` in the body and the server replaces it per recipient before sending.
- For `form_submitters`, the form selector should fetch from `GET /api/forms` and show form titles.
- For `event_registrants`, the event selector should fetch from `GET /api/events` and show event titles.
- The reply-to email defaults to empty — if set, Brevo uses it as the `Reply-To` header so when a recipient hits reply in their email client, it goes to that address instead of the from address.
- The `wrapInEmailTemplate` function adds the logo and footer — the admin just writes the message body, not full HTML.
- `recipientCount` should update automatically when group or groupFilter changes — use a `useEffect` that calls `/api/admin/broadcast/recipients`.
- The contact form fix is independent of the broadcast system — fix it first, test it, then build the broadcast UI.
