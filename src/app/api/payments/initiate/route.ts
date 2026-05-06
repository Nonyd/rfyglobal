import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InitiatePaymentSchema } from '@/lib/validations/payment'
import { generateReference } from '@/lib/utils'
import {
  getFlutterwaveCredentials,
  getPayazaCredentials,
  getPaymentSettings,
  getPaystackCredentials,
} from '@/lib/credentials'
import { strictRatelimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`payment:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = InitiatePaymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { amount, currency, donorName, donorEmail, gateway, frequency } = parsed.data
  const settings = await getPaymentSettings()
  const minimum = settings?.minimumGiftAmount ?? 100
  if (amount < minimum) {
    return NextResponse.json(
      { error: `Minimum gift amount is ₦${minimum.toLocaleString()}` },
      { status: 400 }
    )
  }
  const reference = generateReference(gateway.slice(0, 3))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const callbackUrl = `${appUrl}/partner/verify?gateway=${gateway}&ref=${reference}`

  await db.givingRecord.create({
    data: {
      donorName,
      donorEmail,
      amount,
      currency,
      gateway: gateway as 'PAYSTACK' | 'FLUTTERWAVE' | 'PAYAZA',
      reference,
      status: 'PENDING',
      meta: { frequency },
    },
  })

  try {
    if (gateway === 'PAYSTACK') {
      const creds = await getPaystackCredentials()
      if (!creds?.isActive) throw new Error('Paystack is currently unavailable')

      const planCode =
        frequency === 'MONTHLY'
          ? creds.monthlyPlanCode
          : frequency === 'ANNUAL'
            ? creds.annualPlanCode
            : undefined

      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: donorEmail,
          amount: amount * 100,
          reference,
          metadata: { donor_name: donorName, frequency, custom_fields: [] },
          callback_url: callbackUrl,
          ...(planCode ? { plan: planCode } : {}),
        }),
      })
      const data = await res.json()

      if (!data.status) throw new Error(data.message ?? 'Paystack initialization failed')
      return NextResponse.json({
        authorizationUrl: data.data.authorization_url,
        reference,
      })
    }

    if (gateway === 'FLUTTERWAVE') {
      const creds = await getFlutterwaveCredentials()
      if (!creds?.isActive) throw new Error('Flutterwave is currently unavailable')

      const planId =
        frequency === 'MONTHLY'
          ? creds.monthlyPlanId
          : frequency === 'ANNUAL'
            ? creds.annualPlanId
            : undefined

      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount,
          currency,
          redirect_url: callbackUrl,
          customer: { email: donorEmail, name: donorName },
          ...(planId ? { payment_plan: planId } : {}),
          meta: { frequency },
        }),
      })
      const data = await res.json()

      if (data.status !== 'success')
        throw new Error(data.message ?? 'Flutterwave initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.link, reference })
    }

    if (gateway === 'PAYAZA') {
      const creds = await getPayazaCredentials()
      if (!creds?.isActive) throw new Error('Payaza is currently unavailable')

      const res = await fetch('https://api.payaza.africa/merchant/api/v1/checkout/request', {
        method: 'POST',
        headers: {
          Authorization: `Payaza ${creds.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_transaction_reference: reference,
          payer: { email: donorEmail },
          transaction_amount: amount,
          currency,
          description: 'Room For You Partnership Gift',
          callback_url: callbackUrl,
          return_url: callbackUrl,
        }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.message ?? 'Payaza initialization failed')
      return NextResponse.json({
        authorizationUrl: data.data.checkout_url,
        reference,
      })
    }

    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 })
  } catch (err: unknown) {
    await db.givingRecord.update({
      where: { reference },
      data: { status: 'FAILED' },
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment initialization failed' },
      { status: 500 }
    )
  }
}
