'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/scripture': 'Daily Scripture',
  '/admin/forms': 'Form Builder',
  '/admin/blog': 'Blog & Devotionals',
  '/admin/study': 'Study Portal',
  '/admin/events': 'Events',
  '/admin/partner': 'Partnership',
  '/admin/gallery': 'Gallery',
  '/admin/integrations': 'Integrations',
  '/admin/cms': 'Site CMS',
}

export function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const title =
    Object.entries(pageTitles)
      .reverse()
      .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin'

  return (
    <header
      className="flex h-[4.25rem] shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6 lg:px-8"
      style={{
        borderColor: 'var(--admin-border)',
        background: 'var(--admin-surface)',
        boxShadow: 'var(--admin-shadow-card)',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="-ml-2 rounded-md p-2 lg:hidden"
          style={{ color: 'var(--admin-text-muted)' }}
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>
        <h1 className="truncate font-display text-xl sm:text-2xl" style={{ color: 'var(--admin-text)' }}>
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <a
          href="https://rfyglobal.org"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
          <span className="font-body text-xs tracking-wide" style={{ color: 'var(--admin-text-muted)' }}>
            Live site
          </span>
        </a>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full font-body text-sm font-semibold text-white shadow-soft"
          style={{ background: 'var(--admin-gold)' }}
        >
          AD
        </div>
      </div>
    </header>
  )
}
