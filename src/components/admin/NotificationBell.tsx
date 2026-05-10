'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import Link from 'next/link'

interface AdminNotificationRow {
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotificationRow[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const esRef = useRef<EventSource | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadTotal(data.total ?? 0)
    } catch (e) {
      console.error('[NotificationBell] fetch error', e)
    }
  }, [])

  useEffect(() => {
    void fetchNotifications()

    const connect = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
      const es = new EventSource('/api/admin/notifications/stream')
      esRef.current = es

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'notification') {
            void fetchNotifications()
          }
        } catch {
          /* ignore */
        }
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        reconnectRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      esRef.current?.close()
    }
  }, [fetchNotifications])

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
      cache: 'no-store',
    })
    await fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      cache: 'no-store',
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadTotal((prev) => Math.max(0, prev - 1))
  }

  const dismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/admin/notifications?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
    })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await fetchNotifications()
  }

  const unread = notifications.filter((n) => !n.isRead)
  const read = notifications.filter((n) => n.isRead)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 flex items-center justify-center border transition-colors"
        style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unreadTotal > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-0.5"
            style={{ background: '#E53E3E', color: 'white', fontSize: '10px', fontFamily: 'Arial' }}
          >
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close notifications overlay"
          className="fixed inset-0 z-40 cursor-default border-0 p-0"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 'min(400px, 95vw)',
          background: 'var(--a-surface)',
          borderLeft: '1px solid var(--a-border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--a-border)' }}
        >
          <div className="flex items-center gap-2">
            <h2
              className="font-semibold text-base"
              style={{ color: 'var(--a-text)', fontFamily: 'var(--font-display)' }}
            >
              Notifications
            </h2>
            {unreadTotal > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: '#E53E3E', color: 'white' }}
              >
                {unreadTotal} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 px-2 py-1 text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--a-gold)', fontFamily: 'var(--font-body)' }}
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: 'var(--a-text-muted)' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Bell size={28} style={{ color: 'var(--a-text-muted)', opacity: 0.3 }} />
              <p
                className="text-sm"
                style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
              >
                No notifications yet
              </p>
            </div>
          ) : (
            <>
              {unread.length > 0 && (
                <>
                  <div
                    className="px-5 py-2"
                    style={{ background: 'var(--a-bg)', borderBottom: '1px solid var(--a-border)' }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
                    >
                      New
                    </p>
                  </div>
                  {unread.map((n) => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </>
              )}

              {read.length > 0 && (
                <>
                  <div
                    className="px-5 py-2"
                    style={{
                      background: 'var(--a-bg)',
                      borderBottom: '1px solid var(--a-border)',
                      borderTop: unread.length > 0 ? '1px solid var(--a-border)' : 'none',
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
                    >
                      Earlier
                    </p>
                  </div>
                  {read.slice(0, 30).map((n) => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function NotifItem({
  n,
  onMarkRead,
  onDismiss,
  onClose,
}: {
  n: AdminNotificationRow
  onMarkRead: (id: string) => void
  onDismiss: (id: string, e: React.MouseEvent) => void
  onClose: () => void
}) {
  return (
    <div
      className="flex items-stretch border-b group transition-colors"
      style={{
        borderColor: 'var(--a-border)',
        background: n.isRead ? 'transparent' : 'rgba(201,168,76,0.06)',
      }}
    >
      <Link
        href={n.link}
        className="flex flex-1 items-start gap-3 px-5 py-3 min-w-0"
        onClick={() => {
          if (!n.isRead) void onMarkRead(n.id)
          onClose()
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
          style={{ background: 'var(--a-bg)' }}
        >
          {TYPE_ICONS[n.type] ?? '🔔'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: 'var(--a-text)', fontFamily: 'var(--font-body)' }}
            >
              {n.title}
            </p>
            {!n.isRead && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--a-gold)' }}
              />
            )}
          </div>
          {n.body ? (
            <p
              className="text-xs line-clamp-2"
              style={{ color: 'var(--a-text-muted)', fontFamily: 'var(--font-body)' }}
            >
              {n.body}
            </p>
          ) : null}
          <p
            className="text-[10px] mt-1"
            style={{ color: 'var(--a-text-muted)', opacity: 0.6, fontFamily: 'var(--font-body)' }}
          >
            {timeAgo(n.createdAt)}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => onDismiss(n.id, e)}
        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 shrink-0 flex items-center self-stretch border-l"
        style={{ color: 'var(--a-text-muted)', borderColor: 'var(--a-border)' }}
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}
