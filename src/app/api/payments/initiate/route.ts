import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InitiatePaymentSchema } from '@/lib/validations/payment'
import { generateReference } from '@/lib/utils'
import { paystackInitialize } from '@/lib/payments/paystack'
import { flutterwaveInitialize } from '@/lib/payments/flutterwave'
import { payazaInitialize } from '@/lib/payments/payaza'
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
      const planCode =
        frequency === 'MONTHLY'
          ? process.env.PAYSTACK_MONTHLY_PLAN_CODE
          : frequency === 'ANNUAL'
            ? process.env.PAYSTACK_ANNUAL_PLAN_CODE
            : undefined

      const data = await paystackInitialize({
        email: donorEmail,
        amount: amount * 100,
        reference,
        metadata: { donor_name: donorName, frequency, custom_fields: [] },
        callback_url: callbackUrl,
        ...(planCode ? { plan: planCode } : {}),
      })

      if (!data.status) throw new Error(data.message ?? 'Paystack initialization failed')
      return NextResponse.json({
        authorizationUrl: data.data.authorization_url,
        reference,
      })
    }

    if (gateway === 'FLUTTERWAVE') {
      const planId =
        frequency === 'MONTHLY'
          ? process.env.FLUTTERWAVE_MONTHLY_PLAN_ID
          : frequency === 'ANNUAL'
            ? process.env.FLUTTERWAVE_ANNUAL_PLAN_ID
            : undefined

      const data = await flutterwaveInitialize({
        tx_ref: reference,
        amount,
        currency,
        redirect_url: callbackUrl,
        customer: { email: donorEmail, name: donorName },
        ...(planId ? { payment_plan: planId } : {}),
        meta: { frequency },
      })

      if (data.status !== 'success')
        throw new Error(data.message ?? 'Flutterwave initialization failed')
      return NextResponse.json({ authorizationUrl: data.data.link, reference })
    }

    if (gateway === 'PAYAZA') {
      const data = await payazaInitialize({
        transaction_ref: reference,
        email: donorEmail,
        amount,
        currency,
        description: 'Room For You Partnership Gift',
        callback_url: callbackUrl,
        return_url: callbackUrl,
      })

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
