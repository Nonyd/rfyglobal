import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendDailyDevotionalEmails } from '@/lib/emails/devotional'
import { sendEventReminderEmails } from '@/lib/emails/event-reminder'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { type: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (params.type === 'devotional') {
    const result = await sendDailyDevotionalEmails()
    return NextResponse.json({ success: true, ...result })
  }

  if (params.type === 'event-reminders') {
    const [week, day] = await Promise.all([
      sendEventReminderEmails('WEEK'),
      sendEventReminderEmails('DAY'),
    ])
    return NextResponse.json({ success: true, week, day })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
