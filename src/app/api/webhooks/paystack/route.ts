import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { getPaystackCredentials } from '@/lib/credentials'
import { notifyPartnerGivingConfirmationIfNeeded } from '@/lib/emails/partner-confirmation'
import { notifyPartnerGiftOnce } from '@/lib/notify'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const creds = await getPaystackCredentials()
  if (!creds) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const hash = createHmac('sha512', creds.webhookSecret).update(rawBody).digest('hex')
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody) as { event: string; data: Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event === 'charge.success') {
    const data = event.data as {
      reference?: string
      amount?: number
      currency?: string
      customer?: { email?: string; metadata?: { donor_name?: string } }
    }
    const { reference, amount, customer } = data
    if (!reference || amount == null) {
      return NextResponse.json({ received: true })
    }
    const existing = await db.givingRecord.findUnique({ where: { reference } })
    const previousStatus = existing?.status
    await db.givingRecord.upsert({
      where: { reference },
      update: { status: 'SUCCESS' },
      create: {
        reference,
        amount: amount / 100,
        currency: data.currency ?? 'NGN',
        gateway: 'PAYSTACK',
        status: 'SUCCESS',
        donorEmail: customer?.email ?? null,
        donorName: customer?.metadata?.donor_name ?? null,
        meta: event.data as object,
      },
    })
    await notifyPartnerGivingConfirmationIfNeeded(reference)
    await notifyPartnerGiftOnce(reference, previousStatus)
  }

  if (event.event === 'subscription.create') {
    const data = event.data as { reference?: string }
    const { reference } = data
    if (reference) {
      const existing = await db.givingRecord.findUnique({ where: { reference } })
      if (existing) {
        await db.givingRecord.update({
          where: { reference },
          data: {
            meta: {
              ...(existing.meta as object),
              subscriptionCreated: true,
              subscriptionPayload: event.data as Prisma.InputJsonValue,
            } as Prisma.InputJsonValue,
          },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
