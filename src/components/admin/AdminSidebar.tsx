'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Calendar,
  Heart,
  LogOut,
  X,
  Images,
  Settings2,
  Plug,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Scripture', href: '/admin/scripture', icon: BookOpen },
      { label: 'Blog', href: '/admin/blog', icon: FileText },
      { label: 'Study', href: '/admin/study', icon: GraduationCap },
      { label: 'Events', href: '/admin/events', icon: Calendar },
      { label: 'Gallery', href: '/admin/gallery', icon: Images },
      { label: 'Forms', href: '/admin/forms', icon: ClipboardList },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Site CMS', href: '/admin/cms', icon: Settings2 },
      { label: 'Integrations', href: '/admin/integrations', icon: Plug },
      { label: 'Partnership', href: '/admin/partner', icon: Heart },
    ],
  },
]

export function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [logoFailed, setLogoFailed] = useState(false)

  const nav = (
    <>
      <div className="p-5 border-b" style={{ borderColor: 'var(--admin-border)' }}>
        {logoFailed ? (
          <span className="font-display text-lg" style={{ color: 'var(--admin-text)' }}>
            RFY
          </span>
        ) : (
          <Image
            src="/images/logo-mark-dark.png"
            alt="Room For You"
            width={48}
            height={48}
            className="h-10 w-auto object-contain"
            onError={() => setLogoFailed(true)}
          />
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="px-3 mb-2 text-[10px] font-body font-semibold tracking-[0.15em] uppercase"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onMobileClose?.()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-all duration-200 border-l-[3px]',
                      isActive ? '' : 'border-transparent',
                    )}
                    style={
                      isActive
                        ? {
                            color: 'var(--admin-gold)',
                            background: 'var(--admin-active-bg)',
                            borderLeft: '3px solid var(--admin-gold)',
                          }
                        : { color: 'var(--admin-text-secondary)' }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--admin-text)'
                        e.currentTarget.style.background = 'var(--admin-hover-bg)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--admin-text-secondary)'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--admin-border)' }}>
        <p className="text-xs font-body mb-3 truncate" style={{ color: 'var(--admin-text-secondary)' }}>
          {session?.user?.email}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-2 text-sm font-body w-full transition-colors"
          style={{ color: 'var(--admin-text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#D0021B'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--admin-text-muted)'
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          'z-50 flex w-[272px] shrink-0 flex-col border-r shadow-soft transition-transform duration-200 ease-out',
          'fixed inset-y-0 left-0 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{
          borderColor: 'var(--admin-border)',
          background: 'var(--admin-sidebar)',
        }}
      >
        <div className="flex items-center justify-end border-b p-2 lg:hidden" style={{ borderColor: 'var(--admin-border)' }}>
          <button
            type="button"
            onClick={onMobileClose}
            className="p-2"
            style={{ color: 'var(--admin-text-muted)' }}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        {nav}
      </aside>
    </>
  )
}
