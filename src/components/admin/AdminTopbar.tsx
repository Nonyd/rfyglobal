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
}

export function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const title =
    Object.entries(pageTitles)
      .reverse()
      .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin'

  return (
    <header
      className="border-b px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between shrink-0 gap-4"
      style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0A0A0A' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="p-2 -ml-2 text-white/60 hover:text-gold lg:hidden"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>
        <h1 className="font-display text-xl text-white truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        <span className="text-xs text-white/40 font-body tracking-wide hidden sm:inline">
          Room For You
        </span>
      </div>
    </header>
  )
}
