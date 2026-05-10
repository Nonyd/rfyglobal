# ROOM FOR YOU — Phase 35b Cursor Prompt
## USD Payments Admin Toggle

---

## CONTEXT

Paystack USD payments are not yet enabled on the account — pending Paystack approval. Add an admin toggle in the Paystack integrations card to enable/disable USD ($) payments. When off, only NGN (₦) shows on the partner page. When on, both NGN and USD show.

**Default state: USD OFF**

---

## TASK 1 — Public Settings API

Create `src/app/api/payments/settings/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getPaystackCredentials } from '@/lib/paystack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const creds = await getPaystackCredentials()
    return NextResponse.json({
      usdEnabled: creds?.usdEnabled === true || creds?.usdEnabled === 'true',
    })
  } catch {
    return NextResponse.json({ usdEnabled: false })
  }
}
```

This endpoint is public (no auth required) — the partner page fetches it to know whether to show the USD tab.

---

## TASK 2 — Update getPaystackCredentials

Open `src/lib/paystack.ts`.

Update the return type and value of `getPaystackCredentials` to include `usdEnabled`:

```typescript
interface PaystackCredentials {
  secretKey: string
  publicKey: string
  webhookSecret?: string
  usdEnabled: boolean
}

export async function getPaystackCredentials(): Promise<PaystackCredentials | null> {
  try {
    // ... existing credential fetch and decrypt logic ...

    return {
      secretKey: decrypted.secretKey ?? decrypted.secret_key ?? '',
      publicKey: decrypted.publicKey ?? decrypted.public_key ?? '',
      webhookSecret: decrypted.webhookSecret ?? decrypted.webhook_secret ?? '',
      usdEnabled: decrypted.usdEnabled === true || decrypted.usdEnabled === 'true',
    }
  } catch (error) {
    console.error('[paystack] Failed to get credentials:', error)
    return null
  }
}
```

---

## TASK 3 — Add USD Toggle to Paystack Integration Card

Open the Paystack integration card component — this is in `src/app/admin/(dashboard)/integrations/page.tsx` or a sub-component like `src/components/admin/integrations/PaystackIntegrationCard.tsx`.

Add a **USD Payments** toggle field to the Paystack credentials form. It should appear below the existing secret/public key fields:

```typescript
// In the Paystack fields array or form JSX, add:
{
  key: 'usdEnabled',
  label: 'USD Payments',
  type: 'toggle',
  description: 'Enable Dollar ($) payments on the partner page. Only activate after Paystack has approved USD on your account.',
  defaultValue: false,
}
```

If the integrations use a generic credential form renderer, ensure it supports a `toggle` type that saves `true`/`false` as a string or boolean in the encrypted credentials object.

If the form is manually coded (not a generic renderer), add the toggle manually:

```typescript
// State:
const [usdEnabled, setUsdEnabled] = useState<boolean>(
  savedCredentials?.usdEnabled === true || savedCredentials?.usdEnabled === 'true'
)

// In the form JSX, below the webhook secret field:
<div className="flex items-center justify-between py-3 border-t"
  style={{ borderColor: 'var(--a-border)' }}>
  <div>
    <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
      USD Payments
    </p>
    <p className="font-body text-xs mt-0.5" style={{ color: 'var(--a-text-muted)' }}>
      Enable Dollar ($) payments. Only turn on after Paystack activates USD on your account.
    </p>
  </div>
  <button
    type="button"
    onClick={() => setUsdEnabled(prev => !prev)}
    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
    style={{
      background: usdEnabled ? '#C9A84C' : 'var(--a-border)',
      flexShrink: 0,
    }}
    role="switch"
    aria-checked={usdEnabled}
  >
    <span
      className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
      style={{
        transform: usdEnabled ? 'translateX(24px)' : 'translateX(4px)',
      }}
    />
  </button>
</div>

// Include usdEnabled in the credentials object when saving:
const credentialsToSave = {
  secretKey,
  publicKey,
  webhookSecret,
  usdEnabled,
  // ... other fields ...
}
```

---

## TASK 4 — Hide USD Tab on Partner Page When Disabled

Open `src/components/(public)/partner/PartnershipClientPage.tsx` or wherever the currency toggle (NGN/USD) is rendered.

Fetch the settings on mount and conditionally show the USD tab:

```typescript
const [usdEnabled, setUsdEnabled] = useState(false)
const [settingsLoaded, setSettingsLoaded] = useState(false)

useEffect(() => {
  fetch('/api/payments/settings')
    .then(r => r.json())
    .then(data => {
      setUsdEnabled(data.usdEnabled ?? false)
      setSettingsLoaded(true)
    })
    .catch(() => setSettingsLoaded(true))
}, [])

// If USD gets disabled while NGN is selected, reset to NGN:
useEffect(() => {
  if (!usdEnabled && currency === 'USD') {
    setCurrency('NGN')
  }
}, [usdEnabled, currency])
```

Update the currency toggle to only show USD when enabled:

```typescript
{/* Currency toggle — only show USD tab if enabled */}
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setCurrency('NGN')}
    className="flex-1 py-2.5 font-body text-sm font-semibold transition-all"
    style={{
      background: currency === 'NGN' ? '#C9A84C' : 'transparent',
      color: currency === 'NGN' ? '#0F0F0F' : 'var(--color-text-secondary)',
      border: `1px solid ${currency === 'NGN' ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
    }}
  >
    ₦ Naira
  </button>

  {usdEnabled && (
    <button
      onClick={() => setCurrency('USD')}
      className="flex-1 py-2.5 font-body text-sm font-semibold transition-all"
      style={{
        background: currency === 'USD' ? '#C9A84C' : 'transparent',
        color: currency === 'USD' ? '#0F0F0F' : 'var(--color-text-secondary)',
        border: `1px solid ${currency === 'USD' ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      $ Dollar
    </button>
  )}
</div>
```

If `settingsLoaded` is false, show only the NGN button (safe default) until the fetch resolves.

---

## TASK 5 — Also Apply to Event Registration

If the event registration modal also has a currency selector, apply the same logic — only show USD if `usdEnabled` is true.

Fetch `/api/payments/settings` in the event registration component and conditionally show the USD option.

---

## COMPLETION CHECKLIST

- [ ] `GET /api/payments/settings` returns `{ usdEnabled: boolean }`
- [ ] `getPaystackCredentials` returns `usdEnabled` field
- [ ] Admin Paystack integration card has a USD Payments toggle
- [ ] Toggle defaults to OFF
- [ ] Saving credentials with toggle ON persists `usdEnabled: true`
- [ ] Partner page fetches `/api/payments/settings` on mount
- [ ] USD tab hidden when `usdEnabled` is false
- [ ] USD tab appears when `usdEnabled` is true
- [ ] Selecting USD and then admin turns off USD → currency resets to NGN
- [ ] Event registration also respects `usdEnabled`
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `/api/payments/settings` endpoint is intentionally public (no auth) — it only exposes a boolean flag, no sensitive data.
- The `usdEnabled` value is stored as part of the encrypted Paystack credentials object in the DB. When the admin saves the Paystack integration, `usdEnabled` is included in the credentials JSON that gets encrypted and stored.
- Default to `false` everywhere — if the fetch fails or the key doesn't exist, USD is hidden. This is the safe default.
- The partner page should not show a loading spinner just for the currency toggle — render NGN only initially, then add the USD tab when the fetch resolves. This prevents layout shift.
- When Paystack eventually enables USD on the account, the admin simply goes to `/admin/integrations` → Paystack → turns on the toggle → saves. The USD tab immediately appears on the partner page for all visitors.
