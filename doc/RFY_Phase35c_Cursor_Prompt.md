# ROOM FOR YOU — Phase 35c Cursor Prompt
## Global USD Payment Toggle in Payment Settings

---

## CONTEXT

Replace the per-gateway `usdEnabled` toggles with a single global **"USD Payments"** switch in a **Payment Settings** section in admin integrations.

When the global toggle is ON → USD ($) tab shows on the partner page and event registration for ALL active gateways.
When OFF → only ₦ Naira shows everywhere.

---

## TASK 1 — Remove Per-Gateway usdEnabled Toggles

Open `src/app/admin/(dashboard)/integrations/page.tsx` or `IntegrationsManager.tsx`.

Remove the `usdEnabled` toggle field from the Paystack, Flutterwave, and Payaza credential forms. These no longer control USD — the global toggle does.

---

## TASK 2 — Add Payment Settings Section

In `IntegrationsManager.tsx`, add a new **Payment Settings** card at the TOP of the integrations list (before Paystack, Flutterwave, Payaza):

```typescript
// Payment Settings card — shown above all gateway cards
<div
  className="border p-5"
  style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
>
  {/* Header */}
  <div className="flex items-center gap-3 mb-4">
    <div
      className="w-9 h-9 flex items-center justify-center"
      style={{ background: 'var(--a-bg)' }}
    >
      <Settings size={16} style={{ color: 'var(--a-gold)' }} />
    </div>
    <div>
      <p className="font-body text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
        Payment Settings
      </p>
      <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
        Global settings applied across all payment gateways
      </p>
    </div>
  </div>

  {/* USD toggle */}
  <div
    className="flex items-start justify-between gap-4 py-4 border-t"
    style={{ borderColor: 'var(--a-border)' }}
  >
    <div className="flex-1">
      <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
        USD Payments ($)
      </p>
      <p
        className="font-body text-xs mt-1 leading-relaxed"
        style={{ color: 'var(--a-text-muted)' }}
      >
        Show Dollar ($) payment option to visitors on the partnership and events pages.
        Only activate after confirming USD is enabled on your payment gateway accounts.
      </p>
    </div>
    <AdminToggle
      checked={paymentSettings.usdEnabled ?? false}
      onChange={val => savePaymentSetting('usdEnabled', val)}
    />
  </div>
</div>
```

---

## TASK 3 — Payment Settings Storage

Store global payment settings in the `Credential` table using `service: 'payment_settings'`:

Create or update `src/lib/payment-settings.ts`:

```typescript
import { db } from './db'

interface PaymentSettings {
  usdEnabled: boolean
}

const DEFAULT_SETTINGS: PaymentSettings = {
  usdEnabled: false,
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const record = await db.credential.findFirst({
      where: { service: 'payment_settings' },
    })

    if (!record) return DEFAULT_SETTINGS

    const { decryptCredentials } = await import('./credentials')
    const data = await decryptCredentials(record.encryptedData)

    return {
      usdEnabled: data.usdEnabled === true || data.usdEnabled === 'true',
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function savePaymentSettings(settings: Partial<PaymentSettings>): Promise<void> {
  const { encryptCredentials } = await import('./credentials')
  const encrypted = await encryptCredentials(settings)

  await db.credential.upsert({
    where: { service: 'payment_settings' },
    create: {
      service: 'payment_settings',
      encryptedData: encrypted,
    },
    update: {
      encryptedData: encrypted,
    },
  })
}
```

---

## TASK 4 — Payment Settings API

Create `src/app/api/admin/payment-settings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPaymentSettings, savePaymentSettings } from '@/lib/payment-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await getPaymentSettings()
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ usdEnabled: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    await savePaymentSettings(body)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## TASK 5 — Update Public Settings API

Update `src/app/api/payments/settings/route.ts` to read from the global payment settings instead of per-gateway credentials:

```typescript
import { NextResponse } from 'next/server'
import { getPaymentSettings } from '@/lib/payment-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await getPaymentSettings()
    return NextResponse.json({
      usdEnabled: settings.usdEnabled,
    })
  } catch {
    return NextResponse.json({ usdEnabled: false })
  }
}
```

---

## TASK 6 — Wire Save in IntegrationsManager

In `IntegrationsManager.tsx`, add state and save logic for payment settings:

```typescript
const [paymentSettings, setPaymentSettings] = useState({ usdEnabled: false })
const [savingSettings, setSavingSettings] = useState(false)

// Load on mount
useEffect(() => {
  fetch('/api/admin/payment-settings')
    .then(r => r.ok ? r.json() : { usdEnabled: false })
    .then(data => setPaymentSettings(data))
    .catch(() => {})
}, [])

// Save individual setting immediately on toggle
const savePaymentSetting = async (key: string, value: boolean) => {
  setSavingSettings(true)
  try {
    setPaymentSettings(prev => ({ ...prev, [key]: value }))
    await fetch('/api/admin/payment-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...paymentSettings, [key]: value }),
    })
    toast.success('Payment settings saved')
  } catch {
    toast.error('Failed to save settings')
    // Revert on failure
    setPaymentSettings(prev => ({ ...prev, [key]: !value }))
  } finally {
    setSavingSettings(false)
  }
}
```

---

## TASK 7 — Update Credential Model (if needed)

Check `prisma/schema.prisma`. The `Credential` model needs a unique constraint on `service` for the `upsert` to work:

```prisma
model Credential {
  id            String   @id @default(cuid())
  service       String   @unique  // ← must be unique
  encryptedData String   @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

If `service` is not already unique, add `@unique` and run `npx prisma db push`.

---

## TASK 8 — Remove usdEnabled from Paystack Credentials Helper

Open `src/lib/paystack.ts` and `src/lib/credentials.ts`.

Remove `usdEnabled` from the `PaystackCredentials` interface and `getPaystackCredentials` return value — it's no longer a per-gateway setting:

```typescript
interface PaystackCredentials {
  secretKey: string
  publicKey: string
  webhookSecret?: string
  // usdEnabled removed — now global in payment_settings
}
```

Also remove `usdEnabled` from the Paystack `decryptCredentials` mapping.

---

## COMPLETION CHECKLIST

**Admin**
- [ ] "Payment Settings" card appears at top of integrations page
- [ ] USD Payments toggle in Payment Settings card
- [ ] Toggle saves immediately on change (no separate Save button needed)
- [ ] Toast confirms save
- [ ] Per-gateway `usdEnabled` toggles removed from Paystack, Flutterwave, Payaza cards

**API**
- [ ] `GET /api/admin/payment-settings` returns `{ usdEnabled: boolean }` (auth required)
- [ ] `POST /api/admin/payment-settings` saves settings (auth required)
- [ ] `GET /api/payments/settings` returns `{ usdEnabled: boolean }` (public, no auth)

**Public pages**
- [ ] Partner page reads from `/api/payments/settings`
- [ ] USD tab hidden when `usdEnabled` is false
- [ ] USD tab shows when `usdEnabled` is true
- [ ] Event registration modal reads same setting
- [ ] `src/lib/payment-settings.ts` reads/writes from `Credential` table with `service: 'payment_settings'`

**Database**
- [ ] `Credential.service` is unique (for upsert to work)
- [ ] `npx prisma db push` if schema changed

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `savePaymentSetting` function saves immediately on toggle change — no separate Save button. This gives instant feedback like a settings toggle should.
- `service: 'payment_settings'` in the `Credential` table is a new record separate from `service: 'paystack'`, `service: 'flutterwave'` etc. It stores global settings as an encrypted JSON blob.
- The `Credential` model's `service` field must be `@unique` for `db.credential.upsert({ where: { service: ... } })` to work. If it's not already unique, check existing data before adding the constraint.
- The public `/api/payments/settings` endpoint has no auth — it only returns a boolean. This is intentional so the partner page can check it without requiring the visitor to be logged in.
- After implementation, the admin flow is: `/admin/integrations` → scroll to top → "Payment Settings" → toggle "USD Payments" on → auto-saves → visitors immediately see $ tab.
