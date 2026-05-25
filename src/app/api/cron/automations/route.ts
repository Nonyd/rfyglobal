/**
 * CRON SETUP — Run daily at 8:00 AM Nigeria time (7:00 AM UTC)
 *
 * Add to Webuzo cron jobs:
 * 0 7 * * * curl -s "https://rfyglobal.org/api/cron/automations?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
 *
 * Or use cron-job.org (free external cron service):
 * URL: https://rfyglobal.org/api/cron/automations?secret=YOUR_CRON_SECRET
 * Schedule: Every day at 07:00 UTC
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAutomationEnabled } from '@/lib/automations'
import { runBirthdayAutomation } from '@/lib/automation-runners/birthday'
import { runDailyScriptureAutomation } from '@/lib/automation-runners/daily-scripture'
import { runDailyStudyAutomation } from '@/lib/automation-runners/daily-study'
import { runEventReminderAutomation } from '@/lib/automation-runners/event-reminder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, string> = {}

  if (await isAutomationEnabled('birthday')) {
    results.birthday = await runBirthdayAutomation()
  }

  if (await isAutomationEnabled('event_reminder')) {
    results.event_reminder = await runEventReminderAutomation()
  }

  if (await isAutomationEnabled('daily_scripture')) {
    results.daily_scripture = await runDailyScriptureAutomation()
  }

  if (await isAutomationEnabled('daily_study')) {
    results.daily_study = await runDailyStudyAutomation()
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  })
}
