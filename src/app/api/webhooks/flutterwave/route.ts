import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyFlutterwaveWebhook } from '@/lib/payments/flutterwave'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('verif-hash') ?? ''

  if (!verifyFlutterwaveWebhook(signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = (await req.json()) as {
    event?: string
    data?: {
      status?: string
      tx_ref?: string
      amount?: number
      currency?: string
      customer?: { email?: string; name?: string }
    }
  }

  if (event.event === 'charge.completed' && event.data?.status === 'successful') {
    const { tx_ref, amount, currency, customer } = event.data
    if (!tx_ref || amount == null) {
      return NextResponse.json({ received: true })
    }
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
        meta: event.data as object,
      },
    })
  }

  return NextResponse.json({ received: true })
}
