import { NextResponse } from 'next/server'
import { getPaymentSettings } from '@/lib/payment-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await getPaymentSettings()
    return NextResponse.json({
      usdEnabled: settings.usdEnabled,
    })
  } catch {
    return NextResponse.json({ usdEnabled: false })
  }
}
