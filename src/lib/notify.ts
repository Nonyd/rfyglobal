import type { PaymentStatus } from '@prisma/client'
import { db } from '@/lib/db'

export type NotificationType =
  | 'prayer'
  | 'testimony'
  | 'message'
  | 'member'
  | 'partner'
  | 'event_registration'
  | 'contact'

const NOTIFICATION_CONFIG: Record<NotificationType, { title: string; link: string }> = {
  prayer: { title: 'New Prayer Request', link: '/admin/prayer' },
  testimony: { title: 'New Testimony Submitted', link: '/admin/testimonies' },
  message: { title: 'New Message', link: '/admin/messages' },
  member: { title: 'New Community Member', link: '/admin/members' },
  partner: { title: 'New Partnership Gift', link: '/admin/partner' },
  event_registration: { title: 'New Event Registration', link: '/admin/events' },
  contact: { title: 'New Contact Form Submission', link: '/admin/messages' },
}

const sseClients = new Set<(data: string) => void>()

export function addSSEClient(send: (data: string) => void) {
  sseClients.add(send)
  return () => sseClients.delete(send)
}

export function notifySSEClients() {
  const message = `data: ${JSON.stringify({ type: 'notification' })}\n\n`
  sseClients.forEach((send) => {
    try {
      send(message)
    } catch {
      /* disconnected */
    }
  })
}

export async function createNotification(
  type: NotificationType,
  body?: string,
  options?: { targetId?: string },
) {
  const config = NOTIFICATION_CONFIG[type]
  try {
    await db.adminNotification.create({
      data: {
        type,
        title: config.title,
        body: body ?? null,
        link: config.link,
        ...(options?.targetId ? { targetId: options.targetId } : {}),
      },
    })
    notifySSEClients()
  } catch (err) {
    console.error('[notify] Failed to persist admin notification:', err)
  }
}

/** Fire once when a gift transitions to SUCCESS (avoids duplicate webhook/verify pings). */
export async function notifyPartnerGiftOnce(
  reference: string,
  previousStatus: PaymentStatus | null | undefined,
) {
  if (previousStatus === 'SUCCESS') return
  const rec = await db.givingRecord.findUnique({ where: { reference } })
  if (!rec || rec.status !== 'SUCCESS') return
  const name = rec.donorName?.trim() || rec.donorEmail?.trim() || 'Partner'
  await createNotification('partner', `₦${rec.amount.toLocaleString()} gift from ${name}`)
}
