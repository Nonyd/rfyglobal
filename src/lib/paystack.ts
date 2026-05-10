import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export interface PaystackSecretCredentials {
  secretKey: string
  publicKey: string
}

/**
 * Resolve Paystack API credentials from encrypted DB row (admin → Integrations).
 * Prefer {@link getPaystackCredentials} from `@/lib/credentials` when you need plan codes, mode, etc.
 */
export async function getPaystackSecretCredentials(): Promise<PaystackSecretCredentials | null> {
  try {
    const cred = await db.credential.findUnique({ where: { service: 'paystack' } })
    if (!cred || !cred.isActive) return null

    const decrypted = decrypt(cred.data)
    const parsed = JSON.parse(decrypted) as Record<string, unknown>

    const secretKey = String(parsed.secretKey ?? parsed.secret_key ?? '')
    const publicKey = String(parsed.publicKey ?? parsed.public_key ?? '')

    if (!secretKey) return null
    return { secretKey, publicKey }
  } catch (error) {
    console.error('[paystack] Failed to get credentials:', error)
    return null
  }
}

export type PaystackEnvelope<T = Record<string, unknown>> = {
  status: boolean
  message?: string
  data: T
}

export async function paystackRequest<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<PaystackEnvelope<T>> {
  const creds = await getPaystackSecretCredentials()
  if (!creds?.secretKey) {
    throw new Error('Paystack not configured. Add credentials in admin/integrations.')
  }

  const res = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${creds.secretKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = (await res.json()) as PaystackEnvelope<T> & { message?: string }
  if (!res.ok || data.status === false) {
    throw new Error(data.message ?? `Paystack API error: ${res.status}`)
  }
  return data
}
