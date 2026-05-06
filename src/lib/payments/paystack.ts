import { createHmac } from 'node:crypto'

export const PAYSTACK_BASE = 'https://api.paystack.co'

const headers = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
})

export async function paystackInitialize(params: {
  email: string
  amount: number
  reference: string
  metadata?: Record<string, unknown>
  callback_url: string
  plan?: string
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return res.json()
}

export async function paystackCreateSubscription(params: {
  customer: string
  plan: string
  start_date?: string
}) {
  const res = await fetch(`${PAYSTACK_BASE}/subscription`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return res.json()
}

export async function paystackVerify(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: headers(),
  })
  return res.json()
}

export function verifyPaystackWebhook(body: string, signature: string): boolean {
  const secret =
    process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY ?? ''
  if (!secret) return false
  const hash = createHmac('sha512', secret).update(body).digest('hex')
  return hash === signature
}
