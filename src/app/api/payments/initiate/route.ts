import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InitiatePaymentSchema, PhasePaystackInitiateSchema } from '@/lib/validations/payment'
import { generateReference } from '@/lib/utils'
import {
  getFlutterwaveCredentials,
  getPayazaCredentials,
  getPaymentSettings,
  getPaystackCredentials,
} from '@/lib/credentials'
import { paystackRequest } from '@/lib/paystack'
import { strictRatelimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PaystackPlanRow = {
  plan_code: string
  amount: number
  currency: string
  interval: string
}

async function getOrCreateMonthlyPlan(amount: number, currency: string): Promise<string> {
  let page = 1
  while (page <= 20) {
    const res = await paystackRequest<PaystackPlanRow[]>(`/plan?page=${page}&perPage=100`)
    const plans = res.data
    const match = plans?.find(
      (p) => p.amount === amount && p.currency === currency && p.interval === 'monthly',
    )
    if (match) return match.plan_code
    if (!plans?.length || plans.length < 100) break
    page += 1
  }

  const planName = `RFY Monthly Partner ${currency} ${amount / 100}`
  const created = await paystackRequest<{ plan_code: string }>('/plan', {
    method: 'POST',
    body: JSON.stringify({
      name: planName,
      interval: 'monthly',
      amount,
      currency,
    }),
  })
  return created.data.plan_code
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`payment:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()

  const phaseParsed = PhasePaystackInitiateSchema.safeParse(body)
  if (phaseParsed.success) {
    return handlePhasePaystackInitiate(phaseParsed.data)
  }

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
      { status: 400 },
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
        accessCode: data.data.access_code,
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
      return NextResponse.json({
        authorizationUrl: data.data.link,
        reference,
      })
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
      { status: 500 },
    )
  }
}

async function handlePhasePaystackInitiate(
  input: import('@/lib/validations/payment').PhasePaystackInitiateInput,
) {
  const creds = await getPaystackCredentials()
  if (!creds?.isActive || !creds.secretKey) {
    return NextResponse.json({ error: 'Paystack is currently unavailable' }, { status: 503 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const {
    email,
    name,
    amount,
    currency,
    frequency,
    type,
    eventId,
    draftId,
    metadata,
    callbackUrl: rawCallback,
  } = input

  const settings = await getPaymentSettings()
  const minimumNgnMajor = settings?.minimumGiftAmount ?? 100
  const minKobo = minimumNgnMajor * 100

  if (currency === 'NGN' && amount < Math.max(10000, minKobo)) {
    return NextResponse.json(
      { error: `Minimum amount is ₦${Math.max(100, minimumNgnMajor).toLocaleString()}` },
      { status: 400 },
    )
  }
  if (currency === 'USD' && amount < 100) {
    return NextResponse.json({ error: 'Minimum amount is $1' }, { status: 400 })
  }

  let callbackUrl = rawCallback ?? `${appUrl}/partner/verify`
  let metaPayload: Record<string, unknown> = {
    donor_name: name,
    name,
    type,
    frequency,
    ...(metadata ?? {}),
  }

  if (type === 'event') {
    if (!eventId || !draftId) {
      return NextResponse.json({ error: 'eventId and draftId are required for event payments' }, { status: 400 })
    }

    const draft = await db.eventRegistrationDraft.findFirst({
      where: { id: draftId, eventId },
    })
    if (!draft || draft.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Registration session expired. Please try again.' }, { status: 400 })
    }

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event || !event.isActive) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const feeNgn = event.registrationFeeNgn ?? 0
    const feeUsd = event.registrationFeeUsd ?? 0
    const major = currency === 'NGN' ? feeNgn : feeUsd
    if (major == null || major <= 0) {
      return NextResponse.json({ error: 'No fee configured for this currency.' }, { status: 400 })
    }

    const expectedSmallest = Math.round(major * 100)
    if (expectedSmallest !== amount) {
      return NextResponse.json({ error: 'Amount does not match event fee.' }, { status: 400 })
    }

    const slug = event.slug ?? event.id
    callbackUrl = rawCallback ?? `${appUrl}/events/${slug}/verify`

    metaPayload = {
      ...metaPayload,
      eventId,
      draftId,
    }
  }

  try {
    let bodyInit: Record<string, unknown>

    if (type === 'partnership' && frequency === 'monthly') {
      const planCode = await getOrCreateMonthlyPlan(amount, currency)
      bodyInit = {
        email,
        amount,
        currency,
        plan: planCode,
        callback_url: callbackUrl,
        metadata: metaPayload,
      }
    } else if (type === 'partnership' && frequency === 'annual') {
      const plan = creds.annualPlanCode
      if (!plan?.trim()) {
        return NextResponse.json(
          { error: 'Annual plan is not configured in Integrations.' },
          { status: 400 },
        )
      }
      bodyInit = {
        email,
        amount,
        currency,
        plan,
        callback_url: callbackUrl,
        metadata: { ...metaPayload, frequency: 'annual' },
      }
    } else {
      bodyInit = {
        email,
        amount,
        currency,
        callback_url: callbackUrl,
        metadata: { ...metaPayload, frequency: frequency === 'annual' ? 'annual' : 'one_time' },
      }
    }

    const response = await paystackRequest<{
      authorization_url: string
      reference: string
      access_code: string
    }>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(bodyInit),
    })

    const ref = response.data.reference

    await db.givingRecord.create({
      data: {
        reference: ref,
        donorName: name,
        donorEmail: email,
        amount: amount / 100,
        currency,
        gateway: 'PAYSTACK',
        status: 'PENDING',
        meta: {
          phase: 'paystack_checkout',
          frequency,
          givingType: type,
          ...(draftId ? { draftId } : {}),
          ...(eventId ? { eventId } : {}),
        },
      },
    })

    return NextResponse.json({
      authorizationUrl: response.data.authorization_url,
      reference: ref,
      accessCode: response.data.access_code,
    })
  } catch (err: unknown) {
    console.error('[payments/initiate phase]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment initialization failed' },
      { status: 500 },
    )
  }
}
