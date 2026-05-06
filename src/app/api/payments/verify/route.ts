import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getFlutterwaveCredentials, getPaystackCredentials } from '@/lib/credentials'

export const runtime = 'nodejs'

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
