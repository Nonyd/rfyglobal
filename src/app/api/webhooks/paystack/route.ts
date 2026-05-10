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

  const signingSecret = (creds.webhookSecret?.trim() || creds.secretKey)?.trim()
  if (!signingSecret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const hash = createHmac('sha512', signingSecret).update(rawBody).digest('hex')
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
      metadata?: Record<string, unknown>
      plan?: unknown
    }
    const { reference, amount, customer } = data
    if (!reference || amount == null) {
      return NextResponse.json({ received: true })
    }

    const meta = data.metadata ?? {}
    const givingType = (meta.type as string) ?? (meta.givingType as string) ?? 'partnership'

    // Paid event registrations are finalized in POST /api/payments/verify (draft → attendee row).
    if (givingType === 'event') {
      return NextResponse.json({ received: true })
    }

    await db.givingRecord.upsert({
      where: { reference },
      update: {
        status: 'SUCCESS',
        meta: {
          ...(typeof meta === 'object' ? meta : {}),
          paystackWebhook: event.data as Prisma.InputJsonValue,
          givingType,
        } as Prisma.InputJsonValue,
      },
      create: {
        reference,
        amount: amount / 100,
        currency: data.currency ?? 'NGN',
        gateway: 'PAYSTACK',
        status: 'SUCCESS',
        donorEmail: customer?.email ?? null,
        donorName:
          (meta.name as string) ??
          customer?.metadata?.donor_name ??
          (meta.donor_name as string) ??
          null,
        meta: {
          ...(typeof meta === 'object' ? meta : {}),
          paystackWebhook: event.data as Prisma.InputJsonValue,
          givingType,
        } as Prisma.InputJsonValue,
      },
    })

    await notifyPartnerGivingConfirmationIfNeeded(reference)
    const gift = await db.givingRecord.findUnique({ where: { reference } })
    if (gift?.status === 'SUCCESS') {
      const donor = gift.donorName?.trim() || gift.donorEmail?.trim() || 'Anonymous'
      await notifyPartnerGiftOnce(reference, gift.amount, donor, gift.currency)
    }
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
