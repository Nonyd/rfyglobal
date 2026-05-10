import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getFlutterwaveCredentials, getPaystackCredentials } from '@/lib/credentials'
import { paystackRequest } from '@/lib/paystack'
import { notifyPartnerGivingConfirmationIfNeeded } from '@/lib/emails/partner-confirmation'
import { sendEventRegistrationEmail } from '@/lib/emails/event-registration'
import { extractMappedEventFields } from '@/lib/event-registration-map'
import { notifyPartnerGiftOnce, createNotification } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { reference } = (await req.json()) as { reference?: string }
    if (!reference?.trim()) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    }

    const response = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference.trim())}`)
    const transaction = response.data as {
      status: string
      reference: string
      amount: number
      currency: string
      customer?: { email?: string }
      metadata?: Record<string, unknown>
    }

    if (transaction.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment not successful', status: transaction.status },
        { status: 400 },
      )
    }

    const metaRaw = transaction.metadata ?? {}
    const priorPending = await db.givingRecord.findUnique({
      where: { reference: transaction.reference },
    })
    const priorMeta = (priorPending?.meta as Record<string, unknown>) ?? {}
    const givingType =
      (metaRaw.type as string) ??
      (metaRaw.givingType as string) ??
      (priorMeta.givingType as string) ??
      (priorMeta.type as string) ??
      'partnership'

    const existingSuccess = await db.givingRecord.findFirst({
      where: { reference: transaction.reference, status: 'SUCCESS' },
    })
    if (existingSuccess) {
      return NextResponse.json({ success: true, duplicate: true, record: existingSuccess })
    }

    const email =
      transaction.customer?.email ??
      (metaRaw.email as string) ??
      priorPending?.donorEmail ??
      ''
    const name =
      (metaRaw.name as string) ??
      (metaRaw.donor_name as string) ??
      priorPending?.donorName ??
      'Anonymous'

    const amountMajor = transaction.amount / 100

    if (givingType === 'event') {
      const eventId =
        (metaRaw.eventId as string | undefined) ?? (priorMeta.eventId as string | undefined)
      const draftId =
        (metaRaw.draftId as string | undefined) ?? (priorMeta.draftId as string | undefined)
      if (!eventId || !draftId) {
        return NextResponse.json({ error: 'Invalid event payment metadata' }, { status: 400 })
      }

      const draft = await db.eventRegistrationDraft.findFirst({
        where: { id: draftId, eventId },
      })
      if (!draft) {
        return NextResponse.json(
          { error: 'Registration session not found or already completed.' },
          { status: 400 },
        )
      }

      const event = await db.event.findUnique({ where: { id: eventId } })
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      const fieldValues = draft.fields as Record<string, string>
      const formFields = await db.eventFormField.findMany({
        where: { eventId: event.id, isActive: true },
        orderBy: { order: 'asc' },
      })
      const { email: regEmail, name: regName, phone, location, expectations } =
        extractMappedEventFields(formFields, fieldValues)

      await db.eventRegistration.create({
        data: {
          eventId: event.id,
          name: regName || regEmail,
          email: regEmail,
          phone: phone || 'N/A',
          location: location || 'N/A',
          expectations,
          extraFields: fieldValues,
        },
      })

      await db.eventRegistrationDraft.delete({ where: { id: draft.id } })

      const record = await db.givingRecord.upsert({
        where: { reference: transaction.reference },
        create: {
          reference: transaction.reference,
          donorEmail: email || regEmail,
          donorName: name,
          amount: amountMajor,
          currency: transaction.currency,
          gateway: 'PAYSTACK',
          status: 'SUCCESS',
          meta: {
            givingType: 'event',
            eventId,
            paystackData: transaction,
          } as Prisma.InputJsonValue,
        },
        update: {
          donorEmail: email || regEmail,
          donorName: name,
          amount: amountMajor,
          currency: transaction.currency,
          status: 'SUCCESS',
          meta: {
            givingType: 'event',
            eventId,
            paystackData: transaction,
          } as Prisma.InputJsonValue,
        },
      })

      try {
        await sendEventRegistrationEmail({
          name: regName || regEmail,
          email: regEmail,
          event,
        })
      } catch (err) {
        console.error('[payments/verify] event confirmation email:', err)
      }

      await createNotification('event_registration', `Paid registration for ${event.title}`)

      return NextResponse.json({ success: true, record })
    }

    const mergedMeta = {
      ...priorMeta,
      paystackData: transaction,
    } as Prisma.InputJsonValue

    const record = await db.givingRecord.upsert({
      where: { reference: transaction.reference },
      create: {
        reference: transaction.reference,
        donorEmail: email,
        donorName: name,
        amount: amountMajor,
        currency: transaction.currency,
        gateway: 'PAYSTACK',
        status: 'SUCCESS',
        meta: mergedMeta,
      },
      update: {
        donorEmail: email,
        donorName: name,
        amount: amountMajor,
        currency: transaction.currency,
        status: 'SUCCESS',
        meta: mergedMeta,
      },
    })

    await notifyPartnerGivingConfirmationIfNeeded(transaction.reference)

    const donor = record.donorName?.trim() || record.donorEmail?.trim() || 'Anonymous'
    await notifyPartnerGiftOnce(transaction.reference, record.amount, donor, record.currency)

    return NextResponse.json({ success: true, record })
  } catch (error: unknown) {
    console.error('[payments/verify POST]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gateway = searchParams.get('gateway')
  const reference = searchParams.get('ref')
  const transactionId = searchParams.get('transaction_id')

  if (!gateway || !reference) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const record = await db.givingRecord.findUnique({ where: { reference } })
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  if (record.status === 'SUCCESS') {
    return NextResponse.json({ status: 'success', reference })
  }

  try {
    let verified = false

    if (gateway === 'PAYSTACK') {
      const creds = await getPaystackCredentials()
      if (!creds?.secretKey) return NextResponse.json({ status: 'error', reference }, { status: 503 })
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${creds.secretKey}` },
      })
      const data = await res.json()
      verified = data.data?.status === 'success'
      if (verified) {
        await db.givingRecord.update({
          where: { reference },
          data: {
            status: 'SUCCESS',
            meta: { ...(record.meta as object), paystackData: data.data },
          },
        })
        await notifyPartnerGivingConfirmationIfNeeded(reference)
        const gift = await db.givingRecord.findUnique({ where: { reference } })
        if (gift) {
          const donor =
            gift.donorName?.trim() || gift.donorEmail?.trim() || 'Anonymous'
          await notifyPartnerGiftOnce(reference, gift.amount, donor, gift.currency)
        }
      }
    } else if (gateway === 'FLUTTERWAVE') {
      if (!transactionId) {
        if (record.status === 'PENDING') {
          return NextResponse.json({ status: 'pending', reference })
        }
      } else {
        const creds = await getFlutterwaveCredentials()
        if (!creds?.secretKey) {
          return NextResponse.json({ status: 'error', reference }, { status: 503 })
        }
        const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
          headers: { Authorization: `Bearer ${creds.secretKey}` },
        })
        const data = await res.json()
        verified =
          data.data?.status === 'successful' && data.data?.tx_ref === reference
        if (verified) {
          await db.givingRecord.update({
            where: { reference },
            data: {
              status: 'SUCCESS',
              meta: { ...(record.meta as object), flwData: data.data },
            },
          })
          await notifyPartnerGivingConfirmationIfNeeded(reference)
          const gift = await db.givingRecord.findUnique({ where: { reference } })
          if (gift) {
            const donor =
              gift.donorName?.trim() || gift.donorEmail?.trim() || 'Anonymous'
            await notifyPartnerGiftOnce(reference, gift.amount, donor, gift.currency)
          }
        }
      }
    } else if (gateway === 'PAYAZA') {
      if (record.status === 'PENDING') {
        return NextResponse.json({ status: 'pending', reference })
      }
      verified = false
    }

    if (!verified) {
      await db.givingRecord.update({ where: { reference }, data: { status: 'FAILED' } })
    }

    return NextResponse.json({ status: verified ? 'success' : 'failed', reference })
  } catch {
    return NextResponse.json({ status: 'error', reference }, { status: 500 })
  }
}
