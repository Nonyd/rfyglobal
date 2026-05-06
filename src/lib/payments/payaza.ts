import { createHmac } from 'node:crypto'

export const PAYAZA_BASE = 'https://api.payaza.africa'

const headers = () => ({
  Authorization: `Payaza ${process.env.PAYAZA_SECRET_KEY}`,
  'Content-Type': 'application/json',
})

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

export function verifyPayazaWebhook(signature: string, body: string): boolean {
  const secret =
    process.env.PAYAZA_WEBHOOK_SECRET ?? process.env.PAYAZA_SECRET_KEY ?? ''
  if (!secret) return false
  const hash = createHmac('sha256', secret).update(body).digest('hex')
  return hash === signature
}
