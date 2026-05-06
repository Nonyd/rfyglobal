export const FLW_BASE = 'https://api.flutterwave.com/v3'

const headers = () => ({
  Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
  'Content-Type': 'application/json',
})

export async function flutterwaveInitialize(params: {
  tx_ref: string
  amount: number
  currency: string
  redirect_url: string
  customer: { email: string; name: string }
  payment_plan?: number | string
  meta?: Record<string, unknown>
}) {
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return res.json()
}

export async function flutterwaveVerify(transactionId: string) {
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: headers(),
  })
  return res.json()
}

export function verifyFlutterwaveWebhook(signature: string): boolean {
  return signature === process.env.FLUTTERWAVE_WEBHOOK_SECRET
}
