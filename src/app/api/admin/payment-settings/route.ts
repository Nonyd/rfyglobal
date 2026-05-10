import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPaymentSettings, savePaymentSettings } from '@/lib/payment-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await getPaymentSettings()
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ usdEnabled: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as Partial<{ usdEnabled: boolean }>
    await savePaymentSettings(body)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Save failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
