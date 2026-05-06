import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEventReminderEmails } from '@/lib/emails/event-reminder'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await db.automationSettings.findFirst()
  if (settings && !settings.isEventReminderActive) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'event_reminders_disabled',
    })
  }

  const [weekResult, dayResult] = await Promise.all([
    sendEventReminderEmails('WEEK'),
    sendEventReminderEmails('DAY'),
  ])

  return NextResponse.json({ success: true, weekReminders: weekResult, dayReminders: dayResult })
}
