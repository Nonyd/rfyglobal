import { db } from './db'

export async function isAutomationEnabled(key: string): Promise<boolean> {
  try {
    const setting = await db.automationSetting.findUnique({ where: { key } })
    return setting?.enabled ?? false
  } catch {
    return false
  }
}
