import { db } from '@/lib/db'
import { broadcastToVisitor } from '@/lib/chat-visitor-sse'

export type NotificationType =
  | 'prayer'
  | 'testimony'
  | 'message'
  | 'member'
  | 'partner'
  | 'event_registration'
  | 'contact'
  | 'live_chat'

const NOTIFICATION_CONFIG: Record<NotificationType, { title: string; link: string }> = {
  prayer: { title: 'New Prayer Request', link: '/admin/prayer' },
  testimony: { title: 'New Testimony Submitted', link: '/admin/testimonies' },
  message: { title: 'New Message', link: '/admin/messages' },
  member: { title: 'New Community Member', link: '/admin/members' },
  partner: { title: 'New Partnership Gift', link: '/admin/partner' },
  event_registration: { title: 'New Event Registration', link: '/admin/events' },
  contact: { title: 'New Contact Form Submission', link: '/admin/messages' },
  live_chat: { title: 'New Live Chat Message', link: '/admin/live-chat' },
}

const SSE_EVENT_MAP: Record<NotificationType, string> = {
  prayer: 'new_prayer',
  testimony: 'new_testimony',
  message: 'new_message',
  member: 'new_member',
  partner: 'new_partner',
  event_registration: 'new_event_registration',
  contact: 'new_message',
  live_chat: 'new_chat_message',
}

type SSESendFn = (data: string) => void
const sseClients = new Set<SSESendFn>()

export function addSSEClient(send: SSESendFn): () => void {
  sseClients.add(send)
  return () => sseClients.delete(send)
}

export function broadcastSSE(payload: Record<string, unknown>): void {
  const message = `data: ${JSON.stringify(payload)}\n\n`
  sseClients.forEach((send) => {
    try {
      send(message)
    } catch {
      /* client disconnected */
    }
  })

  if (payload.sessionToken && typeof payload.sessionToken === 'string') {
    broadcastToVisitor(payload.sessionToken, payload)
  }
}

/** Generic refresh pulse for PATCH/DELETE/bulk ops (same SSE channel as notifications). */
export function notifySSEClients(): void {
  broadcastSSE({ type: 'notification', event: 'refresh', timestamp: Date.now() })
}

export async function createNotification(
  type: NotificationType,
  body?: string,
  opts?: { targetId?: string },
): Promise<void> {
  try {
    const config = NOTIFICATION_CONFIG[type]

    await db.adminNotification.create({
      data: {
        type,
        title: config.title,
        body: body ?? null,
        link: config.link,
        isRead: false,
        ...(opts?.targetId ? { targetId: opts.targetId } : {}),
      },
    })

    broadcastSSE({
      type: 'notification',
      event: SSE_EVENT_MAP[type],
      notificationType: type,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('[notify] createNotification error:', error)
  }
}

/** One admin notification per payment reference (deduped by reference substring in body). */
export async function notifyPartnerGiftOnce(
  paymentId: string,
  amount: number,
  name: string,
  currency = 'NGN',
): Promise<void> {
  try {
    const existing = await db.adminNotification.findFirst({
      where: {
        type: 'partner',
        body: { contains: paymentId },
      },
    })
    if (existing) return

    const amountLabel =
      currency === 'USD'
        ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : `₦${amount.toLocaleString()}`
    await createNotification('partner', `${paymentId} — ${amountLabel} from ${name}`)
  } catch (error) {
    console.error('[notify] notifyPartnerGiftOnce error:', error)
  }
}
