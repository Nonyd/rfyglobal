import { db } from '@/lib/db'

export type ActivityModule =
  | 'Blog'
  | 'Scripture'
  | 'Study'
  | 'Events'
  | 'Gallery'
  | 'Forms'
  | 'Members'
  | 'CMS'
  | 'Integrations'
  | 'Automation'
  | 'Partnership'
  | 'Users'
  | 'Settings'

export async function logActivity({
  userId,
  action,
  module,
  targetId,
  targetTitle,
  ipAddress,
}: {
  userId: string
  action: string
  module: ActivityModule
  targetId?: string
  targetTitle?: string
  ipAddress?: string
}) {
  try {
    await db.activityLog.create({
      data: { userId, action, module, targetId, targetTitle, ipAddress },
    })
  } catch (err) {
    console.error('[ActivityLog] Failed to log:', err)
  }
}
