import { db } from '@/lib/db'
import { AutomationManager } from '@/components/admin/automation/AutomationManager'

export const dynamic = 'force-dynamic'

export default async function AutomationPage() {
  let settings = await db.automationSettings.findFirst()
  if (!settings) {
    settings = await db.automationSettings.create({
      data: {
        whatsappChannelUrl: '',
        devotionalEmailTime: '07:00',
        isDevotionalActive: true,
        isEventReminderActive: true,
      },
    })
  }

  const recentLogs = await db.emailLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 10,
    include: { member: { select: { name: true, email: true } } },
  })

  return <AutomationManager settings={settings} recentLogs={recentLogs} />
}
