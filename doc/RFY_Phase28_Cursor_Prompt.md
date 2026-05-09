# ROOM FOR YOU — Phase 28 Cursor Prompt
## Update All Email Senders to Correct @rfyglobal.org Addresses

---

## CONTEXT

All outgoing emails must use the correct `@rfyglobal.org` sender addresses. The domain is already authenticated on Brevo so all these addresses will work immediately.

**Sender address assignments:**

| Email Type | From Name | From Address |
|---|---|---|
| Community join confirmation | Room For You | `hello@rfyglobal.org` |
| Daily devotional | The Word · Room For You | `word@rfyglobal.org` |
| Event reminders | Room For You Events | `events@rfyglobal.org` |
| Event registration confirmation | Room For You Events | `events@rfyglobal.org` |
| Prayer reply | Room For You Prayer Team | `prayer@rfyglobal.org` |
| Partner/giving confirmation | Room For You | `partner@rfyglobal.org` |
| Contact form auto-reply | Room For You | `hello@rfyglobal.org` |
| Admin messages to members | Room For You | `hello@rfyglobal.org` |
| Unsubscribe confirmation | Room For You | `hello@rfyglobal.org` |

---

## TASK 1 — Update Environment Variables / Constants

Create or update `src/lib/email-senders.ts`:

```typescript
// Canonical sender addresses for all outgoing emails
export const EMAIL_SENDERS = {
  // General community emails
  hello: {
    name: 'Room For You',
    email: 'hello@rfyglobal.org',
  },
  // Daily Word / devotional
  word: {
    name: 'The Word · Room For You',
    email: 'word@rfyglobal.org',
  },
  // Events
  events: {
    name: 'Room For You Events',
    email: 'events@rfyglobal.org',
  },
  // Prayer team
  prayer: {
    name: 'Room For You Prayer Team',
    email: 'prayer@rfyglobal.org',
  },
  // Partnership / giving
  partner: {
    name: 'Room For You',
    email: 'partner@rfyglobal.org',
  },
} as const
```

---

## TASK 2 — Update Brevo Helper

Open `src/lib/brevo.ts`.

Update the `sendEmail` function to use the correct default sender and accept sender overrides:

```typescript
import { EMAIL_SENDERS } from './email-senders'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  fromName = EMAIL_SENDERS.hello.name,
  fromEmail = EMAIL_SENDERS.hello.email,
  replyTo,
}: SendEmailOptions) {
  // ... existing Brevo API call, but update sender:
  const payload = {
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(replyTo && { replyTo: { email: replyTo } }),
  }
  // ... rest of existing implementation
}
```

---

## TASK 3 — Update Join Confirmation Email

Open `src/app/api/join/route.ts` or `src/lib/emails/confirmation.ts`.

Find the join confirmation email send call and update:

```typescript
await sendEmail({
  to: email,
  subject: 'Welcome to Room For You 🏠',
  html: confirmationEmailHtml,
  fromName: EMAIL_SENDERS.hello.name,
  fromEmail: EMAIL_SENDERS.hello.email,
})
```

---

## TASK 4 — Update Daily Devotional Cron Email

Open `src/app/api/cron/devotional/route.ts` or the devotional email helper.

```typescript
await sendEmail({
  to: member.email,
  subject: `Today's Word — ${scripture.reference}`,
  html: devotionalEmailHtml,
  fromName: EMAIL_SENDERS.word.name,
  fromEmail: EMAIL_SENDERS.word.email,
})
```

---

## TASK 5 — Update Event Reminder Emails

Open `src/app/api/cron/event-reminders/route.ts`.

```typescript
await sendEmail({
  to: registration.email,
  subject: `Reminder: ${event.title} is coming up`,
  html: eventReminderHtml,
  fromName: EMAIL_SENDERS.events.name,
  fromEmail: EMAIL_SENDERS.events.email,
})
```

---

## TASK 6 — Update Event Registration Confirmation

Open `src/app/api/events/[id]/register/route.ts` or the event registration email helper.

```typescript
await sendEmail({
  to: email,
  subject: `You're registered for ${event.title}`,
  html: registrationConfirmationHtml,
  fromName: EMAIL_SENDERS.events.name,
  fromEmail: EMAIL_SENDERS.events.email,
})
```

---

## TASK 7 — Update Prayer Reply Email

Open `src/app/api/admin/prayer/[id]/route.ts`.

```typescript
await sendEmail({
  to: request.email,
  subject: `Re: Your Prayer Request — ${request.subject}`,
  html: prayerReplyHtml,
  fromName: EMAIL_SENDERS.prayer.name,
  fromEmail: EMAIL_SENDERS.prayer.email,
})
```

---

## TASK 8 — Update Admin Messages Email

Open `src/app/api/admin/messages/route.ts` and `src/app/api/admin/messages/[id]/route.ts`.

```typescript
await sendEmail({
  to: recipientEmail,
  subject: subject ?? 'A message from Room For You',
  html: messageHtml,
  fromName: EMAIL_SENDERS.hello.name,
  fromEmail: EMAIL_SENDERS.hello.email,
})
```

---

## TASK 9 — Update Partner/Giving Confirmation

Open the payment confirmation email wherever it's sent after a successful gift.

```typescript
await sendEmail({
  to: email,
  subject: 'Thank you for partnering with Room For You',
  html: partnerConfirmationHtml,
  fromName: EMAIL_SENDERS.partner.name,
  fromEmail: EMAIL_SENDERS.partner.email,
})
```

---

## TASK 10 — Update Unsubscribe Confirmation

Open `src/app/api/unsubscribe/route.ts`.

```typescript
await sendEmail({
  to: email,
  subject: 'You have been unsubscribed',
  html: unsubscribeHtml,
  fromName: EMAIL_SENDERS.hello.name,
  fromEmail: EMAIL_SENDERS.hello.email,
})
```

---

## TASK 11 — Update Contact Form Auto-Reply (if exists)

Open `src/app/api/contact/route.ts`.

If there is an auto-reply sent to the person who submitted the contact form:

```typescript
await sendEmail({
  to: email,
  subject: 'We received your message — Room For You',
  html: contactAutoReplyHtml,
  fromName: EMAIL_SENDERS.hello.name,
  fromEmail: EMAIL_SENDERS.hello.email,
  replyTo: 'hello@rfyglobal.org',
})
```

---

## TASK 12 — Update BREVO_FROM_EMAIL in .env

The `.env` file on the server needs to be updated. After deploying this code change, update the server `.env`:

Add these to `/home/sonshubco/rfyglobal.org/.env`:

```env
BREVO_FROM_EMAIL="hello@rfyglobal.org"
BREVO_FROM_NAME="Room For You"
```

These are the fallback defaults. The `EMAIL_SENDERS` constants in code take priority for each specific email type.

---

## COMPLETION CHECKLIST

- [ ] `src/lib/email-senders.ts` created with all sender constants
- [ ] `sendEmail` in `src/lib/brevo.ts` accepts `fromName` and `fromEmail` params
- [ ] Join confirmation — sends from `hello@rfyglobal.org`
- [ ] Daily devotional — sends from `word@rfyglobal.org`
- [ ] Event reminders — sends from `events@rfyglobal.org`
- [ ] Event registration — sends from `events@rfyglobal.org`
- [ ] Prayer reply — sends from `prayer@rfyglobal.org`
- [ ] Admin messages — sends from `hello@rfyglobal.org`
- [ ] Partner confirmation — sends from `partner@rfyglobal.org`
- [ ] Unsubscribe — sends from `hello@rfyglobal.org`
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- All these `@rfyglobal.org` addresses are valid because the domain is authenticated on Brevo. Brevo allows sending from any address on an authenticated domain — you do not need to create each address individually in Brevo.
- The `EMAIL_SENDERS` object uses `as const` so TypeScript can infer the exact string types.
- The existing `sendEmail` function signature must remain backward compatible — make `fromName` and `fromEmail` optional with the `hello` sender as default. This way any email call that doesn't specify a sender still works.
- After this is deployed, go to Brevo → Senders, Domains & IPs → Senders and add each address as a sender for cleaner Brevo reporting. This is optional but good practice.
- The server `.env` update (Task 12) must be done manually via SSH after deploying — code changes deploy automatically but `.env` changes require manual update on the server.
