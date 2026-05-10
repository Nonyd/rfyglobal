import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getFlutterwaveCredentials } from '@/lib/credentials'
import { notifyPartnerGivingConfirmationIfNeeded } from '@/lib/emails/partner-confirmation'
import { notifyPartnerGiftOnce } from '@/lib/notify'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('verif-hash') ?? ''
  const creds = await getFlutterwaveCredentials()
  if (!creds) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  if (signature !== creds.webhookSecret) {
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
    await notifyPartnerGivingConfirmationIfNeeded(tx_ref)
    const gift = await db.givingRecord.findUnique({ where: { reference: tx_ref } })
    if (gift?.status === 'SUCCESS') {
      const donor = gift.donorName?.trim() || gift.donorEmail?.trim() || 'Anonymous'
      await notifyPartnerGiftOnce(tx_ref, gift.amount, donor)
    }
  }

  return NextResponse.json({ received: true })
}
