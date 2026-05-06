# ROOM FOR YOU — Phase 8 Cursor Prompt
## Credentials & Integrations Dashboard

---

## CONTEXT

Phase 8 moves all third-party credentials — payment gateways, email, and SMS — out of environment variables and into an encrypted database store managed entirely from the admin dashboard.

**What this phase builds:**
- `Credential` Prisma model — stores all secrets encrypted with AES-256-GCM
- `src/lib/encryption.ts` — encrypt/decrypt helper
- `src/lib/credentials.ts` — typed credential fetcher used by payment/email/SMS code
- `/admin/integrations` — beautiful admin page with sections for each integration
- Updated payment initiation, Brevo email, and new EbulkSMS helper to read from DB instead of env vars
- All existing env var references for credentials removed from payment/email code

**Security model:**
- One `CREDENTIALS_ENCRYPTION_KEY` stays in Vercel env vars — this is the only secret that never touches the DB
- Everything else (API keys, secrets, plan codes, webhook secrets) is encrypted in the DB using that key
- Keys display masked in admin UI: `••••••w8A` (last 4 chars visible)
- Full key never returned to the client — masking happens server-side

---

## INSTALL DEPENDENCIES

No new packages needed. Node.js built-in `crypto` module handles AES-256-GCM.

---

## TASK 1 — Add CREDENTIALS_ENCRYPTION_KEY to Environment

Add to `.env.local`:
```env
# Credentials encryption key — NEVER store in DB, NEVER share
# Generate with: openssl rand -hex 32
CREDENTIALS_ENCRYPTION_KEY=""
```

Add to `.env.example`:
```env
CREDENTIALS_ENCRYPTION_KEY=""   # generate: openssl rand -hex 32
```

Add to Vercel environment variables:
```
CREDENTIALS_ENCRYPTION_KEY  →  output of: openssl rand -hex 32
```

This is the **only** credential that stays in Vercel env vars permanently. Everything else moves to the DB.

---

## TASK 2 — Prisma Schema Addition

Add to `prisma/schema.prisma`:

```prisma
model Credential {
  id          String   @id @default(cuid())
  service     String   @unique  // e.g. "paystack", "flutterwave", "brevo", "ebulksms"
  data        String   @db.Text // AES-256-GCM encrypted JSON blob
  isActive    Boolean  @default(true)
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}
```

Run:
```bash
npx prisma db push
```

---

## TASK 3 — Encryption Helper

Create `src/lib/encryption.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12  // 96 bits recommended for GCM
const TAG_LENGTH = 16 // 128 bits auth tag

function getKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not set')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== KEY_LENGTH) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  }
  return buf
}

// Encrypt a plain text string → returns base64 encoded "iv:tag:ciphertext"
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  // Format: base64(iv):base64(tag):base64(ciphertext)
  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

// Decrypt "iv:tag:ciphertext" → plain text string
export function decrypt(encoded: string): string {
  const key = getKey()
  const parts = encoded.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted format')

  const [ivB64, tagB64, dataB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(dataB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
}

// Mask a secret: show only last 4 chars
// e.g. "sk_live_abc123xyz" → "••••••••••••xyz"  
export function maskSecret(value: string): string {
  if (!value || value.length <= 4) return '••••'
  const visible = value.slice(-4)
  const masked = '•'.repeat(Math.min(value.length - 4, 12))
  return `${masked}${visible}`
}
```

---

## TASK 4 — Credentials Service

Create `src/lib/credentials.ts`:

This is the central service all payment/email/SMS code uses to fetch credentials. It reads from DB, decrypts, and returns typed objects.

```typescript
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'
import { cache } from 'react'

// Typed credential shapes per service
export interface PaystackCredentials {
  secretKey: string
  publicKey: string
  webhookSecret: string
  monthlyPlanCode: string
  annualPlanCode: string
  isActive: boolean
}

export interface FlutterwaveCredentials {
  secretKey: string
  publicKey: string
  webhookSecret: string
  monthlyPlanId: string
  annualPlanId: string
  isActive: boolean
}

export interface PayazaCredentials {
  secretKey: string
  publicKey: string
  isActive: boolean
}

export interface BankTransferCredentials {
  bankName: string
  accountName: string
  accountNumber: string
  contactEmail: string
  isActive: boolean
}

export interface BrevoCredentials {
  apiKey: string
  fromEmail: string
  fromName: string
  isActive: boolean
}

export interface EbulkSMSCredentials {
  username: string
  apiKey: string
  senderId: string
  isActive: boolean
}

export interface PaymentSettings {
  minimumGiftAmount: number
}

type ServiceMap = {
  paystack: PaystackCredentials
  flutterwave: FlutterwaveCredentials
  payaza: PayazaCredentials
  bankTransfer: BankTransferCredentials
  brevo: BrevoCredentials
  ebulksms: EbulkSMSCredentials
  paymentSettings: PaymentSettings
}

// Fetch and decrypt credentials for a service
async function fetchCredential<T>(service: string): Promise<T | null> {
  try {
    const record = await db.credential.findUnique({ where: { service } })
    if (!record) return null
    const decrypted = decrypt(record.data)
    return JSON.parse(decrypted) as T
  } catch (err) {
    console.error(`[credentials] Failed to fetch ${service}:`, err)
    return null
  }
}

// Cached fetchers (cached per request in Next.js)
export const getPaystackCredentials = cache(
  () => fetchCredential<PaystackCredentials>('paystack')
)

export const getFlutterwaveCredentials = cache(
  () => fetchCredential<FlutterwaveCredentials>('flutterwave')
)

export const getPayazaCredentials = cache(
  () => fetchCredential<PayazaCredentials>('payaza')
)

export const getBankTransferCredentials = cache(
  () => fetchCredential<BankTransferCredentials>('bankTransfer')
)

export const getBrevoCredentials = cache(
  () => fetchCredential<BrevoCredentials>('brevo')
)

export const getEbulkSMSCredentials = cache(
  () => fetchCredential<EbulkSMSCredentials>('ebulksms')
)

export const getPaymentSettings = cache(
  () => fetchCredential<PaymentSettings>('paymentSettings')
)
```

---

## TASK 5 — Credentials API Routes

Create `src/app/api/credentials/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encrypt, decrypt, maskSecret } from '@/lib/encryption'

export const runtime = 'nodejs'

// GET — return all credentials with masked values (never return decrypted)
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const records = await db.credential.findMany({
    orderBy: { service: 'asc' },
  })

  // Decrypt and re-mask each field before returning to client
  const masked = records.map((record) => {
    try {
      const data = JSON.parse(decrypt(record.data)) as Record<string, unknown>
      const maskedData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => {
          // Mask string values that look like secrets (not booleans, numbers, short strings)
          if (
            typeof v === 'string' &&
            v.length > 6 &&
            !['fromEmail', 'fromName', 'senderId', 'bankName',
              'accountName', 'contactEmail'].includes(k)
          ) {
            return [k, maskSecret(v)]
          }
          return [k, v]
        })
      )
      return { service: record.service, isActive: record.isActive, data: maskedData }
    } catch {
      return { service: record.service, isActive: record.isActive, data: {} }
    }
  })

  return NextResponse.json(masked)
}

// POST — upsert credentials for a service
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { service, data, isActive } = body as {
    service: string
    data: Record<string, unknown>
    isActive?: boolean
  }

  if (!service || !data) {
    return NextResponse.json({ error: 'service and data required' }, { status: 400 })
  }

  // If updating, merge with existing (so masked "••••w8A" values don't overwrite real ones)
  let mergedData = { ...data }
  const existing = await db.credential.findUnique({ where: { service } })
  if (existing) {
    try {
      const currentData = JSON.parse(decrypt(existing.data)) as Record<string, unknown>
      mergedData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => {
          // If the value looks like a masked string (contains •), keep the original
          if (typeof v === 'string' && v.includes('•')) {
            return [k, currentData[k] ?? v]
          }
          return [k, v]
        })
      )
    } catch { /* use submitted data if decrypt fails */ }
  }

  const encrypted = encrypt(JSON.stringify(mergedData))

  const record = await db.credential.upsert({
    where: { service },
    update: { data: encrypted, isActive: isActive ?? true },
    create: { service, data: encrypted, isActive: isActive ?? true },
  })

  return NextResponse.json({ service: record.service, isActive: record.isActive })
}
```

Create `src/app/api/credentials/[service]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

export const runtime = 'nodejs'

// PATCH — toggle isActive only
export async function PATCH(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { isActive } = await req.json()

  const record = await db.credential.update({
    where: { service: params.service },
    data: { isActive },
  })

  return NextResponse.json({ service: record.service, isActive: record.isActive })
}

// DELETE — wipe credentials for a service
export async function DELETE(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.credential.deleteMany({ where: { service: params.service } })
  return NextResponse.json({ success: true })
}
```

---

## TASK 6 — Update Payment Initiation to Use DB Credentials

Update `src/app/api/payments/initiate/route.ts` — replace all `process.env` references with DB credential fetches:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InitiatePaymentSchema } from '@/lib/validations/payment'
import { generateReference } from '@/lib/utils'
import {
  getPaystackCredentials,
  getFlutterwaveCredentials,
  getPayazaCredentials,
  getPaymentSettings,
} from '@/lib/credentials'
import { strictRatelimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`payment:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = InitiatePaymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { amount, currency, donorName, donorEmail, gateway, frequency } = parsed.data

  // Check minimum gift amount from DB settings
  const settings = await getPaymentSettings()
  const minimum = settings?.minimumGiftAmount ?? 100
  if (amount < minimum) {
    return NextResponse.json(
      { error: `Minimum gift amount is ₦${minimum.toLocaleString()}` },
      { status: 400 }
    )
  }

  const reference = generateReference(gateway.slice(0, 3))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const callbackUrl = `${appUrl}/partner/verify?gateway=${gateway}&ref=${reference}`

  await db.givingRecord.create({
    data: {
      donorName, donorEmail, amount, currency,
      gateway: gateway as 'PAYSTACK' | 'FLUTTERWAVE' | 'PAYAZA',
      reference, status: 'PENDING',
      meta: { frequency },
    },
  })

  try {
    if (gateway === 'PAYSTACK') {
      const creds = await getPaystackCredentials()
      if (!creds?.isActive) throw new Error('Paystack is currently unavailable')

      const planCode = frequency === 'MONTHLY'
        ? creds.monthlyPlanCode
        : frequency === 'ANNUAL'
        ? creds.annualPlanCode
        : undefined

      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: donorEmail,
          amount: amount * 100,
          reference,
          metadata: { donor_name: donorName, frequency },
          callback_url: callbackUrl,
          ...(planCode && { plan: planCode }),
        }),
      })
      const data = await res.json()
      if (!data.status) throw new Error(data.message ?? 'Paystack initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference })
    }

    if (gateway === 'FLUTTERWAVE') {
      const creds = await getFlutterwaveCredentials()
      if (!creds?.isActive) throw new Error('Flutterwave is currently unavailable')

      const planId = frequency === 'MONTHLY'
        ? creds.monthlyPlanId
        : frequency === 'ANNUAL'
        ? creds.annualPlanId
        : undefined

      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount, currency,
          redirect_url: callbackUrl,
          customer: { email: donorEmail, name: donorName },
          ...(planId && { payment_plan: planId }),
          meta: { frequency },
        }),
      })
      const data = await res.json()
      if (data.status !== 'success') throw new Error(data.message ?? 'Flutterwave initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.link, reference })
    }

    if (gateway === 'PAYAZA') {
      const creds = await getPayazaCredentials()
      if (!creds?.isActive) throw new Error('Payaza is currently unavailable')

      const res = await fetch('https://api.payaza.africa/merchant/api/v1/checkout/request', {
        method: 'POST',
        headers: {
          Authorization: `Payaza ${creds.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_transaction_reference: reference,
          payer: { email: donorEmail },
          transaction_amount: amount,
          currency,
          description: 'Room For You Partnership Gift',
          callback_url: callbackUrl,
          return_url: callbackUrl,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message ?? 'Payaza initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.checkout_url, reference })
    }

    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 })
  } catch (err: unknown) {
    await db.givingRecord.update({ where: { reference }, data: { status: 'FAILED' } })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment initialization failed' },
      { status: 500 }
    )
  }
}
```

---

## TASK 7 — Update Webhook Routes to Use DB Credentials

Update each webhook to fetch the secret from DB instead of env vars.

#### `src/app/api/webhooks/paystack/route.ts`
```typescript
import { getPaystackCredentials } from '@/lib/credentials'
import { createHmac } from 'crypto'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  const creds = await getPaystackCredentials()
  if (!creds) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const hash = createHmac('sha512', creds.webhookSecret)
    .update(rawBody)
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ... rest of webhook handler unchanged
}
```

#### `src/app/api/webhooks/flutterwave/route.ts`
```typescript
import { getFlutterwaveCredentials } from '@/lib/credentials'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('verif-hash') ?? ''
  const creds = await getFlutterwaveCredentials()
  if (!creds) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  if (signature !== creds.webhookSecret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  // ... rest unchanged
}
```

#### `src/app/api/webhooks/payaza/route.ts`
```typescript
import { getPayazaCredentials } from '@/lib/credentials'
import { createHmac } from 'crypto'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-payaza-signature') ?? ''
  const creds = await getPayazaCredentials()
  if (!creds) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const hash = createHmac('sha256', creds.secretKey)
    .update(rawBody)
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  // ... rest unchanged
}
```

---

## TASK 8 — Update Brevo to Use DB Credentials

Update `src/lib/brevo.ts`:

```typescript
import * as Brevo from '@getbrevo/brevo'
import { getBrevoCredentials } from '@/lib/credentials'

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}) {
  // Fetch credentials from DB
  const creds = await getBrevoCredentials()

  // Fallback to env vars during initial setup before DB is configured
  const apiKey = creds?.apiKey || process.env.BREVO_API_KEY
  const fromEmail = creds?.fromEmail || process.env.BREVO_FROM_EMAIL || 'noreply@rfyglobal.org'
  const fromName = creds?.fromName || process.env.BREVO_FROM_NAME || 'Room For You'

  if (!apiKey) {
    console.error('[Brevo] No API key configured')
    return
  }

  const apiInstance = new Brevo.TransactionalEmailsApi()
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)

  const recipients = Array.isArray(to)
    ? to.map((email) => ({ email }))
    : [{ email: to }]

  const sendSmtpEmail = new Brevo.SendSmtpEmail()
  sendSmtpEmail.sender = { email: fromEmail, name: fromName }
  sendSmtpEmail.to = recipients
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = html
  if (replyTo) sendSmtpEmail.replyTo = { email: replyTo }

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('[Brevo] Failed to send email:', error)
  }
}
```

---

## TASK 9 — EbulkSMS Helper

Create `src/lib/ebulksms.ts`:

```typescript
import { getEbulkSMSCredentials } from '@/lib/credentials'

const EBULKSMS_BASE = 'https://api.ebulksms.com'

export async function sendSMS({
  to,
  message,
}: {
  to: string | string[]   // Nigerian phone numbers e.g. "2348012345678"
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const creds = await getEbulkSMSCredentials()

  if (!creds?.isActive) {
    console.warn('[EbulkSMS] SMS is not configured or inactive')
    return { success: false, error: 'SMS not configured' }
  }

  const recipients = Array.isArray(to) ? to : [to]

  // Normalize phone numbers — ensure they start with country code
  const normalized = recipients.map((num) => {
    const clean = num.replace(/\D/g, '')
    if (clean.startsWith('0')) return `234${clean.slice(1)}`
    if (clean.startsWith('234')) return clean
    return `234${clean}`
  })

  try {
    const res = await fetch(`${EBULKSMS_BASE}/sendsms/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        SMS: {
          auth: {
            username: creds.username,
            apikey: creds.apiKey,
          },
          message: {
            sender: creds.senderId,
            messagetext: message,
            flash: '0',
          },
          recipients: {
            gsm: normalized.map((num) => ({ msidn: num })),
          },
        },
      }),
    })

    const data = await res.json()

    if (data.response?.status === 'SUCCESS') {
      return { success: true }
    }

    return {
      success: false,
      error: data.response?.statusdesc ?? 'SMS sending failed',
    }
  } catch (err: unknown) {
    console.error('[EbulkSMS] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'SMS sending failed',
    }
  }
}

// Send SMS to multiple community members in batches
export async function sendBulkSMS({
  recipients,
  message,
  batchSize = 100,
}: {
  recipients: string[]
  message: string
  batchSize?: number
}): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    const result = await sendSMS({ to: batch, message })
    if (result.success) sent += batch.length
    else failed += batch.length
  }

  return { sent, failed }
}
```

---

## TASK 10 — Admin Integrations Page

Add Integrations to admin sidebar. Open `src/components/admin/AdminSidebar.tsx`:
```typescript
{ label: 'Integrations', href: '/admin/integrations', icon: Plug },
```
Import `Plug` from `lucide-react`.

Create `src/app/admin/(dashboard)/integrations/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { decrypt, maskSecret } from '@/lib/encryption'
import { IntegrationsManager } from '@/components/admin/integrations/IntegrationsManager'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const records = await db.credential.findMany({ orderBy: { service: 'asc' } })

  // Decrypt and mask for initial render
  const initialData = Object.fromEntries(
    records.map((r) => {
      try {
        const data = JSON.parse(decrypt(r.data)) as Record<string, unknown>
        const masked = Object.fromEntries(
          Object.entries(data).map(([k, v]) => {
            if (
              typeof v === 'string' &&
              v.length > 6 &&
              !['fromEmail', 'fromName', 'senderId', 'bankName',
                'accountName', 'contactEmail'].includes(k)
            ) {
              return [k, maskSecret(v)]
            }
            return [k, v]
          })
        )
        return [r.service, { ...masked, isActive: r.isActive }]
      } catch {
        return [r.service, { isActive: r.isActive }]
      }
    })
  )

  return <IntegrationsManager initialData={initialData} />
}
```

---

## TASK 11 — IntegrationsManager Component

Create `src/components/admin/integrations/IntegrationsManager.tsx`:

This is the full integrations dashboard. It renders one section per service, each as a collapsible card with a form.

**Page layout:**
- Header: "Integrations" title + subtitle "Manage all third-party credentials securely"
- Warning banner: gold background, lock icon — "All credentials are encrypted with AES-256-GCM before being stored. Keys are never returned in plain text."
- One card per service, each showing:
  - Service logo/icon + name
  - Active/Inactive toggle (saves immediately on change)
  - Expand button → reveals the credential form
  - Save button per section

**Services and their fields:**

```typescript
'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Shield, ToggleLeft,
  ToggleRight, Save, Plug
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ServiceConfig {
  id: string
  name: string
  description: string
  color: string
  fields: {
    key: string
    label: string
    type: 'text' | 'password'
    placeholder?: string
    hint?: string
  }[]
}

const SERVICES: ServiceConfig[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Nigerian payment gateway — cards, bank transfer, USSD',
    color: '#00C3F7',
    fields: [
      { key: 'publicKey', label: 'Public Key', type: 'text', placeholder: 'pk_live_...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', hint: 'Found in Paystack dashboard → Settings → Webhooks' },
      { key: 'monthlyPlanCode', label: 'Monthly Plan Code', type: 'text', placeholder: 'PLN_...', hint: 'Create in Paystack → Products → Plans' },
      { key: 'annualPlanCode', label: 'Annual Plan Code', type: 'text', placeholder: 'PLN_...' },
    ],
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Pan-African payment gateway — cards, mobile money, bank',
    color: '#F5A623',
    fields: [
      { key: 'publicKey', label: 'Public Key', type: 'text', placeholder: 'FLWPUBK_TEST-...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'FLWSECK_TEST-...' },
      { key: 'webhookSecret', label: 'Webhook Secret Hash', type: 'password', hint: 'The secret hash you set in Flutterwave → Settings → Webhooks' },
      { key: 'monthlyPlanId', label: 'Monthly Plan ID', type: 'text', hint: 'Create in Flutterwave → Payment Plans' },
      { key: 'annualPlanId', label: 'Annual Plan ID', type: 'text' },
    ],
  },
  {
    id: 'payaza',
    name: 'Payaza',
    description: 'One-time payments (no recurring)',
    color: '#6C63FF',
    fields: [
      { key: 'publicKey', label: 'Public Key', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
    ],
  },
  {
    id: 'bankTransfer',
    name: 'Bank Transfer',
    description: 'Display bank account details for manual transfers',
    color: '#C9A84C',
    fields: [
      { key: 'bankName', label: 'Bank Name', type: 'text', placeholder: 'e.g. Access Bank' },
      { key: 'accountName', label: 'Account Name', type: 'text', placeholder: 'Room For You' },
      { key: 'accountNumber', label: 'Account Number', type: 'text', placeholder: '0123456789' },
      { key: 'contactEmail', label: 'Contact Email', type: 'text', placeholder: 'partner@rfyglobal.org', hint: 'Donors are asked to send confirmation to this email' },
    ],
  },
  {
    id: 'brevo',
    name: 'Brevo',
    description: 'Transactional email — form notifications, confirmations',
    color: '#0B996E',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', hint: 'Brevo dashboard → SMTP & API → API Keys' },
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'noreply@rfyglobal.org' },
      { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Room For You' },
    ],
  },
  {
    id: 'ebulksms',
    name: 'EbulkSMS',
    description: 'SMS notifications to community members',
    color: '#E53E3E',
    fields: [
      { key: 'username', label: 'Username', type: 'text', hint: 'Your EbulkSMS account username' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'senderId', label: 'Sender ID', type: 'text', placeholder: 'RoomForYou', hint: 'Max 11 characters, no spaces' },
    ],
  },
  {
    id: 'paymentSettings',
    name: 'Payment Settings',
    description: 'Global settings for the partnership giving page',
    color: '#C9A84C',
    fields: [
      { key: 'minimumGiftAmount', label: 'Minimum Gift Amount (₦)', type: 'text', placeholder: '100', hint: 'Minimum amount a donor can give in Naira' },
    ],
  },
]

interface IntegrationsManagerProps {
  initialData: Record<string, Record<string, unknown>>
}

export function IntegrationsManager({ initialData }: IntegrationsManagerProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, Record<string, string>>>(
    Object.fromEntries(
      SERVICES.map((s) => [
        s.id,
        Object.fromEntries(
          s.fields.map((f) => [f.key, String(initialData[s.id]?.[f.key] ?? '')])
        ),
      ])
    )
  )
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(
    Object.fromEntries(
      SERVICES.map((s) => [s.id, Boolean(initialData[s.id]?.isActive ?? true)])
    )
  )
  const [saving, setSaving] = useState<string | null>(null)

  const updateValue = (serviceId: string, key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], [key]: value },
    }))
  }

  const toggleActive = async (serviceId: string) => {
    const newState = !activeStates[serviceId]
    setActiveStates((prev) => ({ ...prev, [serviceId]: newState }))

    const res = await fetch(`/api/credentials/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newState }),
    })

    if (res.ok) {
      toast.success(newState ? `${serviceId} enabled` : `${serviceId} disabled`)
    } else {
      // Revert on failure
      setActiveStates((prev) => ({ ...prev, [serviceId]: !newState }))
      toast.error('Failed to update')
    }
  }

  const saveService = async (serviceId: string) => {
    setSaving(serviceId)
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceId,
          data: values[serviceId],
          isActive: activeStates[serviceId],
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      toast.success('Credentials saved')
      setExpanded(null)
    } catch {
      toast.error('Failed to save credentials')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-2xl text-white">Integrations</h2>
        <p className="text-white/40 text-sm font-body mt-1">
          Manage all third-party credentials securely
        </p>
      </div>

      {/* Security banner */}
      <div className="flex items-start gap-3 p-4 border border-gold/30 bg-gold/5 mb-8">
        <Shield size={18} className="text-gold shrink-0 mt-0.5" />
        <p className="text-gold/80 text-sm font-body leading-relaxed">
          All credentials are encrypted with AES-256-GCM before being stored.
          Keys are masked in this interface and never returned in plain text.
        </p>
      </div>

      {/* Service cards */}
      <div className="space-y-3">
        {SERVICES.map((service) => {
          const isExpanded = expanded === service.id
          const isActive = activeStates[service.id]
          const isSaving = saving === service.id

          return (
            <div key={service.id}
              className={cn(
                'border transition-all duration-200',
                isActive ? 'border-white/15' : 'border-white/8 opacity-70'
              )}>
              {/* Card header */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  {/* Color dot */}
                  <div className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: service.color }} />
                  <div>
                    <h3 className="font-display text-base text-white">{service.name}</h3>
                    <p className="text-white/40 text-xs font-body mt-0.5">{service.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(service.id)}
                    className="text-white/40 hover:text-gold transition-colors"
                    title={isActive ? 'Disable' : 'Enable'}
                  >
                    {isActive
                      ? <ToggleRight size={22} className="text-gold" />
                      : <ToggleLeft size={22} />}
                  </button>

                  {/* Expand */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : service.id)}
                    className="p-2 border border-white/10 text-white/40 hover:border-gold/40 hover:text-gold transition-all"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expandable form */}
              {isExpanded && (
                <div className="border-t px-5 pb-5 pt-4 space-y-4"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {service.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type === 'password' ? 'text' : 'text'}
                        value={values[service.id]?.[field.key] ?? ''}
                        onChange={(e) => updateValue(service.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-mono text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/15"
                      />
                      {field.hint && (
                        <p className="text-white/25 text-xs font-body mt-1">{field.hint}</p>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-white/20 text-xs font-body">
                      Values shown masked — type to update
                    </p>
                    <button
                      onClick={() => saveService(service.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors disabled:opacity-40"
                    >
                      <Save size={14} />
                      {isSaving ? 'Saving…' : 'Save Credentials'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## TASK 12 — Update Partnership Page to Use DB Credentials

Update `src/components/partnership/PartnershipClientPage.tsx` (or its server wrapper) to fetch bank transfer details and active gateways from DB credentials instead of CMS:

Create a server wrapper `src/app/(public)/partner/page.tsx` that fetches gateway states:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PartnershipClientPage } from '@/components/partnership/PartnershipClientPage'
import {
  getPaystackCredentials,
  getFlutterwaveCredentials,
  getPayazaCredentials,
  getBankTransferCredentials,
  getPaymentSettings,
} from '@/lib/credentials'

export default async function PartnerPage() {
  const [paystack, flutterwave, payaza, bank, settings] = await Promise.all([
    getPaystackCredentials(),
    getFlutterwaveCredentials(),
    getPayazaCredentials(),
    getBankTransferCredentials(),
    getPaymentSettings(),
  ])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <PartnershipClientPage
          gateways={{
            paystack: paystack?.isActive ?? false,
            flutterwave: flutterwave?.isActive ?? false,
            payaza: payaza?.isActive ?? false,
          }}
          bankDetails={bank ?? null}
          minimumAmount={settings?.minimumGiftAmount ?? 100}
        />
      </main>
      <Footer />
    </>
  )
}
```

Update `PartnershipClientPage` props to accept `gateways`, `bankDetails`, and `minimumAmount` — replacing hardcoded values with these props. The gateway selector should only show gateways where `gateways[id] === true`. The bank transfer section should show `bankDetails` values.

---

## TASK 13 — Remove Credential Env Vars from .env

Now that credentials live in the DB, remove these from `.env.local` (keep only `CREDENTIALS_ENCRYPTION_KEY`):

**Remove from `.env.local`:**
```
PAYSTACK_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET
PAYSTACK_MONTHLY_PLAN_CODE
PAYSTACK_ANNUAL_PLAN_CODE
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_WEBHOOK_SECRET
FLUTTERWAVE_MONTHLY_PLAN_ID
FLUTTERWAVE_ANNUAL_PLAN_ID
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
PAYAZA_SECRET_KEY
NEXT_PUBLIC_PAYAZA_PUBLIC_KEY
BREVO_API_KEY
BREVO_FROM_EMAIL
BREVO_FROM_NAME
```

**Keep in `.env.local` and Vercel:**
```
CREDENTIALS_ENCRYPTION_KEY   ← must stay in env, never in DB
DATABASE_URL
DIRECT_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_APP_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
SKIP_ENV_VALIDATION
```

---

## PHASE 8 COMPLETION CHECKLIST

- [ ] `CREDENTIALS_ENCRYPTION_KEY` generated and set in `.env.local` and Vercel
- [ ] `Credential` model added to Prisma schema and pushed to DB
- [ ] `src/lib/encryption.ts` — encrypt/decrypt/maskSecret working
- [ ] `src/lib/credentials.ts` — all typed fetchers working
- [ ] `/api/credentials` — GET (masked), POST (upsert with merge), PATCH (toggle), DELETE
- [ ] Payment initiation reads credentials from DB
- [ ] Webhook routes verify signatures from DB credentials
- [ ] Brevo reads API key from DB with env var fallback
- [ ] EbulkSMS helper created and tested
- [ ] `/admin/integrations` renders all 7 service cards
- [ ] Expanding a card shows the credential form
- [ ] Saving a service encrypts and stores in DB
- [ ] Active toggle works and saves immediately
- [ ] Masked display shows `••••••xxxx` format
- [ ] Partnership page shows only active gateways
- [ ] Bank transfer details pulled from DB credentials
- [ ] Old credential env vars removed from `.env.local`
- [ ] `npm run build` completes without errors

---

## NOTES FOR CURSOR

- The `CREDENTIALS_ENCRYPTION_KEY` **must be 64 hex characters** (32 bytes). Generate with `openssl rand -hex 32`. If it's the wrong length the encrypt/decrypt functions will throw — this is intentional.
- The merge logic in the POST `/api/credentials` route is critical — when a masked value like `••••sk_live` is submitted, it should NOT overwrite the real stored value. The merge detects `•` characters and keeps the original. This prevents admins from accidentally wiping keys when editing other fields.
- Brevo keeps an env var fallback (`process.env.BREVO_API_KEY`) so emails still work during the transition period before credentials are configured in the DB. Once credentials are set in the dashboard, the DB value takes priority.
- The `react` `cache()` function in `src/lib/credentials.ts` deduplicates DB calls within a single request — if `getPaystackCredentials()` is called 3 times in one request, it only hits the DB once.
- EbulkSMS phone numbers must be in international format without `+` — `2348012345678` not `+2348012345678`. The `normalized` function in `sendSMS` handles this automatically.
- The `PartnershipClientPage` must be updated to accept the new props — it currently reads from hardcoded values. All gateway visibility and bank details must come from the props passed by the server component.
- After deploying Phase 8, the very first thing to do in the admin dashboard is go to `/admin/integrations` and save all credentials. Until then, payments will fail because the DB has no credentials yet.
