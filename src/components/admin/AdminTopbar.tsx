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
      className="flex items-center justify-between px-6 lg:px-8 border-b"
      style={{
        height: '64px',
        background: 'var(--admin-surface)',
        borderColor: 'var(--admin-border)',
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
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--admin-text)' }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="https://rfyglobal.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-body transition-colors"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          rfyglobal.org
        </a>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-body font-bold text-white"
          style={{ background: 'var(--admin-gold)' }}
        >
          AD
        </div>
      </div>
    </header>
  )
}
