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

  let event: {
    event_type?: string
    transaction_data?: {
      merchant_transaction_reference?: string
      transaction_amount?: number
      currency?: string
      payer?: { email?: string }
    }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

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
          meta: event as object,
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}
