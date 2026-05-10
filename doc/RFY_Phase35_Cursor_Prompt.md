# ROOM FOR YOU — Phase 35 Cursor Prompt
## Paystack Payment Setup — Partnership & Events · NGN/USD · One-time & Recurring

---

## CONTEXT

Set up Paystack payments fully for:
1. **Partnership/Giving page** (`/partner`) — one-time or monthly recurring, NGN or USD
2. **Event registration** — one-time payment if event has a price, NGN or USD

**Gateway:** Paystack only (supports both NGN and USD)
**Currencies:** Visitor manually selects NGN (₦) or USD ($) before paying
**Frequency (partnership only):** Visitor chooses one-time or monthly

**Paystack credentials are stored in the admin Integrations page** — not in `.env`. The app reads them from the database via the credentials system.

---

## HOW PAYSTACK WORKS IN THIS APP

1. Frontend calls `POST /api/payments/initiate` with amount, currency, email, metadata
2. Server calls Paystack API to initialize transaction → gets `authorization_url`
3. Frontend redirects to Paystack checkout or opens inline popup
4. After payment, Paystack redirects to `/partner/verify?reference=XXX` or `/events/[slug]/verify?reference=XXX`
5. Frontend calls `POST /api/payments/verify` with reference
6. Server verifies with Paystack API → saves `GivingRecord` to DB → sends confirmation email

**For recurring (monthly):** Use Paystack Plans + Subscriptions API
- Create a plan once (or check if it exists) for the amount
- Subscribe the customer to the plan after first payment

---

## TASK 1 — Check Existing Payment Infrastructure

Before writing new code, check what already exists:

1. Check `src/app/api/payments/initiate/route.ts` — what does it currently do?
2. Check `src/app/api/payments/verify/route.ts` — what does it currently do?
3. Check `src/app/api/webhooks/paystack/route.ts` — is it implemented?
4. Check `src/app/(public)/partner/page.tsx` — what does the giving form look like?
5. Check `src/lib/credentials.ts` or similar — how are Paystack keys retrieved from DB?

Build on what exists. Only replace/rewrite what is broken or missing.

---

## TASK 2 — Paystack Credentials Helper

Check if `src/lib/paystack.ts` exists. If not, create it:

```typescript
import { db } from './db'

interface PaystackCredentials {
  secretKey: string
  publicKey: string
}

export async function getPaystackCredentials(): Promise<PaystackCredentials | null> {
  try {
    // Credentials are stored encrypted in the DB via admin/integrations
    const cred = await db.credential.findFirst({
      where: { service: 'paystack' },
    })
    if (!cred) return null

    // Decrypt using existing credentials system
    const { decryptCredentials } = await import('./credentials')
    const decrypted = await decryptCredentials(cred.encryptedData)

    return {
      secretKey: decrypted.secretKey ?? decrypted.secret_key ?? '',
      publicKey: decrypted.publicKey ?? decrypted.public_key ?? '',
    }
  } catch (error) {
    console.error('[paystack] Failed to get credentials:', error)
    return null
  }
}

export async function paystackRequest(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const creds = await getPaystackCredentials()
  if (!creds?.secretKey) {
    throw new Error('Paystack not configured. Add credentials in admin/integrations.')
  }

  const res = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${creds.secretKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message ?? `Paystack API error: ${res.status}`)
  }
  return data
}
```

---

## TASK 3 — Payment Initiate API

Update `src/app/api/payments/initiate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { paystackRequest } from '@/lib/paystack'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email,
      name,
      amount,        // in smallest unit: kobo for NGN, cents for USD
      currency,      // 'NGN' | 'USD'
      frequency,     // 'one_time' | 'monthly'
      type,          // 'partnership' | 'event'
      eventId,       // for event payments
      metadata,      // any extra metadata
      callbackUrl,   // where to redirect after payment
    } = body

    if (!email || !amount || !currency) {
      return NextResponse.json(
        { error: 'email, amount, and currency are required' },
        { status: 400 }
      )
    }

    // For monthly recurring — create or get existing plan
    if (frequency === 'monthly' && type === 'partnership') {
      const planCode = await getOrCreatePlan(amount, currency)

      // Initialize subscription transaction
      const response = await paystackRequest('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email,
          amount,
          currency,
          plan: planCode,
          callback_url: callbackUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/partner/verify`,
          metadata: {
            name,
            type,
            frequency,
            ...metadata,
          },
        }),
      })

      return NextResponse.json({
        authorizationUrl: response.data.authorization_url,
        reference: response.data.reference,
        accessCode: response.data.access_code,
      })
    }

    // One-time payment
    const response = await paystackRequest('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount,
        currency,
        callback_url: callbackUrl ?? (
          type === 'event'
            ? `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/verify`
            : `${process.env.NEXT_PUBLIC_APP_URL}/partner/verify`
        ),
        metadata: {
          name,
          type,
          frequency: 'one_time',
          eventId,
          ...metadata,
        },
      }),
    })

    return NextResponse.json({
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference,
      accessCode: response.data.access_code,
    })
  } catch (error: any) {
    console.error('[payments/initiate]', error)
    return NextResponse.json(
      { error: error.message ?? 'Payment initialization failed' },
      { status: 500 }
    )
  }
}

async function getOrCreatePlan(amount: number, currency: string): Promise<string> {
  const planName = `RFY Monthly Partner - ${currency} ${amount / 100}`

  // Check if plan already exists
  const existing = await paystackRequest(
    `/plan?amount=${amount}&currency=${currency}&interval=monthly`
  )

  const match = existing.data?.find(
    (p: any) => p.amount === amount && p.currency === currency && p.interval === 'monthly'
  )
  if (match) return match.plan_code

  // Create new plan
  const created = await paystackRequest('/plan', {
    method: 'POST',
    body: JSON.stringify({
      name: planName,
      interval: 'monthly',
      amount,
      currency,
    }),
  })

  return created.data.plan_code
}
```

---

## TASK 4 — Payment Verify API

Update `src/app/api/payments/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { paystackRequest } from '@/lib/paystack'
import { db } from '@/lib/db'
import { notifyPartnerGiftOnce } from '@/lib/notify'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json()
    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    }

    // Verify with Paystack
    const response = await paystackRequest(`/transaction/verify/${reference}`)
    const transaction = response.data

    if (transaction.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment not successful', status: transaction.status },
        { status: 400 }
      )
    }

    const {
      amount,
      currency,
      customer,
      metadata,
    } = transaction

    const email = customer.email
    const name = metadata?.name ?? customer.name ?? 'Anonymous'
    const type = metadata?.type ?? 'partnership'
    const frequency = metadata?.frequency ?? 'one_time'
    const eventId = metadata?.eventId

    // Check for duplicate
    const existing = await db.givingRecord.findFirst({
      where: { reference },
    })
    if (existing) {
      return NextResponse.json({ success: true, duplicate: true, record: existing })
    }

    // Save to DB
    const record = await db.givingRecord.create({
      data: {
        reference,
        email,
        name,
        amount,
        currency,
        frequency,
        type,
        eventId: eventId ?? null,
        status: 'SUCCESS',
        paystackData: transaction,
      },
    })

    // Notify admin
    await notifyPartnerGiftOnce(
      reference,
      amount,
      name
    )

    // Send confirmation email to donor
    if (type === 'partnership') {
      const formattedAmount = currency === 'NGN'
        ? `₦${(amount / 100).toLocaleString()}`
        : `$${(amount / 100).toLocaleString()}`

      await sendEmail({
        to: email,
        subject: 'Thank you for partnering with Room For You',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
            <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:28px;display:block;" />
            <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">Partnership Confirmation</p>
            <p style="font-size:18px;font-weight:bold;margin:0 0 8px;">Thank you, ${name}.</p>
            <p style="color:#A0A0A0;font-size:14px;margin:0 0 24px;line-height:1.6;">
              Your ${frequency === 'monthly' ? 'monthly' : ''} gift of <strong style="color:#C9A84C;">${formattedAmount}</strong> has been received. 
              You are now a partner in the Room For You mission — Jesus to Nations.
            </p>
            <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0 0 4px;font-size:12px;color:#A0A0A0;">Reference</p>
              <p style="margin:0;font-size:13px;color:#F8F8F8;font-family:monospace;">${reference}</p>
            </div>
            ${frequency === 'monthly' ? `
            <p style="color:#A0A0A0;font-size:13px;margin:0 0 24px;">
              Your monthly giving is now active. You will be charged ${formattedAmount} every month. 
              To cancel, contact us at hello@rfyglobal.org.
            </p>
            ` : ''}
            <p style="color:#585858;font-size:11px;text-align:center;margin:24px 0 0;">
              Room For You · rfyglobal.org · Jesus to Nations
            </p>
          </div>
        `,
        fromName: EMAIL_SENDERS.partner.name,
        fromEmail: EMAIL_SENDERS.partner.email,
      })
    }

    return NextResponse.json({ success: true, record })
  } catch (error: any) {
    console.error('[payments/verify]', error)
    return NextResponse.json(
      { error: error.message ?? 'Verification failed' },
      { status: 500 }
    )
  }
}
```

---

## TASK 5 — Paystack Webhook

Update `src/app/api/webhooks/paystack/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { notifyPartnerGiftOnce } from '@/lib/notify'
import { getPaystackCredentials } from '@/lib/paystack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // Verify webhook signature
    const creds = await getPaystackCredentials()
    if (creds?.secretKey) {
      const hash = crypto
        .createHmac('sha512', creds.secretKey)
        .update(body)
        .digest('hex')

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const { data } = event
      const reference = data.reference
      const amount = data.amount
      const currency = data.currency
      const email = data.customer.email
      const name = data.metadata?.name ?? data.customer.name ?? 'Anonymous'

      // Check for duplicate
      const existing = await db.givingRecord.findFirst({ where: { reference } })
      if (!existing) {
        await db.givingRecord.create({
          data: {
            reference,
            email,
            name,
            amount,
            currency,
            frequency: data.plan ? 'monthly' : 'one_time',
            type: data.metadata?.type ?? 'partnership',
            status: 'SUCCESS',
            paystackData: data,
          },
        })
      }

      await notifyPartnerGiftOnce(reference, amount, name)
    }

    if (event.event === 'subscription.create') {
      // Subscription created successfully — log it
      console.log('[paystack webhook] Subscription created:', event.data.subscription_code)
    }

    if (event.event === 'invoice.payment_failed') {
      // Monthly charge failed — could notify admin
      console.log('[paystack webhook] Payment failed for subscription:', event.data.subscription_code)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[paystack webhook]', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
```

---

## TASK 6 — Partnership Giving Form

Update the giving form in `src/app/(public)/partner/page.tsx` or its client component.

The form needs:
- **Currency selector** — NGN (₦) or USD ($) toggle/tabs
- **Amount input** — preset amounts + custom input
- **Frequency selector** — One-time or Monthly (for partnership only)
- **Name + Email fields**
- **Pay button** → calls `/api/payments/initiate` → redirects to Paystack

```typescript
'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const NGN_PRESETS = [1000, 2500, 5000, 10000, 25000, 50000]
const USD_PRESETS = [5, 10, 25, 50, 100, 250]

export function PartnershipForm() {
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [frequency, setFrequency] = useState<'one_time' | 'monthly'>('one_time')
  const [amount, setAmount] = useState<number | ''>('')
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const presets = currency === 'NGN' ? NGN_PRESETS : USD_PRESETS
  const symbol = currency === 'NGN' ? '₦' : '$'

  // Amount in smallest unit (kobo or cents)
  const finalAmount = amount
    ? Number(amount) * 100
    : customAmount
    ? Number(customAmount) * 100
    : 0

  const handlePay = async () => {
    if (!name.trim() || !email.trim() || finalAmount < 100) {
      toast.error('Please fill in all fields and select an amount')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          amount: finalAmount,
          currency,
          frequency,
          type: 'partnership',
          callbackUrl: `${window.location.origin}/partner/verify`,
          metadata: { name: name.trim() },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Redirect to Paystack checkout
      window.location.href = data.authorizationUrl
    } catch (error: any) {
      toast.error(error.message ?? 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Currency toggle */}
      <div className="flex gap-2 mb-6">
        {(['NGN', 'USD'] as const).map(c => (
          <button
            key={c}
            onClick={() => { setCurrency(c); setAmount(''); setCustomAmount('') }}
            className="flex-1 py-2.5 font-body text-sm font-semibold transition-all"
            style={{
              background: currency === c ? '#C9A84C' : 'transparent',
              color: currency === c ? '#0F0F0F' : 'var(--color-text-secondary)',
              border: `1px solid ${currency === c ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {c === 'NGN' ? '₦ Naira' : '$ Dollar'}
          </button>
        ))}
      </div>

      {/* Frequency toggle */}
      <div className="flex gap-2 mb-6">
        {([
          { value: 'one_time', label: 'Give Once' },
          { value: 'monthly', label: 'Give Monthly' },
        ] as const).map(f => (
          <button
            key={f.value}
            onClick={() => setFrequency(f.value)}
            className="flex-1 py-2.5 font-body text-sm transition-all"
            style={{
              background: frequency === f.value ? 'rgba(201,168,76,0.1)' : 'transparent',
              color: frequency === f.value ? '#C9A84C' : 'var(--color-text-secondary)',
              border: `1px solid ${frequency === f.value ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Preset amounts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {presets.map(preset => (
          <button
            key={preset}
            onClick={() => { setAmount(preset); setCustomAmount('') }}
            className="py-3 font-body text-sm font-semibold transition-all"
            style={{
              background: amount === preset ? '#C9A84C' : 'rgba(255,255,255,0.04)',
              color: amount === preset ? '#0F0F0F' : 'var(--color-text-primary)',
              border: `1px solid ${amount === preset ? '#C9A84C' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {symbol}{preset.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm"
          style={{ color: 'var(--color-text-secondary)' }}>
          {symbol}
        </span>
        <input
          type="number"
          value={customAmount}
          onChange={e => { setCustomAmount(e.target.value); setAmount('') }}
          placeholder="Custom amount"
          className="w-full pl-8 pr-4 py-3 font-body text-sm border outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: customAmount ? '#C9A84C' : 'rgba(255,255,255,0.1)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = customAmount ? '#C9A84C' : 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Name + Email */}
      <div className="flex flex-col gap-3 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your full name"
          className="w-full px-4 py-3 font-body text-sm border outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email address"
          className="w-full px-4 py-3 font-body text-sm border outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Summary */}
      {finalAmount > 0 && (
        <div className="px-4 py-3 mb-4 border"
          style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)' }}>
          <p className="font-body text-sm" style={{ color: '#C9A84C' }}>
            {symbol}{(finalAmount / 100).toLocaleString()} {currency}
            {frequency === 'monthly' ? ' / month' : ' one-time'}
          </p>
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={loading || finalAmount < 100 || !name.trim() || !email.trim()}
        className="w-full py-4 font-body font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-40"
        style={{ background: '#C9A84C', color: '#0F0F0F' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Processing…
          </span>
        ) : (
          `Give ${finalAmount > 0 ? `${symbol}${(finalAmount / 100).toLocaleString()}` : 'Now'}`
        )}
      </button>

      <p className="font-body text-xs text-center mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Secured by Paystack · SSL encrypted
      </p>
    </div>
  )
}
```

---

## TASK 7 — Partner Verify Page

Create `src/app/(public)/partner/verify/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function PartnerVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference') ?? searchParams.get('trxref')
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!reference) { setStatus('failed'); setMessage('No payment reference found.'); return }

    fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          setMessage('Your gift has been received. Thank you for partnering with Room For You.')
        } else {
          setStatus('failed')
          setMessage(data.error ?? 'Payment verification failed.')
        }
      })
      .catch(() => {
        setStatus('failed')
        setMessage('Network error. Please contact us at hello@rfyglobal.org.')
      })
  }, [reference])

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0F0F0F' }}>
      <div className="w-full max-w-md text-center">
        <img src="/images/logo-white.png" alt="Room For You"
          style={{ height: '48px', margin: '0 auto 40px', display: 'block' }} />

        {status === 'loading' && (
          <>
            <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: '#C9A84C' }} />
            <p className="font-body text-sm" style={{ color: '#A0A0A0' }}>Verifying your payment…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#22C55E' }} />
            <h1 className="font-display text-2xl mb-3" style={{ color: '#F8F8F8' }}>
              Thank you! 🙏
            </h1>
            <p className="font-body text-sm mb-8 leading-relaxed" style={{ color: '#A0A0A0' }}>
              {message}
            </p>
            <p className="font-body text-xs mb-6" style={{ color: '#585858' }}>
              Reference: {reference}
            </p>
            <button onClick={() => router.push('/')}
              className="px-8 py-3 font-body text-sm font-semibold uppercase tracking-widest"
              style={{ background: '#C9A84C', color: '#0F0F0F' }}>
              Back to Home
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={48} className="mx-auto mb-4" style={{ color: '#E53E3E' }} />
            <h1 className="font-display text-2xl mb-3" style={{ color: '#F8F8F8' }}>
              Payment Failed
            </h1>
            <p className="font-body text-sm mb-8 leading-relaxed" style={{ color: '#A0A0A0' }}>
              {message}
            </p>
            <button onClick={() => router.push('/partner')}
              className="px-8 py-3 font-body text-sm font-semibold uppercase tracking-widest"
              style={{ background: '#C9A84C', color: '#0F0F0F' }}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## TASK 8 — Event Payment Integration

If events have a price field, update the event registration to support payment.

Check `src/app/api/events/[id]/register/route.ts` — if the event has `price > 0`, the registration should require payment first.

Update the event registration page `src/app/(public)/events/[slug]/page.tsx` or its registration form:

```typescript
// In the registration form, if event.price > 0:
// Show currency selector (NGN/USD)
// On submit, call /api/payments/initiate first
// After Paystack redirect and verification, complete registration

// If event.price === 0 or null:
// Register directly without payment (existing flow)
```

Create `src/app/(public)/events/[slug]/verify/page.tsx` — same pattern as `/partner/verify` but redirects to `/events/[slug]` on success.

---

## TASK 9 — GivingRecord Schema Check

Verify `prisma/schema.prisma` has the `GivingRecord` model with all required fields:

```prisma
model GivingRecord {
  id          String   @id @default(cuid())
  reference   String   @unique
  email       String
  name        String
  amount      Int      // in smallest unit (kobo/cents)
  currency    String   // 'NGN' | 'USD'
  frequency   String   @default("one_time") // 'one_time' | 'monthly'
  type        String   @default("partnership") // 'partnership' | 'event'
  eventId     String?
  status      String   @default("SUCCESS")
  paystackData Json?
  createdAt   DateTime @default(now())
}
```

If any fields are missing, add them and run `npx prisma db push`.

---

## TASK 10 — Admin Integrations: Paystack Keys

The admin must enter Paystack keys in `/admin/integrations` before payments work.

Verify the Paystack integration card in `src/app/admin/(dashboard)/integrations/page.tsx` or its component shows fields for:
- **Secret Key** — `sk_live_...` or `sk_test_...`
- **Public Key** — `pk_live_...` or `pk_test_...`
- **Webhook Secret** — for verifying webhook signatures
- **Mode toggle** — Test / Live

If these fields are missing or incomplete, add them.

---

## COMPLETION CHECKLIST

**Paystack Setup**
- [ ] `src/lib/paystack.ts` created with `getPaystackCredentials` and `paystackRequest`
- [ ] Admin enters Paystack keys in `/admin/integrations` → keys stored in DB

**Payment Initiate**
- [ ] `POST /api/payments/initiate` accepts amount, currency, frequency, type
- [ ] Returns `authorizationUrl` for redirect to Paystack
- [ ] Monthly recurring uses Paystack Plans API
- [ ] One-time uses standard transaction initialize

**Payment Verify**
- [ ] `POST /api/payments/verify` verifies with Paystack API
- [ ] Saves `GivingRecord` to DB on success
- [ ] Sends confirmation email from `partner@rfyglobal.org`
- [ ] Notifies admin via SSE bell

**Webhook**
- [ ] `POST /api/webhooks/paystack` verifies signature
- [ ] Handles `charge.success` event
- [ ] Handles `subscription.create` event
- [ ] Duplicate prevention via reference check

**Partnership Form**
- [ ] NGN / USD currency toggle
- [ ] One-time / Monthly frequency toggle
- [ ] Preset amounts (different for NGN vs USD)
- [ ] Custom amount input
- [ ] Name + email fields
- [ ] Amount summary before paying
- [ ] "Give Now" button → redirects to Paystack
- [ ] `/partner/verify` page shows success/failure

**Events**
- [ ] Free events → register directly (no payment)
- [ ] Paid events → payment required before registration
- [ ] `/events/[slug]/verify` page handles event payment verification

**Database**
- [ ] `GivingRecord` model has `currency`, `frequency`, `type` fields
- [ ] `npx prisma db push` succeeds

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Paystack amounts are always in the **smallest currency unit** — kobo for NGN (₦100 = 10000 kobo), cents for USD ($1 = 100 cents). Always multiply display amounts by 100 before sending to Paystack, and divide by 100 when displaying.
- Paystack supports NGN and USD natively. For USD, ensure your Paystack account has USD enabled (Paystack Dashboard → Settings → Payments).
- For monthly recurring, Paystack creates a **Plan** (a template for recurring charges) and a **Subscription** (a customer subscribed to a plan). The first charge happens via normal transaction initialize with a `plan` parameter. Subsequent charges happen automatically.
- The webhook URL must be configured in Paystack Dashboard → Settings → API Keys & Webhooks → Webhook URL: `https://rfyglobal.org/api/webhooks/paystack`
- After entering keys in admin/integrations, test with Paystack test keys first (`sk_test_...`, `pk_test_...`) before going live.
- The `paystackRequest` helper reads credentials from DB on every call — this is intentional so key changes in admin/integrations take effect immediately without restart.
- Minimum amounts: Paystack requires minimum ₦100 (10000 kobo) for NGN and $1 (100 cents) for USD.
