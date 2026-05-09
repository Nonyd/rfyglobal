'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Bell, Menu, X, CheckCheck, ArrowRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import { AdminMobileDrawer } from './AdminMobileDrawer'

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/notifications': 'Notifications',
  '/admin/blog': 'Blog & Devotionals',
  '/admin/study': 'Study Portal',
  '/admin/events': 'Events',
  '/admin/gallery': 'Gallery',
  '/admin/forms': 'Forms',
  '/admin/members': 'Community Members',
  '/admin/automation': 'Automation',
  '/admin/cms': 'Site CMS',
  '/admin/integrations': 'Integrations',
  '/admin/partner': 'Partnership',
  '/admin/demo': 'Demo Data',
  '/admin/scripture': 'Daily Scripture',
  '/admin/prayer': 'Prayer Requests',
  '/admin/testimonies': 'Testimonies',
  '/admin/messages': 'Messages',
}

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

interface AdminTopbarProps {
  toggleTheme: () => void
  theme: 'light' | 'dark'
}

export function AdminTopbar({ toggleTheme, theme }: AdminTopbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const title =
    Object.entries(PAGE_TITLES)
      .reverse()
      .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin'

  const [panelOpen, setPanelOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const userName = session?.user?.name?.trim() || session?.user?.email?.split('@')[0] || 'Admin'
  const userEmail = session?.user?.email ?? ''
  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'AD'

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadTotal(data.total ?? 0)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    const es = new EventSource('/api/admin/notifications/stream')

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'notification') {
          fetchNotifications()
        }
      } catch {
        /* ignore */
      }
    }

    return () => {
      es.close()
    }
  }, [fetchNotifications])

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadTotal(0)
    await fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadTotal((prev) => Math.max(0, prev - 1))
  }

  const dismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/admin/notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await fetchNotifications()
  }

  const unread = notifications.filter((n) => !n.isRead)
  const read = notifications.filter((n) => n.isRead)

  return (
    <>
      <header
        className="flex items-center justify-between px-4 lg:px-8 shrink-0 border-b"
        style={{
          height: '60px',
          background: 'var(--a-surface)',
          borderColor: 'var(--a-border)',
          boxShadow: 'var(--a-shadow)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden flex items-center justify-center w-8 h-8 border transition-all"
            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
            aria-label="Open navigation"
          >
            <Menu size={16} />
          </button>
          <h1 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="https://rfyglobal.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 font-body text-xs transition-colors px-3 py-1.5 rounded border"
            style={{
              color: 'var(--a-text-muted)',
              borderColor: 'var(--a-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--a-gold)'
              e.currentTarget.style.borderColor = 'var(--a-gold-border)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--a-text-muted)'
              e.currentTarget.style.borderColor = 'var(--a-border)'
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              style={{ boxShadow: '0 0 4px #22c55e' }}
            />
            rfyglobal.org ↗
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="relative w-9 h-9 flex items-center justify-center border transition-all"
              style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
              title="Notifications"
            >
              <Bell size={15} />
              {unreadTotal > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-body font-bold px-1"
                  style={{ background: '#E53E3E', color: 'white', fontSize: '10px' }}
                >
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded border transition-all"
            style={{
              background: 'var(--a-surface)',
              borderColor: 'var(--a-border)',
              color: 'var(--a-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--a-gold-border)'
              e.currentTarget.style.color = 'var(--a-gold)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--a-border)'
              e.currentTarget.style.color = 'var(--a-text-secondary)'
            }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div className="flex items-center gap-2">
            <div
              className="hidden md:flex flex-col text-right min-w-0"
              style={{ color: 'var(--a-text-muted)' }}
            >
              <span className="font-body text-[11px] font-medium truncate" style={{ color: 'var(--a-text)' }}>
                {userName}
              </span>
              {userEmail ? <span className="font-body text-[10px] truncate">{userEmail}</span> : null}
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-body text-xs font-bold"
              style={{
                background: 'var(--a-gold)',
                color: 'var(--a-text-inverse)',
              }}
              title={userName}
            >
              {initials}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
              style={{
                width: 'min(420px, 95vw)',
                background: 'var(--a-surface)',
                borderLeft: '1px solid var(--a-border)',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--a-border)' }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
                    Notifications
                  </h2>
                  {unreadTotal > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full font-body text-xs font-bold"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 font-body text-xs transition-all"
                      style={{ color: 'var(--a-gold)' }}
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="w-8 h-8 flex items-center justify-center transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Bell size={32} style={{ color: 'var(--a-text-muted)', opacity: 0.4 }} />
                    <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div>
                    {unread.length > 0 && (
                      <div>
                        <div
                          className="px-5 py-2 border-b"
                          style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}
                        >
                          <p
                            className="font-body text-[10px] uppercase tracking-widest font-semibold"
                            style={{ color: 'var(--a-text-muted)' }}
                          >
                            New
                          </p>
                        </div>
                        {TYPE_ORDER.map((type) => {
                          const items = unread.filter((n) => n.type === type)
                          if (items.length === 0) return null
                          return (
                            <div key={type}>
                              <div
                                className="px-5 py-1.5 border-b"
                                style={{
                                  borderColor: 'var(--a-border)',
                                  background: 'var(--a-surface)',
                                }}
                              >
                                <p
                                  className="font-body text-[10px] font-semibold uppercase tracking-wide"
                                  style={{ color: 'var(--a-gold)' }}
                                >
                                  {TYPE_LABELS[type] ?? type}
                                </p>
                              </div>
                              {items.map((n) => (
                                <NotificationItem
                                  key={n.id}
                                  notification={n}
                                  onMarkRead={markRead}
                                  onDismiss={dismiss}
                                  onNavigate={() => setPanelOpen(false)}
                                />
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {read.length > 0 && (
                      <div>
                        <div
                          className="px-5 py-2 border-b border-t"
                          style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}
                        >
                          <p
                            className="font-body text-[10px] uppercase tracking-widest font-semibold"
                            style={{ color: 'var(--a-text-muted)' }}
                          >
                            Earlier
                          </p>
                        </div>
                        {read.slice(0, 20).map((n) => (
                          <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={markRead}
                            onDismiss={dismiss}
                            onNavigate={() => setPanelOpen(false)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AdminMobileDrawer isOpen={mobileNavOpen} onClose={closeMobileNav} />
    </>
  )
}

function NotificationItem({
  notification: n,
  onMarkRead,
  onDismiss,
  onNavigate,
}: {
  notification: NotificationRow
  onMarkRead: (id: string) => void
  onDismiss: (id: string, e: React.MouseEvent) => void
  onNavigate: () => void
}) {
  return (
    <Link
      href={n.link}
      onClick={() => {
        if (!n.isRead) void onMarkRead(n.id)
        onNavigate()
      }}
      className="flex items-start gap-3 px-5 py-4 border-b group transition-all"
      style={{
        borderColor: 'var(--a-border)',
        background: n.isRead ? 'transparent' : 'var(--a-gold-light)',
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
        style={{ background: 'var(--a-bg)' }}
      >
        {TYPE_ICONS[n.type] ?? '🔔'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-body text-xs font-semibold" style={{ color: 'var(--a-text)' }}>
            {n.title}
          </p>
          {!n.isRead && (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--a-gold)' }} />
          )}
        </div>
        {n.body ? (
          <p className="font-body text-xs line-clamp-2" style={{ color: 'var(--a-text-muted)' }}>
            {n.body}
          </p>
        ) : null}
        <p className="font-body text-[10px] mt-1" style={{ color: 'var(--a-text-muted)', opacity: 0.7 }}>
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight size={13} style={{ color: 'var(--a-text-muted)' }} />
        <button
          type="button"
          onClick={(e) => onDismiss(n.id, e)}
          className="p-1 transition-colors"
          style={{ color: 'var(--a-text-muted)' }}
          title="Dismiss"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--a-red)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--a-text-muted)'
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </Link>
  )
}
