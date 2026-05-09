'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Bell, CheckCheck, Trash2 } from 'lucide-react'

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  link: string
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  prayer: '🙏',
  testimony: '✨',
  message: '💬',
  member: '👤',
  partner: '💛',
  event_registration: '📅',
  contact: '📩',
}

const TYPE_LABELS: Record<string, string> = {
  prayer: 'Prayer',
  testimony: 'Testimony',
  message: 'Message',
  member: 'Member',
  partner: 'Partner',
  event_registration: 'Event',
  contact: 'Contact',
}

const TYPE_ORDER = [
  'prayer',
  'testimony',
  'message',
  'member',
  'partner',
  'event_registration',
  'contact',
] as const

export function AdminNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [totalUnread, setTotalUnread] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setTotalUnread(data.total ?? 0)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void load()
    const es = new EventSource('/api/admin/notifications/stream')
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'notification') void load()
      } catch {
        /* ignore */
      }
    }
    return () => es.close()
  }, [load])

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setTotalUnread(0)
    void load()
  }

  const markRead = async (id: string) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setTotalUnread((t) => Math.max(0, t - 1))
  }

  const dismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/admin/notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    void load()
  }

  const navigateTo = async (n: NotificationRow) => {
    if (!n.isRead) await markRead(n.id)
    router.push(n.link)
  }

  const unread = notifications.filter((n) => !n.isRead)
  const read = notifications.filter((n) => n.isRead)

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>
            Notifications
          </h2>
          <p className="text-sm font-body mt-1" style={{ color: 'var(--a-text-muted)' }}>
            Everything that needs your attention, in one place.
          </p>
        </div>
        {totalUnread > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex items-center gap-2 px-4 py-2 font-body text-xs font-medium border transition-all shrink-0"
            style={{ borderColor: 'var(--a-gold-border)', color: 'var(--a-gold)' }}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div
          className="border flex flex-col items-center justify-center py-20 px-6"
          style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
        >
          <Bell size={40} style={{ color: 'var(--a-text-muted)', opacity: 0.35 }} />
          <p className="font-body text-sm mt-4" style={{ color: 'var(--a-text-muted)' }}>
            No notifications yet
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {unread.length > 0 && (
            <section>
              <p
                className="font-body text-[10px] uppercase tracking-widest font-semibold mb-3 px-1"
                style={{ color: 'var(--a-text-muted)' }}
              >
                New
              </p>
              <div
                className="border overflow-hidden rounded-sm"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
              >
                {TYPE_ORDER.map((type) => {
                  const items = unread.filter((n) => n.type === type)
                  if (items.length === 0) return null
                  return (
                    <div key={type}>
                      <div
                        className="px-4 py-2 border-b font-body text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          borderColor: 'var(--a-border)',
                          background: 'var(--a-bg)',
                          color: 'var(--a-gold)',
                        }}
                      >
                        {TYPE_LABELS[type] ?? type}
                      </div>
                      {items.map((n) => (
                        <NotificationRowItem key={n.id} n={n} onOpen={() => void navigateTo(n)} onDismiss={dismiss} />
                      ))}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {read.length > 0 && (
            <section>
              <p
                className="font-body text-[10px] uppercase tracking-widest font-semibold mb-3 px-1"
                style={{ color: 'var(--a-text-muted)' }}
              >
                Earlier
              </p>
              <div
                className="border overflow-hidden rounded-sm"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
              >
                {read.map((n) => (
                  <NotificationRowItem key={n.id} n={n} onOpen={() => void navigateTo(n)} onDismiss={dismiss} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationRowItem({
  n,
  onOpen,
  onDismiss,
}: {
  n: NotificationRow
  onOpen: () => void
  onDismiss: (id: string, e: React.MouseEvent) => void
}) {
  return (
    <div
      className="flex w-full items-stretch border-b transition-colors last:border-b-0 group"
      style={{
        borderColor: 'var(--a-border)',
        background: n.isRead ? 'transparent' : 'var(--a-gold-light)',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-start gap-3 px-4 py-4 text-left min-w-0"
        style={{ background: 'transparent' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
          style={{ background: 'var(--a-bg)' }}
        >
          {TYPE_ICONS[n.type] ?? '🔔'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-body text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
              {n.title}
            </span>
            {!n.isRead && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--a-gold)' }} />
            )}
          </div>
          {n.body ? (
            <p className="font-body text-xs line-clamp-2 mb-1" style={{ color: 'var(--a-text-muted)' }}>
              {n.body}
            </p>
          ) : null}
          <p className="font-body text-[10px]" style={{ color: 'var(--a-text-muted)', opacity: 0.75 }}>
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </p>
        </div>
      </button>
      <div
        className="flex flex-col items-center justify-center gap-1 px-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity border-l"
        style={{ borderColor: 'var(--a-border)' }}
      >
        <ArrowRight size={14} style={{ color: 'var(--a-text-muted)' }} />
        <button
          type="button"
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--a-text-muted)' }}
          title="Dismiss"
          onClick={(e) => onDismiss(n.id, e)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
