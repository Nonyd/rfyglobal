'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Menu } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { AdminMobileDrawer } from './AdminMobileDrawer'
import { NotificationBell } from './NotificationBell'

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
            href="https://rfyglobal.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 font-body text-xs transition-colors px-3 py-1.5 rounded border border-[var(--a-border)] text-[var(--a-text-muted)] hover:border-[var(--a-gold-border)] hover:text-[var(--a-gold)]"
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              style={{ boxShadow: '0 0 4px #22c55e' }}
            />
            rfyglobal.org ↗
          </Link>

          <NotificationBell />

          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded border transition-all bg-[var(--a-surface)] border-[var(--a-border)] text-[var(--a-text-secondary)] hover:border-[var(--a-gold-border)] hover:text-[var(--a-gold)]"
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

      <AdminMobileDrawer isOpen={mobileNavOpen} onClose={closeMobileNav} />
    </>
  )
}
