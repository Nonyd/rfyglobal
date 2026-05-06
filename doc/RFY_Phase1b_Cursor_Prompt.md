# ROOM FOR YOU — Phase 1b Cursor Prompt
## Corrections: Domain URL + Swap Resend → Brevo

---

## CONTEXT

This is a correction patch to apply **before deploying Phase 2**.
Two things are being fixed across the entire codebase:

1. **Canonical domain** is `rfyglobal.org` — all placeholder URLs must reflect this.
2. **Email provider** is **Brevo** (formerly Sendinblue), not Resend — remove Resend entirely and wire Brevo.

---

## TASK 1 — Uninstall Resend, Install Brevo

```bash
npm uninstall resend
npm install @getbrevo/brevo
```

---

## TASK 2 — Update Environment Variables

Update `.env.local` — replace all placeholder values with the correct ones:

```env
# App URL
NEXT_PUBLIC_APP_URL="https://rfyglobal.org"

# NextAuth
NEXTAUTH_URL="https://rfyglobal.org"

# Brevo (replaces Resend entirely)
BREVO_API_KEY=""
BREVO_FROM_EMAIL="noreply@rfyglobal.org"
BREVO_FROM_NAME="Room For You"
```

Update `.env.example` with the same keys (empty values):

```env
NEXT_PUBLIC_APP_URL="https://rfyglobal.org"
NEXTAUTH_URL="https://rfyglobal.org"

# Brevo
BREVO_API_KEY=""
BREVO_FROM_EMAIL="noreply@rfyglobal.org"
BREVO_FROM_NAME="Room For You"
```

**Remove these keys entirely from both files:**
```
RESEND_API_KEY
RESEND_FROM_EMAIL
```

---

## TASK 3 — Create Brevo Email Helper

Delete `src/lib/resend.ts` if it exists.

Create `src/lib/brevo.ts`:

```typescript
import * as Brevo from '@getbrevo/brevo'

const apiInstance = new Brevo.TransactionalEmailsApi()
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
)

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  const recipients = Array.isArray(to)
    ? to.map((email) => ({ email }))
    : [{ email: to }]

  const sendSmtpEmail = new Brevo.SendSmtpEmail()
  sendSmtpEmail.sender = {
    email: process.env.BREVO_FROM_EMAIL!,
    name: process.env.BREVO_FROM_NAME!,
  }
  sendSmtpEmail.to = recipients
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = html

  if (replyTo) {
    sendSmtpEmail.replyTo = { email: replyTo }
  }

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    // Log but never throw — email failure should never break a user action
    console.error('[Brevo] Failed to send email:', error)
  }
}
```

---

## TASK 4 — Update next.config.mjs

Replace the security headers and metadata base to use the correct domain.

Open `next.config.mjs` and update the CSP `connect-src` directive to include `https://rfyglobal.org`:

```javascript
"connect-src 'self' https://rfyglobal.org https://api.paystack.co https://api.flutterwave.com",
```

Also ensure the full `next.config.mjs` exports correctly with no reference to Resend anywhere.

---

## TASK 5 — Update Root Layout Metadata

Open `src/app/layout.tsx` and update the metadata block:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://rfyglobal.org'),
  title: 'Room For You — with Yadah',
  description: 'A worship, prayer, study, mentorship and evangelism community. Jesus to Nations.',
  keywords: ['Room For You', 'Yadah', 'worship', 'prayer', 'bible study', 'community', 'gospel'],
  openGraph: {
    title: 'Room For You — with Yadah',
    description: 'Building a community of young men and women who sing songs of salvation.',
    url: 'https://rfyglobal.org',
    siteName: 'Room For You',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Room For You — with Yadah',
    description: 'Building a community of young men and women who sing songs of salvation.',
  },
}
```

---

## TASK 6 — Update Footer Domain Reference

Open `src/components/layout/Footer.tsx`.

Find any hardcoded URL (localhost or placeholder) and replace with `https://rfyglobal.org`.

Update copyright line to:
```
© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.
```

---

## TASK 7 — Update Scripture API Route

Open `src/app/api/scripture/today/route.ts`.

Find any reference to `localhost:3000` or `NEXT_PUBLIC_APP_URL` and ensure it reads from the environment variable — do not hardcode any URL.

---

## TASK 8 — Update OG Image Route

Open `src/app/api/og/scripture/route.ts`.

Ensure the generated share card includes `rfyglobal.org` as the watermark/attribution text on the card instead of any placeholder, like so:

```typescript
// Inside the Satori JSX for the share card
{/* Bottom attribution */}
<div style={{ fontSize: 12, color: 'rgba(201,168,76,0.6)', letterSpacing: '0.2em' }}>
  RFYGLOBAL.ORG
</div>
```

---

## TASK 9 — Global Search & Replace

Do a full project search for the following strings and replace/remove as indicated:

| Find | Replace With |
|------|-------------|
| `resend` (import) | `@/lib/brevo` |
| `new Resend(` | *(remove — use `sendEmail` from `@/lib/brevo`)* |
| `resend.emails.send(` | `sendEmail(` |
| `RESEND_API_KEY` | `BREVO_API_KEY` |
| `RESEND_FROM_EMAIL` | `BREVO_FROM_EMAIL` |
| `localhost:3000` | `https://rfyglobal.org` (in metadata/config only — keep in `.env.local` dev values) |
| `© 2025` | `© 2026` |

---

## TASK 10 — Verify Phase 2 Email Call Signature

Phase 2 prompt uses this pattern in `src/app/api/forms/[id]/submit/route.ts`:

```typescript
// OLD (Resend — remove this)
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({ from, to, subject, html })

// NEW (Brevo — use this)
import { sendEmail } from '@/lib/brevo'
await sendEmail({ to: form.notifyEmail, subject, html })
```

Make this replacement in the submit route so Phase 2 works with Brevo out of the box.

---

## PHASE 1b COMPLETION CHECKLIST

- [ ] `resend` package removed from `node_modules` and `package.json`
- [ ] `@getbrevo/brevo` installed
- [ ] `src/lib/brevo.ts` created with `sendEmail` helper
- [ ] `.env.local` and `.env.example` updated — no Resend keys remain
- [ ] `NEXT_PUBLIC_APP_URL` is `https://rfyglobal.org`
- [ ] `NEXTAUTH_URL` is `https://rfyglobal.org`
- [ ] Root layout `metadataBase` is `https://rfyglobal.org`
- [ ] Footer shows `rfyglobal.org`
- [ ] OG share card shows `RFYGLOBAL.ORG`
- [ ] No `localhost:3000` hardcoded anywhere outside `.env.local`
- [ ] No `resend` import anywhere in the codebase
- [ ] `npm run build` completes successfully

---

## NOTES FOR CURSOR

- The Brevo SDK uses a class-based instantiation pattern — `new Brevo.TransactionalEmailsApi()` — unlike Resend's functional pattern. Do not try to replicate the Resend call signature.
- `sendEmail` in `src/lib/brevo.ts` is the single export used everywhere in the app. Never instantiate the Brevo API client outside this file.
- Keep `.env.local` dev `NEXTAUTH_URL` as `http://localhost:3000` for local development — only production `.env` on Vercel should use `https://rfyglobal.org`. The `next.config.mjs` metadata base however should always point to the production domain.
- Brevo free tier allows 300 emails/day — sufficient for Phase 2 testing.
