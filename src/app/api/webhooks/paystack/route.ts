import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { verifyPaystackWebhook } from '@/lib/payments/paystack'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  if (!verifyPaystackWebhook(rawBody, signature)) {
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
