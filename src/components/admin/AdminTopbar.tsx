'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sun, Moon, Bell, Menu } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { AdminMobileDrawer } from './AdminMobileDrawer'

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
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

interface AdminTopbarProps {
  toggleTheme: () => void
  theme: 'light' | 'dark'
}

export function AdminTopbar({ toggleTheme, theme }: AdminTopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const title =
    Object.entries(PAGE_TITLES)
      .reverse()
      .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin'

  const [notifications, setNotifications] = useState({
    prayers: 0,
    testimonies: 0,
    messages: 0,
    total: 0,
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const userName = session?.user?.name?.trim() || session?.user?.email?.split('@')[0] || 'Admin'
  const userEmail = session?.user?.email ?? ''
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/admin/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch {
        /* ignore */
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

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

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-8 h-8 flex items-center justify-center border transition-all relative"
            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
            title="Notifications"
          >
            <Bell size={14} />
            {notifications.total > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-body font-bold"
                style={{ background: 'var(--a-red)', color: 'white', fontSize: '9px' }}
              >
                {notifications.total > 9 ? '9+' : notifications.total}
              </span>
            )}
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 min-w-[200px] border py-2 shadow-lg"
              style={{
                background: 'var(--a-surface)',
                borderColor: 'var(--a-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left font-body text-xs hover:opacity-90"
                style={{ color: 'var(--a-text)' }}
                onClick={() => {
                  setMenuOpen(false)
                  router.push('/admin/prayer')
                }}
              >
                Prayer
                {notifications.prayers > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--a-red)', color: '#fff' }}>
                    {notifications.prayers}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left font-body text-xs hover:opacity-90"
                style={{ color: 'var(--a-text)' }}
                onClick={() => {
                  setMenuOpen(false)
                  router.push('/admin/testimonies')
                }}
              >
                Testimonies
                {notifications.testimonies > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--a-red)', color: '#fff' }}>
                    {notifications.testimonies}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left font-body text-xs hover:opacity-90"
                style={{ color: 'var(--a-text)' }}
                onClick={() => {
                  setMenuOpen(false)
                  router.push('/admin/messages')
                }}
              >
                Messages
                {notifications.messages > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--a-red)', color: '#fff' }}>
                    {notifications.messages}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <button
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
            {userEmail ? (
              <span className="font-body text-[10px] truncate">{userEmail}</span>
            ) : null}
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
      <AdminMobileDrawer isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  )
}
