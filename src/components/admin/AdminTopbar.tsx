'use client'

import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import Link from 'next/link'

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/blog': 'Blog & Devotionals',
  '/admin/study': 'Study Portal',
  '/admin/events': 'Events',
  '/admin/gallery': 'Gallery',
  '/admin/forms': 'Forms',
  '/admin/cms': 'Site CMS',
  '/admin/integrations': 'Integrations',
  '/admin/partner': 'Partnership',
  '/admin/demo': 'Demo Data',
  '/admin/scripture': 'Daily Scripture',
}

interface AdminTopbarProps {
  toggleTheme: () => void
  theme: 'light' | 'dark'
}

export function AdminTopbar({ toggleTheme, theme }: AdminTopbarProps) {
  const pathname = usePathname()
  const title = Object.entries(PAGE_TITLES)
    .reverse()
    .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin'

  return (
    <header
      className="flex items-center justify-between px-6 lg:px-8 shrink-0 border-b"
      style={{
        height: '60px',
        background: 'var(--a-surface)',
        borderColor: 'var(--a-border)',
        boxShadow: 'var(--a-shadow)',
      }}
    >
      <h1
        className="font-display text-lg font-semibold"
        style={{ color: 'var(--a-text)' }}
      >
        {title}
      </h1>

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

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-body text-xs font-bold"
          style={{
            background: 'var(--a-gold)',
            color: 'var(--a-text-inverse)',
          }}
        >
          AD
        </div>
      </div>
    </header>
  )
}
