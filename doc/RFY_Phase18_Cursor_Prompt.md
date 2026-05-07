# ROOM FOR YOU — Phase 18 Cursor Prompt
## WhatsApp Auto-Redirect · Real-Time Email Duplicate Check

---

## CONTEXT

Two features:

1. **WhatsApp auto-redirect** — After successful join form submission, show the success message for 3 seconds then automatically redirect to the WhatsApp channel URL configured in `/admin/automation`.

2. **Real-time email duplicate check** — On every form across the site that accepts an email, check if the email has already been submitted to that specific form. Show an inline error immediately (on blur) without waiting for form submission.

---

## ═══════════════════════════════════════
## MODULE 1 — WHATSAPP AUTO-REDIRECT
## ═══════════════════════════════════════

### TASK 1 — Update JoinPageClient Success State

Open `src/components/join/JoinPageClient.tsx`.

After a successful submission, the current success state shows a static thank-you screen. Update it to:
1. Show the success message
2. Display a countdown: "Redirecting to WhatsApp in 3..."
3. After 3 seconds, redirect to the WhatsApp URL

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
// ... other imports ...

export function JoinPageClient({ extraFields, whatsappUrl }: JoinPageClientProps) {
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Start countdown after successful submission
  useEffect(() => {
    if (!submitted || !whatsappUrl) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          window.location.href = whatsappUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)

    countdownRef.current = interval
    return () => clearInterval(interval)
  }, [submitted, whatsappUrl])

  // ... existing form logic ...

  // Success state:
  return submitted ? (
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

      <h2 className="font-display text-4xl text-snow mb-4">You're in.</h2>
      <p className="font-body text-mist leading-relaxed mb-6">
        Welcome to Room For You. Check your email for your confirmation.
        <span className="text-gold"> There is room for you here.</span>
      </p>

      {/* WhatsApp redirect countdown */}
      {whatsappUrl ? (
        <div className="mb-8">
          <div
            className="inline-flex flex-col items-center gap-3 px-8 py-5 border"
            style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}
          >
            <p className="font-body text-mist text-sm">
              Joining our WhatsApp community in
            </p>
            <p className="font-display text-gold text-5xl font-bold">
              {countdown}
            </p>
            <p className="font-body text-mist text-xs opacity-60">seconds</p>
          </div>

          {/* Manual link in case redirect is blocked */}
          <p className="font-body text-xs mt-4" style={{ color: '#585858' }}>
            Not redirected?{' '}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:opacity-70 transition-opacity underline"
            >
              Click here to join →
            </a>
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <p className="font-body text-mist text-sm">
            Your confirmation email is on its way.
          </p>
        </div>
      )}

      <Link
        href="/"
        className="font-body text-sm tracking-widest uppercase"
        style={{ color: 'rgba(248,248,248,0.4)' }}
      >
        ← Back to Home
      </Link>
    </motion.div>
  ) : (
    /* ... existing form JSX ... */
    null
  )
}
```

**Important:** The countdown resets to 3 on each render by default — make sure `setCountdown(3)` only runs once when `submitted` becomes `true`, not on every render.

---

## ═══════════════════════════════════════
## MODULE 2 — REAL-TIME EMAIL DUPLICATE CHECK
## ═══════════════════════════════════════

### TASK 2 — Email Check API Routes

#### Check for Join Form (Master Community Form)

Create `src/app/api/join/check-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false })
  }

  const member = await db.communityMember.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!member })
}
```

#### Check for Event Registration

Create `src/app/api/events/[id]/check-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false })
  }

  // Find event by slug or id
  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
    select: { id: true },
  })

  if (!event) return NextResponse.json({ exists: false })

  const registration = await db.eventRegistration.findUnique({
    where: {
      eventId_email: {
        eventId: event.id,
        email: email.toLowerCase().trim(),
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!registration })
}
```

---

### TASK 3 — Email Check Hook

Create `src/hooks/useEmailCheck.ts`:

```typescript
'use client'

import { useState, useCallback, useRef } from 'react'

interface UseEmailCheckOptions {
  checkUrl: (email: string) => string
  debounceMs?: number
}

export function useEmailCheck({ checkUrl, debounceMs = 600 }: UseEmailCheckOptions) {
  const [checking, setChecking] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [checkedEmail, setCheckedEmail] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const checkEmail = useCallback(async (email: string) => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Reset if email is empty or invalid
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailExists(false)
      setCheckedEmail('')
      return
    }

    // Don't re-check the same email
    if (email === checkedEmail) return

    timerRef.current = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(checkUrl(email))
        const data = await res.json()
        setEmailExists(data.exists)
        setCheckedEmail(email)
      } catch {
        setEmailExists(false)
      } finally {
        setChecking(false)
      }
    }, debounceMs)
  }, [checkUrl, checkedEmail, debounceMs])

  const reset = useCallback(() => {
    setEmailExists(false)
    setCheckedEmail('')
    setChecking(false)
  }, [])

  return { checking, emailExists, checkEmail, reset }
}
```

---

### TASK 4 — Apply Email Check to Join Page

Open `src/components/join/JoinPageClient.tsx`.

Add real-time email duplicate checking on the email field:

```typescript
import { useEmailCheck } from '@/hooks/useEmailCheck'

// Inside component:
const { checking: checkingEmail, emailExists, checkEmail } = useEmailCheck({
  checkUrl: (email) => `/api/join/check-email?email=${encodeURIComponent(email)}`,
})

// Update the email input:
<div>
  <label style={labelStyle}>Email Address *</label>
  <div className="relative">
    <input
      type="email"
      value={form.email}
      onChange={e => {
        setForm(p => ({ ...p, email: e.target.value }))
        checkEmail(e.target.value)
      }}
      onBlur={() => checkEmail(form.email)}
      placeholder="your@email.com"
      required
      style={{
        ...inputStyle,
        borderColor: emailExists
          ? 'rgba(239,68,68,0.6)'
          : 'rgba(255,255,255,0.12)',
      }}
      onFocus={e => {
        if (!emailExists) e.target.style.borderColor = '#C9A84C'
      }}
    />
    {/* Status indicator */}
    {checkingEmail && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <div
          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.4)', borderTopColor: 'transparent' }}
        />
      </div>
    )}
  </div>

  {/* Duplicate email warning */}
  {emailExists && (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 mt-2 px-3 py-2"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
    >
      <span className="text-red-400 text-sm shrink-0">⚠</span>
      <p className="font-body text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
        This email is already registered with Room For You.
        You are already part of the community!
      </p>
    </motion.div>
  )}
</div>

// Block submission if email exists:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (emailExists) {
    toast.error('This email is already registered with Room For You.')
    return
  }
  // ... rest of submit logic
}
```

---

### TASK 5 — Apply Email Check to Event Registration Modal

Open `src/components/events/EventRegistrationModal.tsx`.

Add real-time email checking for the email field in the event registration form. The check is per-event — the same person can register for different events:

```typescript
import { useEmailCheck } from '@/hooks/useEmailCheck'

// Inside component, add the hook:
const { checking: checkingEmail, emailExists, checkEmail, reset } = useEmailCheck({
  checkUrl: (email) => `/api/events/${eventSlug}/check-email?email=${encodeURIComponent(email)}`,
})

// Reset when modal opens/closes:
useEffect(() => {
  if (!isOpen) reset()
}, [isOpen, reset])

// Find the email field in the dynamic fields render and add the check:
// When rendering a field with type === 'EMAIL':

{field.type === 'EMAIL' && (
  <div key={field.id}>
    <label style={labelStyle}>
      {field.label}{field.required ? ' *' : ''}
    </label>
    <div className="relative">
      <input
        type="email"
        value={fieldValues[field.id] ?? ''}
        onChange={e => {
          onChange(e.target.value)
          checkEmail(e.target.value)
        }}
        onBlur={() => checkEmail(fieldValues[field.id] ?? '')}
        placeholder={field.placeholder ?? ''}
        required={field.required}
        style={{
          ...inputStyle,
          borderColor: emailExists ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)',
        }}
        onFocus={e => {
          if (!emailExists) e.target.style.borderColor = '#C9A84C'
        }}
      />
      {checkingEmail && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
          />
        </div>
      )}
    </div>

    {emailExists && (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2 mt-2 px-3 py-2"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <span className="text-red-400 text-sm shrink-0">⚠</span>
        <p className="font-body text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
          You are already registered for this event with this email address.
        </p>
      </motion.div>
    )}
  </div>
)}

// Block submission if email already exists:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (emailExists) {
    toast.error('You are already registered for this event.')
    return
  }
  // ... rest of submit logic
}
```

---

### TASK 6 — Apply Email Check to Form Builder Public Forms

Open `src/components/forms/PublicFormRenderer.tsx` (or wherever the public form builder forms are rendered).

For any `EMAIL` type field in the form builder, add a check against that specific form's submissions:

First create the check endpoint:

Create `src/app/api/forms/[slug]/check-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const fieldId = searchParams.get('fieldId')

  if (!email || !email.includes('@') || !fieldId) {
    return NextResponse.json({ exists: false })
  }

  // Find form
  const form = await db.form.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })

  if (!form) return NextResponse.json({ exists: false })

  // Check if this email value exists in submissions for this field
  const existing = await db.formSubmissionValue.findFirst({
    where: {
      fieldId,
      value: email.toLowerCase().trim(),
      submission: { formId: form.id },
    },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!existing })
}
```

Then in `PublicFormRenderer`, for EMAIL fields, apply the same `useEmailCheck` pattern with `checkUrl: (email) => /api/forms/${formSlug}/check-email?email=${encodeURIComponent(email)}&fieldId=${field.id}`.

---

## PHASE 18 COMPLETION CHECKLIST

**WhatsApp Auto-Redirect**
- [ ] After join form submission, success screen shows
- [ ] Countdown timer displays: 3, 2, 1
- [ ] At 0, browser redirects to WhatsApp channel URL
- [ ] If WhatsApp URL is not configured, no countdown shows — just success message
- [ ] Manual "Click here to join" link available as fallback
- [ ] Countdown only starts once (not on every render)

**Email Duplicate Check — Join Form**
- [ ] `GET /api/join/check-email?email=` returns `{ exists: true/false }`
- [ ] Email field shows spinner while checking (debounced 600ms)
- [ ] If email already registered: red border on input, red warning message below
- [ ] Submit button is blocked if email exists
- [ ] Warning message is friendly: "You are already part of the community!"

**Email Duplicate Check — Event Registration**
- [ ] `GET /api/events/[id]/check-email?email=` returns `{ exists: true/false }`
- [ ] Check is per-event (same email can register for different events)
- [ ] Same red border + warning pattern
- [ ] Modal submit blocked if email exists for this event

**Email Duplicate Check — Form Builder**
- [ ] `GET /api/forms/[slug]/check-email?email=&fieldId=` works
- [ ] EMAIL fields in public form builder forms also check for duplicates
- [ ] Same UX pattern

**General**
- [ ] `useEmailCheck` hook is reusable across all three contexts
- [ ] Debounce prevents excessive API calls (600ms)
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The countdown uses `setInterval` inside a `useEffect` with `submitted` as dependency. The cleanup function `clearInterval` prevents memory leaks when the component unmounts.
- `window.location.href = whatsappUrl` is used instead of Next.js `router.push()` because WhatsApp links are external URLs — router only handles internal Next.js routes.
- The email check is debounced at 600ms — this means the API is only called 600ms after the user stops typing. This prevents hammering the API with every keystroke.
- The `checkedEmail` state in the hook prevents re-checking the same email value twice in a row — efficient for when users tab between fields.
- For the event registration modal, the `reset()` call in the `useEffect` ensures the email check state is cleared when the modal closes and reopens for a different event.
- The form builder email check requires `fieldId` because a form could theoretically have multiple email fields — the check is scoped to the specific field that had the previous submission value.
