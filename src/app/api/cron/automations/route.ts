/**
 * CRON SETUP — Run daily at 8:00 AM Nigeria time (7:00 AM UTC)
 *
 * Add to Webuzo cron jobs:
 * 0 7 * * * curl -s "https://rfyglobal.org/api/cron/automations?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
 *
 * Or use cron-job.org (free external cron service):
 * URL: https://rfyglobal.org/api/cron/automations?secret=YOUR_CRON_SECRET
 * Schedule: Every day at 07:00 UTC
 *
 * Responds 202 immediately and runs the jobs in the background (this is a long-lived PM2 Node process,
 * not serverless), so an Apache/Cloudflare timeout can't cut a big send off halfway. Results go to the
 * PM2 log (`pm2 logs rfyglobal | grep cron:automations`). Add `&wait=1` to run inline and get the
 * results in the response (manual checks only).
 * Calendar dates use Africa/Lagos (src/lib/automations.ts). Greeting runners record `lastRunOn`, so a
 * second hit on the same day does not send duplicates.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAutomationEnabled } from '@/lib/automations'
import { runBirthdayAutomation } from '@/lib/automation-runners/birthday'
import { runDailyScriptureAutomation } from '@/lib/automation-runners/daily-scripture'
import { runDailyStudyAutomation } from '@/lib/automation-runners/daily-study'
import { runEventReminderAutomation } from '@/lib/automation-runners/event-reminder'
import {
  runChristmasAutomation,
  runNewYearAutomation,
  runEasterAutomation,
} from '@/lib/automation-runners/special-dates'
import { syncRfyLivePlaylist } from '@/lib/rfy-youtube-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret && secret === process.env.CRON_SECRET) return true
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

const RUNNERS: Array<[key: string, run: () => Promise<unknown>]> = [
  ['birthday', runBirthdayAutomation],
  ['event_reminder', runEventReminderAutomation],
  ['daily_scripture', runDailyScriptureAutomation],
  ['daily_study', runDailyStudyAutomation],
  ['christmas', runChristmasAutomation],
  ['new_year', runNewYearAutomation],
  ['easter', runEasterAutomation],
]

let running: Promise<Record<string, unknown>> | null = null

async function runAll(): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {}

  for (const [key, run] of RUNNERS) {
    if (!(await isAutomationEnabled(key))) continue
    try {
      results[key] = await run()
    } catch (e) {
      results[key] = { error: String(e) }
    }
  }

  try {
    results.youtube = await syncRfyLivePlaylist()
  } catch (e) {
    results.youtube = { error: String(e) }
  }

  return results
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // One run at a time per process; a second hit while one is in flight joins it.
  const alreadyRunning = running !== null
  if (!running) {
    const startedAt = new Date().toISOString()
    running = runAll()
      .then((results) => {
        console.log('[cron:automations]', JSON.stringify({ startedAt, results }))
        return results
      })
      .catch((e) => {
        console.error('[cron:automations] failed', e)
        return { error: String(e) }
      })
      .finally(() => {
        running = null
      })
  }

  if (req.nextUrl.searchParams.get('wait') === '1') {
    const results = await running
    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() })
  }

  return NextResponse.json(
    { success: true, status: alreadyRunning ? 'already-running' : 'started', timestamp: new Date().toISOString() },
    { status: 202 },
  )
}
