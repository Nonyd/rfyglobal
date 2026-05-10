import { NextResponse } from 'next/server'
import { getPaystackCredentials } from '@/lib/paystack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const creds = await getPaystackCredentials()
    return NextResponse.json({
      usdEnabled: creds?.usdEnabled === true,
    })
  } catch {
    return NextResponse.json({ usdEnabled: false })
  }
}
