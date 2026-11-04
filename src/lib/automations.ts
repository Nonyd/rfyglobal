import type { Prisma } from '@prisma/client'
import { db } from './db'
import { automationToday } from './automation-date'

export { AUTOMATION_TIMEZONE, automationToday } from './automation-date'

export async function isAutomationEnabled(key: string): Promise<boolean> {
  try {
    const setting = await db.automationSetting.findUnique({ where: { key } })
    return setting?.enabled ?? false
  } catch {
    return false
  }
}

/**
 * Records that `key` has run today (Lagos date) in its AutomationSetting config (`lastRunOn`) and returns
 * true, or returns false if it already ran today. Claimed before sending, so a re-run or a second cron hit
 * the same day never sends duplicate greetings (a crash mid-send is not retried; that beats double emails).
 */
export async function claimDailyRun(key: string): Promise<boolean> {
  const { iso } = automationToday()
  const setting = await db.automationSetting.findUnique({ where: { key } })
  const config = (setting?.config ?? {}) as Prisma.JsonObject
  if (config.lastRunOn === iso) return false
  await db.automationSetting.upsert({
    where: { key },
    create: { key, enabled: false, config: { lastRunOn: iso } },
    update: { config: { ...config, lastRunOn: iso } },
  })
  return true
}
