# ROOM FOR YOU — Phase 4 Cursor Prompt
## Partnership Page & Payment Integrations

---

## CONTEXT

Phases 1–3 are complete. The landing page, form builder, blog, study portal, and events are all live.

Phase 4 builds the **Partnership / Giving system**:
- A beautiful public `/partner` page with giving tiers, vision of partnership, and payment options
- **Paystack** — one-time + recurring (subscriptions via Paystack Plans)
- **Flutterwave** — one-time + recurring (payment plans)
- **Payaza** — one-time only
- **Bank transfer** — display account details
- Webhook handlers for each gateway to record confirmed payments
- Admin `/admin/partner` page to view all giving records

---

## INSTALL ADDITIONAL DEPENDENCIES

```bash
npm install paystack-node flutterwave-node-v3
```

> Payaza has no official Node SDK — we call their REST API directly via `fetch`.

---

## TASK 1 — Payment Zod Schemas

Create `src/lib/validations/payment.ts`:

```typescript
import { z } from 'zod'

export const InitiatePaymentSchema = z.object({
  amount: z.number().min(100, 'Minimum gift is ₦100'),
  currency: z.string().default('NGN'),
  donorName: z.string().min(1, 'Name is required').max(200),
  donorEmail: z.string().email('Valid email required'),
  gateway: z.enum(['PAYSTACK', 'FLUTTERWAVE', 'PAYAZA']),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'ANNUAL']),
  planCode: z.string().optional(), // for Paystack recurring plans
})

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>
```

---

## TASK 2 — Payment Helper Library

Create `src/lib/payments/paystack.ts`:

```typescript
export const PAYSTACK_BASE = 'https://api.paystack.co'

const headers = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
})

// Initialize a one-time transaction
export async function paystackInitialize(params: {
  email: string
  amount: number // in kobo (multiply NGN by 100)
  reference: string
  metadata?: Record<string, unknown>
  callback_url: string
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return res.json()
}

// Initialize a subscription (recurring)
export async function paystackCreateSubscription(params: {
  customer: string // email
  plan: string    // plan code
  start_date?: string
}) {
  const res = await fetch(`${PAYSTACK_BASE}/subscription`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return res.json()
}

// Verify a transaction by reference
export async function paystackVerify(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: headers(),
  })
  return res.json()
}

// Verify webhook signature
export function verifyPaystackWebhook(body: string, signature: string): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return hash === signature
}
```

Create `src/lib/payments/flutterwave.ts`:

```typescript
export const FLW_BASE = 'https://api.flutterwave.com/v3'

const headers = () => ({
  Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
  'Content-Type': 'application/json',
})

// Initialize a payment
export async function flutterwaveInitialize(params: {
  tx_ref: string
  amount: number
  currency: string
  redirect_url: string
  customer: { email: string; name: string }
  payment_plan?: string // plan ID for recurring
  meta?: Record<string, unknown>
}) {
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return res.json()
}

// Verify a transaction
export async function flutterwaveVerify(transactionId: string) {
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: headers(),
  })
  return res.json()
}

// Verify webhook signature
export function verifyFlutterwaveWebhook(signature: string): boolean {
  return signature === process.env.FLUTTERWAVE_WEBHOOK_SECRET
}
```

Create `src/lib/payments/payaza.ts`:

```typescript
export const PAYAZA_BASE = 'https://api.payaza.africa'

const headers = () => ({
  Authorization: `Payaza ${process.env.PAYAZA_SECRET_KEY}`,
  'Content-Type': 'application/json',
})

// Initialize a one-time payment
export async function payazaInitialize(params: {
  transaction_ref: string
  email: string
  amount: number
  currency: string
  description: string
  callback_url: string
  return_url: string
}) {
  const res = await fetch(`${PAYAZA_BASE}/merchant/api/v1/checkout/request`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      merchant_transaction_reference: params.transaction_ref,
      payer: { email: params.email },
      transaction_amount: params.amount,
      currency: params.currency,
      description: params.description,
      callback_url: params.callback_url,
      return_url: params.return_url,
    }),
  })
  return res.json()
}

// Verify webhook
export function verifyPayazaWebhook(signature: string, body: string): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha256', process.env.PAYAZA_SECRET_KEY!)
    .update(body)
    .digest('hex')
  return hash === signature
}
```

---

## TASK 3 — Reference Generator Utility

Add to `src/lib/utils.ts`:

```typescript
export function generateReference(prefix: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
```

---

## TASK 4 — Payment Initiation API Routes

Create `src/app/api/payments/initiate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InitiatePaymentSchema } from '@/lib/validations/payment'
import { generateReference } from '@/lib/utils'
import { paystackInitialize } from '@/lib/payments/paystack'
import { flutterwaveInitialize } from '@/lib/payments/flutterwave'
import { payazaInitialize } from '@/lib/payments/payaza'
import { strictRatelimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`payment:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = InitiatePaymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { amount, currency, donorName, donorEmail, gateway, frequency } = parsed.data
  const reference = generateReference(gateway.slice(0, 3))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const callbackUrl = `${appUrl}/partner/verify?gateway=${gateway}&ref=${reference}`

  // Create pending record
  await db.givingRecord.create({
    data: {
      donorName,
      donorEmail,
      amount,
      currency,
      gateway: gateway as 'PAYSTACK' | 'FLUTTERWAVE' | 'PAYAZA',
      reference,
      status: 'PENDING',
      meta: { frequency },
    },
  })

  try {
    if (gateway === 'PAYSTACK') {
      // Recurring: create subscription after customer charge
      // For MONTHLY/ANNUAL we pass plan codes defined in Paystack dashboard
      const planCode = frequency === 'MONTHLY'
        ? process.env.PAYSTACK_MONTHLY_PLAN_CODE
        : frequency === 'ANNUAL'
        ? process.env.PAYSTACK_ANNUAL_PLAN_CODE
        : undefined

      const data = await paystackInitialize({
        email: donorEmail,
        amount: amount * 100, // kobo
        reference,
        metadata: { donor_name: donorName, frequency, custom_fields: [] },
        callback_url: callbackUrl,
        ...(planCode && { plan: planCode }),
      })

      if (!data.status) throw new Error(data.message ?? 'Paystack initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference })
    }

    if (gateway === 'FLUTTERWAVE') {
      const planId = frequency === 'MONTHLY'
        ? process.env.FLUTTERWAVE_MONTHLY_PLAN_ID
        : frequency === 'ANNUAL'
        ? process.env.FLUTTERWAVE_ANNUAL_PLAN_ID
        : undefined

      const data = await flutterwaveInitialize({
        tx_ref: reference,
        amount,
        currency,
        redirect_url: callbackUrl,
        customer: { email: donorEmail, name: donorName },
        ...(planId && { payment_plan: planId }),
        meta: { frequency },
      })

      if (data.status !== 'success') throw new Error(data.message ?? 'Flutterwave initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.link, reference })
    }

    if (gateway === 'PAYAZA') {
      // Payaza: one-time only
      const data = await payazaInitialize({
        transaction_ref: reference,
        email: donorEmail,
        amount,
        currency,
        description: `Room For You Partnership Gift`,
        callback_url: callbackUrl,
        return_url: callbackUrl,
      })

      if (!data.success) throw new Error(data.message ?? 'Payaza initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.checkout_url, reference })
    }

    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 })
  } catch (err: unknown) {
    // Mark as failed
    await db.givingRecord.update({
      where: { reference },
      data: { status: 'FAILED' },
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment initialization failed' },
      { status: 500 }
    )
  }
}
```

---

## TASK 5 — Payment Verification Route

Create `src/app/api/payments/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paystackVerify } from '@/lib/payments/paystack'
import { flutterwaveVerify } from '@/lib/payments/flutterwave'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gateway = searchParams.get('gateway')
  const reference = searchParams.get('ref')
  const transactionId = searchParams.get('transaction_id') // Flutterwave

  if (!gateway || !reference) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const record = await db.givingRecord.findUnique({ where: { reference } })
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  // Already verified
  if (record.status === 'SUCCESS') {
    return NextResponse.json({ status: 'success', reference })
  }

  try {
    let verified = false

    if (gateway === 'PAYSTACK') {
      const data = await paystackVerify(reference)
      verified = data.data?.status === 'success'
      if (verified) {
        await db.givingRecord.update({
          where: { reference },
          data: { status: 'SUCCESS', meta: { ...(record.meta as object), paystackData: data.data } },
        })
      }
    }

    if (gateway === 'FLUTTERWAVE' && transactionId) {
      const data = await flutterwaveVerify(transactionId)
      verified = data.data?.status === 'successful' && data.data?.tx_ref === reference
      if (verified) {
        await db.givingRecord.update({
          where: { reference },
          data: { status: 'SUCCESS', meta: { ...(record.meta as object), flwData: data.data } },
        })
      }
    }

    if (gateway === 'PAYAZA') {
      // Payaza verification is done via webhook; treat redirect as pending
      verified = record.status === 'SUCCESS'
    }

    if (!verified) {
      await db.givingRecord.update({ where: { reference }, data: { status: 'FAILED' } })
    }

    return NextResponse.json({ status: verified ? 'success' : 'failed', reference })
  } catch {
    return NextResponse.json({ status: 'error', reference }, { status: 500 })
  }
}
```

---

## TASK 6 — Webhook Routes

### Paystack Webhook — `src/app/api/webhooks/paystack/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPaystackWebhook } from '@/lib/payments/paystack'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  if (!verifyPaystackWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'charge.success') {
    const { reference, amount, customer } = event.data
    await db.givingRecord.upsert({
      where: { reference },
      update: { status: 'SUCCESS' },
      create: {
        reference,
        amount: amount / 100,
        currency: event.data.currency ?? 'NGN',
        gateway: 'PAYSTACK',
        status: 'SUCCESS',
        donorEmail: customer?.email ?? null,
        donorName: customer?.metadata?.donor_name ?? null,
        meta: event.data,
      },
    })
  }

  if (event.event === 'subscription.create') {
    // Log subscription creation for recurring donors
    const { reference } = event.data
    if (reference) {
      await db.givingRecord.updateMany({
        where: { reference },
        data: { meta: { subscriptionCreated: true, data: event.data } },
      })
    }
  }

  return NextResponse.json({ received: true })
}
```

### Flutterwave Webhook — `src/app/api/webhooks/flutterwave/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyFlutterwaveWebhook } from '@/lib/payments/flutterwave'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('verif-hash') ?? ''

  if (!verifyFlutterwaveWebhook(signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = await req.json()

  if (event.event === 'charge.completed' && event.data?.status === 'successful') {
    const { tx_ref, amount, currency, customer } = event.data
    await db.givingRecord.upsert({
      where: { reference: tx_ref },
      update: { status: 'SUCCESS' },
      create: {
        reference: tx_ref,
        amount,
        currency: currency ?? 'NGN',
        gateway: 'FLUTTERWAVE',
        status: 'SUCCESS',
        donorEmail: customer?.email ?? null,
        donorName: customer?.name ?? null,
        meta: event.data,
      },
    })
  }

  return NextResponse.json({ received: true })
}
```

### Payaza Webhook — `src/app/api/webhooks/payaza/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPayazaWebhook } from '@/lib/payments/payaza'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-payaza-signature') ?? ''

  if (!verifyPayazaWebhook(signature, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event_type === 'successful') {
    const ref = event.transaction_data?.merchant_transaction_reference
    if (ref) {
      await db.givingRecord.upsert({
        where: { reference: ref },
        update: { status: 'SUCCESS' },
        create: {
          reference: ref,
          amount: event.transaction_data?.transaction_amount ?? 0,
          currency: event.transaction_data?.currency ?? 'NGN',
          gateway: 'PAYAZA',
          status: 'SUCCESS',
          donorEmail: event.transaction_data?.payer?.email ?? null,
          donorName: null,
          meta: event,
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}
```

---

## TASK 7 — Update Environment Variables

Add to `.env.local` and `.env.example`:

```env
# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=""
PAYSTACK_SECRET_KEY=""
PAYSTACK_WEBHOOK_SECRET=""
PAYSTACK_MONTHLY_PLAN_CODE=""   # Create in Paystack dashboard → Plans
PAYSTACK_ANNUAL_PLAN_CODE=""

# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=""
FLUTTERWAVE_SECRET_KEY=""
FLUTTERWAVE_WEBHOOK_SECRET=""   # The "secret hash" set in FLW dashboard
FLUTTERWAVE_MONTHLY_PLAN_ID=""  # Create in Flutterwave dashboard → Payment Plans
FLUTTERWAVE_ANNUAL_PLAN_ID=""

# Payaza
NEXT_PUBLIC_PAYAZA_PUBLIC_KEY=""
PAYAZA_SECRET_KEY=""
```

---

## TASK 8 — Payment Verification Redirect Page

Create `src/app/(public)/partner/verify/page.tsx`:

This page is where all three gateways redirect after payment. It:
- Reads `gateway` and `ref` from URL search params
- Calls `GET /api/payments/verify?gateway=...&ref=...`
- Shows a loading spinner while verifying
- On success: shows a beautiful thank-you screen
- On failure: shows an error with a "Try again" link back to `/partner`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

type Status = 'loading' | 'success' | 'failed' | 'error'

export default function PaymentVerifyPage() {
  const params = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const gateway = params.get('gateway')
    const ref = params.get('ref')
    const transactionId = params.get('transaction_id')

    if (!gateway || !ref) { setStatus('error'); return }

    const url = `/api/payments/verify?gateway=${gateway}&ref=${ref}${transactionId ? `&transaction_id=${transactionId}` : ''}`

    fetch(url)
      .then((r) => r.json())
      .then((data) => setStatus(data.status === 'success' ? 'success' : 'failed'))
      .catch(() => setStatus('error'))
  }, [params])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center py-24">
          {status === 'loading' && (
            <div className="space-y-6">
              <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-body text-white/50">Verifying your gift…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mx-auto">
                <span className="text-gold text-2xl">✓</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <h1 className="font-display text-4xl text-white">Thank You.</h1>
              <p className="text-white/50 font-body leading-relaxed max-w-sm mx-auto">
                Your partnership gift has been received. You are sowing into the Kingdom.
                God sees every seed planted in faith.
              </p>
              <p className="text-gold/70 font-display text-lg italic">
                "…God loves a cheerful giver." — 2 Cor 9:7
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <Link href="/"
                className="inline-block px-8 py-3 border border-gold text-gold font-body text-sm tracking-widest uppercase hover:bg-gold hover:text-black transition-all duration-300">
                Back to Home
              </Link>
            </div>
          )}

          {(status === 'failed' || status === 'error') && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full border-2 border-red-brand/60 flex items-center justify-center mx-auto">
                <span className="text-red-brand text-2xl">×</span>
              </div>
              <h1 className="font-display text-3xl text-white">Payment Unsuccessful</h1>
              <p className="text-white/50 font-body">
                We could not confirm your payment. Please try again or contact us.
              </p>
              <Link href="/partner"
                className="inline-block px-8 py-3 bg-gold text-black font-body text-sm tracking-widest uppercase hover:bg-gold-light transition-all duration-300">
                Try Again
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
```

---

## TASK 9 — Partnership Page

Create `src/app/(public)/partner/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PartnershipClientPage } from '@/components/partnership/PartnershipClientPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner With Us — Room For You',
  description: 'Support the vision of Room For You. Your giving fuels the mission of Jesus to Nations.',
}

export default function PartnerPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <PartnershipClientPage />
      </main>
      <Footer />
    </>
  )
}
```

---

## TASK 10 — PartnershipClientPage Component

Create `src/components/partnership/PartnershipClientPage.tsx`:

This is the main partnership UI. It must be visually exceptional — this page handles giving and must feel trustworthy, sacred, and intentional.

**Page structure (top to bottom):**

### Section 1 — Hero
- Full-width, pt-24 for navbar clearance
- Gold eyebrow: `"PARTNER WITH US"`
- Display heading: `"Fuel the Mission"` — Cormorant Garamond, very large, white
- Subtext: `"Every gift you sow into Room For You is a seed planted in the Kingdom. You are not just giving money — you are sending the Gospel to nations."`
- Scripture: *"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Corinthians 9:7* in gold italic

### Section 2 — What Your Gift Funds
Three cards in a row:
- 🏛 **Community Gatherings** — "Funding physical meetings across cities where the Word comes alive."
- 📖 **Study & Resources** — "Producing study materials, devotionals, and equipping tools for the community."
- 🌍 **Evangelical Outreach** — "Taking the Gospel to the streets — foot evangelism and outreaches."

### Section 3 — Give Now (The Main Form)

This is a two-panel giving form:

**Left panel — Amount & Frequency:**
- Frequency selector: `One-Time` | `Monthly` | `Annual` (styled as tab buttons, gold active state)
- Preset amount buttons: ₦1,000 · ₦2,500 · ₦5,000 · ₦10,000 · ₦25,000 · ₦50,000
- Custom amount input: "Or enter your own amount" — `₦` prefix, number input
- Note below: "Payaza supports one-time gifts only. For recurring giving, use Paystack or Flutterwave."

**Right panel — Donor Info & Gateway:**
- Full name input
- Email input
- Gateway selector: three cards — **Paystack**, **Flutterwave**, **Payaza** (Payaza card is auto-disabled and shows a tooltip when Monthly/Annual is selected)
- Each gateway card shows: logo/name, short description, "Supports recurring" badge (Paystack + Flutterwave only)
- **"Give Now"** button — gold, full width, large
- On submit: POST to `/api/payments/initiate`, then redirect to `authorizationUrl`
- Loading state on button during API call

**Note:** All form state managed with `useState`. No `react-hook-form` needed here — the form is simple enough.

### Section 4 — Bank Transfer
A clean card with:
- Heading: `"Prefer Bank Transfer?"`
- Bank details displayed clearly:
  - **Bank:** (admin sets this — use placeholder for now)
  - **Account Name:** Room For You
  - **Account Number:** (placeholder)
- Instruction: "After transfer, please send your name and amount to [contact email] so we can acknowledge your gift."
- A "Copy Account Number" button (copies to clipboard, shows ✓ feedback)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Frequency = 'ONE_TIME' | 'MONTHLY' | 'ANNUAL'
type Gateway = 'PAYSTACK' | 'FLUTTERWAVE' | 'PAYAZA'

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000]

const GATEWAYS: { id: Gateway; name: string; description: string; supportsRecurring: boolean }[] = [
  { id: 'PAYSTACK', name: 'Paystack', description: 'Cards, bank transfer, USSD', supportsRecurring: true },
  { id: 'FLUTTERWAVE', name: 'Flutterwave', description: 'Cards, mobile money, bank', supportsRecurring: true },
  { id: 'PAYAZA', name: 'Payaza', description: 'One-time payments only', supportsRecurring: false },
]

export function PartnershipClientPage() {
  const router = useRouter()
  const [frequency, setFrequency] = useState<Frequency>('ONE_TIME')
  const [amount, setAmount] = useState<number>(5000)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [gateway, setGateway] = useState<Gateway>('PAYSTACK')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeAmount = customAmount ? parseInt(customAmount) : amount

  const handleGive = async () => {
    if (!donorName.trim()) { toast.error('Please enter your name'); return }
    if (!donorEmail.trim()) { toast.error('Please enter your email'); return }
    if (!activeAmount || activeAmount < 100) { toast.error('Minimum gift is ₦100'); return }
    if (gateway === 'PAYAZA' && frequency !== 'ONE_TIME') {
      toast.error('Payaza supports one-time gifts only. Please select Paystack or Flutterwave for recurring giving.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: activeAmount,
          currency: 'NGN',
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          gateway,
          frequency,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? 'Failed to initialize payment')
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyAccountNumber = () => {
    navigator.clipboard.writeText('0123456789') // Replace with real account number
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="pt-24">
      {/* ── HERO ── */}
      <section className="max-w-4xl mx-auto px-6 text-center py-20">
        <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-6">
          Partner With Us
        </p>
        <h1 className="font-display text-5xl lg:text-7xl text-white mb-6 leading-none">
          Fuel the Mission
        </h1>
        <p className="text-white/60 font-body text-lg leading-relaxed max-w-2xl mx-auto mb-10">
          Every gift you sow into Room For You is a seed planted in the Kingdom.
          You are not just giving money — you are sending the Gospel to nations.
        </p>
        <p className="font-display text-xl italic text-gold max-w-xl mx-auto">
          "Each of you should give what you have decided in your heart to give…
          for God loves a cheerful giver."
          <span className="block text-sm text-gold/60 not-italic font-body mt-2">
            — 2 Corinthians 9:7
          </span>
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mt-12" />
      </section>

      {/* ── WHAT YOUR GIFT FUNDS ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🏛', title: 'Community Gatherings', desc: 'Funding physical meetings across cities where the Word comes alive.' },
            { icon: '📖', title: 'Study & Resources', desc: 'Producing study materials, devotionals, and equipping tools for the community.' },
            { icon: '🌍', title: 'Evangelical Outreach', desc: 'Taking the Gospel to the streets — foot evangelism and outreaches.' },
          ].map((item) => (
            <div key={item.title}
              className="border border-white/10 p-6 hover:border-gold/30 transition-colors">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-display text-lg text-white mb-2">{item.title}</h3>
              <p className="text-white/50 font-body text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GIVE NOW ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-16" />
        <h2 className="font-display text-3xl text-white text-center mb-12">Give Now</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Amount & Frequency */}
          <div className="space-y-8">
            {/* Frequency */}
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">
                Giving Frequency
              </p>
              <div className="flex">
                {(['ONE_TIME', 'MONTHLY', 'ANNUAL'] as Frequency[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFrequency(f)
                      if (f !== 'ONE_TIME' && gateway === 'PAYAZA') setGateway('PAYSTACK')
                    }}
                    className={cn(
                      'flex-1 py-3 text-sm font-body tracking-wide border transition-all',
                      frequency === f
                        ? 'bg-gold text-black border-gold'
                        : 'border-white/20 text-white/60 hover:border-gold/40 hover:text-white'
                    )}
                  >
                    {f === 'ONE_TIME' ? 'One-Time' : f === 'MONTHLY' ? 'Monthly' : 'Annual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset amounts */}
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">
                Select Amount
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount('') }}
                    className={cn(
                      'py-3 text-sm font-body border transition-all',
                      amount === a && !customAmount
                        ? 'bg-gold text-black border-gold'
                        : 'border-white/20 text-white/60 hover:border-gold/40 hover:text-white'
                    )}
                  >
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">
                Or Enter Amount
              </p>
              <div className="flex items-center border border-white/20 focus-within:border-gold transition-colors">
                <span className="px-4 py-3 text-gold font-body border-r border-white/20">₦</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setAmount(0) }}
                  placeholder="Enter amount"
                  className="flex-1 bg-transparent text-white px-4 py-3 font-body focus:outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            {frequency !== 'ONE_TIME' && (
              <p className="text-xs text-white/30 font-body">
                * Payaza supports one-time gifts only. For recurring giving, use Paystack or Flutterwave.
              </p>
            )}
          </div>

          {/* Right: Donor Info & Gateway */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                Full Name
              </label>
              <input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-white/3 border border-white/10 text-white px-4 py-3 font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/3 border border-white/10 text-white px-4 py-3 font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>

            {/* Gateway selector */}
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-3">
                Payment Method
              </p>
              <div className="space-y-2">
                {GATEWAYS.map((gw) => {
                  const disabled = frequency !== 'ONE_TIME' && !gw.supportsRecurring
                  return (
                    <button
                      key={gw.id}
                      onClick={() => !disabled && setGateway(gw.id)}
                      disabled={disabled}
                      className={cn(
                        'w-full flex items-center justify-between p-4 border transition-all text-left',
                        gateway === gw.id && !disabled
                          ? 'border-gold bg-gold/5'
                          : disabled
                          ? 'border-white/5 opacity-40 cursor-not-allowed'
                          : 'border-white/10 hover:border-gold/30'
                      )}
                    >
                      <div>
                        <p className={cn('font-body text-sm font-medium',
                          gateway === gw.id && !disabled ? 'text-gold' : 'text-white'
                        )}>
                          {gw.name}
                        </p>
                        <p className="text-white/40 text-xs font-body mt-0.5">{gw.description}</p>
                      </div>
                      {gw.supportsRecurring && (
                        <span className="text-[10px] px-2 py-0.5 bg-gold/10 text-gold/70 font-body tracking-wide">
                          Recurring ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Give Button */}
            <button
              onClick={handleGive}
              disabled={loading}
              className="w-full py-4 bg-gold text-black font-body font-medium text-base tracking-widest uppercase hover:bg-gold-light transition-all duration-300 disabled:opacity-50 animate-pulse-gold"
            >
              {loading
                ? 'Processing…'
                : `Give ₦${(activeAmount || 0).toLocaleString()} ${frequency === 'MONTHLY' ? '/ month' : frequency === 'ANNUAL' ? '/ year' : ''}`
              }
            </button>
          </div>
        </div>
      </section>

      {/* ── BANK TRANSFER ── */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-16" />
        <div className="border border-white/10 p-8 text-center">
          <h2 className="font-display text-2xl text-white mb-6">Prefer Bank Transfer?</h2>
          <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
            <div className="flex justify-between py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-white/40 font-body text-sm">Bank</span>
              <span className="text-white font-body text-sm">Access Bank</span>
            </div>
            <div className="flex justify-between py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-white/40 font-body text-sm">Account Name</span>
              <span className="text-white font-body text-sm">Room For You</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-white/40 font-body text-sm">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-gold font-mono text-sm">0123456789</span>
                <button onClick={copyAccountNumber}
                  className="p-1.5 text-white/30 hover:text-gold transition-colors">
                  {copied ? <Check size={14} className="text-gold" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-white/40 font-body text-sm leading-relaxed">
            After your transfer, please send your name and amount to{' '}
            <a href="mailto:partner@rfyglobal.org"
              className="text-gold hover:underline">
              partner@rfyglobal.org
            </a>{' '}
            so we can acknowledge your gift.
          </p>
        </div>
      </section>
    </div>
  )
}
```

---

## TASK 11 — Admin Partnership Records Page

Create `src/app/admin/(dashboard)/partner/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPartnerPage() {
  const [records, stats] = await Promise.all([
    db.givingRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.givingRecord.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const total = stats._sum.amount ?? 0
  const count = stats._count.id ?? 0

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-white">Partnership Records</h2>
        <p className="text-white/40 text-sm font-body mt-1">All giving records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Confirmed Gifts', value: count.toLocaleString() },
          { label: 'Total Amount (NGN)', value: `₦${total.toLocaleString()}` },
          { label: 'Pending / Failed', value: records.filter((r) => r.status !== 'SUCCESS').length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="border p-5" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
            <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-2">{stat.label}</p>
            <p className="font-display text-3xl text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Records table */}
      <div className="border overflow-hidden" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#111' }}>
                {['Date', 'Name', 'Email', 'Amount', 'Gateway', 'Frequency', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold/70">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-white/2 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <td className="px-4 py-3 text-white/50">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-white">{r.donorName ?? '—'}</td>
                  <td className="px-4 py-3 text-white/60">{r.donorEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-white font-medium">₦{r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/60">{r.gateway}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {(r.meta as Record<string, string>)?.frequency ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest ${
                      r.status === 'SUCCESS'
                        ? 'bg-gold/20 text-gold'
                        : r.status === 'PENDING'
                        ? 'bg-white/10 text-white/50'
                        : 'bg-red-brand/20 text-red-brand'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-xl text-white/30 italic">No giving records yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## PHASE 4 COMPLETION CHECKLIST

Before moving to Phase 5, verify:

- [ ] `/partner` renders all four sections correctly on desktop and mobile
- [ ] Frequency tabs switch correctly and disable Payaza for recurring
- [ ] Preset amount buttons and custom amount input both work
- [ ] Gateway cards disable correctly when recurring is selected
- [ ] Give Now button calls the API and redirects to payment gateway
- [ ] `/partner/verify` correctly shows success/failure state after redirect
- [ ] Admin `/admin/partner` shows records and stats
- [ ] Webhook routes exist at `/api/webhooks/paystack`, `/api/webhooks/flutterwave`, `/api/webhooks/payaza`
- [ ] Bank transfer card shows details and copy button works
- [ ] `npm run build` completes without errors

---

## NOTES FOR CURSOR

- **Webhook routes must be excluded from CSRF protection.** NextAuth v5's middleware should not interfere with `/api/webhooks/*`. Ensure `middleware.ts` matcher does not include webhook paths — they are already excluded if matcher only covers `/admin/:path*`.
- **Paystack plan codes** (`PAYSTACK_MONTHLY_PLAN_CODE`, `PAYSTACK_ANNUAL_PLAN_CODE`) must be created manually in the Paystack dashboard under Products → Plans before recurring giving works. Leave the env vars empty for now — one-time giving will work without them.
- **Flutterwave plan IDs** (`FLUTTERWAVE_MONTHLY_PLAN_ID`, `FLUTTERWAVE_ANNUAL_PLAN_ID`) must also be created in the Flutterwave dashboard under Payment Plans.
- The **bank account details** (account number, bank name) in `PartnershipClientPage.tsx` are placeholders — Nony will update them with real Room For You account details.
- The **contact email** `partner@rfyglobal.org` is used on the bank transfer section — ensure this mailbox exists or update to the correct address.
- **`export const dynamic = 'force-dynamic'`** is needed on the admin partner page since it reads live DB data. Already included.
- Phase 5 will build the **Daily Scripture system** (admin CRUD, scheduled/random display, MP3 upload, shareable card generation) and the **animated Confession standalone page**.
