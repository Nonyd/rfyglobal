import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendDailyDevotionalEmails } from '@/lib/emails/devotional'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await db.automationSettings.findFirst()
  if (settings && !settings.isDevotionalActive) {
    return NextResponse.json({ success: true, skipped: true, reason: 'devotional_disabled' })
  }

  const result = await sendDailyDevotionalEmails()
  return NextResponse.json({ success: true, ...result })
}
