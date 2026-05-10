import { db } from '@/lib/db'
import { decrypt, encrypt } from '@/lib/encryption'

/** Same Credential row as minimum gift amount (`service: paymentSettings`). */
const PAYMENT_SETTINGS_SERVICE = 'paymentSettings'

export interface GlobalPaymentSettings {
  usdEnabled: boolean
}

const DEFAULT_GLOBAL: GlobalPaymentSettings = {
  usdEnabled: false,
}

export async function getPaymentSettings(): Promise<GlobalPaymentSettings> {
  try {
    const record = await db.credential.findUnique({
      where: { service: PAYMENT_SETTINGS_SERVICE },
    })
    if (!record) return DEFAULT_GLOBAL

    const data = JSON.parse(decrypt(record.data)) as Record<string, unknown>
    const u = data.usdEnabled
    return {
      usdEnabled: u === true || u === 'true',
    }
  } catch {
    return DEFAULT_GLOBAL
  }
}

/** Merges into encrypted `paymentSettings` blob (preserves minimumGiftAmount and other keys). */
export async function savePaymentSettings(partial: Partial<GlobalPaymentSettings>): Promise<void> {
  const existing = await db.credential.findUnique({
    where: { service: PAYMENT_SETTINGS_SERVICE },
  })

  let merged: Record<string, unknown> = { minimumGiftAmount: '100' }
  if (existing) {
    try {
      merged = { ...merged, ...(JSON.parse(decrypt(existing.data)) as Record<string, unknown>) }
    } catch {
      /* keep defaults */
    }
  }

  if (partial.usdEnabled !== undefined) {
    merged.usdEnabled = partial.usdEnabled
  }

  const encrypted = encrypt(JSON.stringify(merged))

  await db.credential.upsert({
    where: { service: PAYMENT_SETTINGS_SERVICE },
    create: {
      service: PAYMENT_SETTINGS_SERVICE,
      data: encrypted,
      isActive: true,
    },
    update: { data: encrypted },
  })
}
