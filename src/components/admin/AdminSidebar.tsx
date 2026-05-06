'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
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
import { BrandLogo } from '@/components/brand/BrandLogo'

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

  const nav = (
    <>
      <div className="border-b px-5 py-6" style={{ borderColor: 'var(--admin-border)' }}>
        <BrandLogo variant="onLight" width={152} height={48} href={null} className="block" />
        <p
          className="mt-3 font-body text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          Admin Dashboard
        </p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="mb-2 px-3 font-body text-[10px] uppercase tracking-[0.2em]"
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
                      'flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-sm font-body transition-all duration-200',
                      isActive ? 'border-gold bg-[var(--admin-gold-light)] text-gold' : 'border-transparent',
                    )}
                    style={isActive ? undefined : { color: 'var(--admin-text-muted)' }}
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

      <div className="border-t p-4" style={{ borderColor: 'var(--admin-border)' }}>
        <p className="mb-3 px-3 font-body text-xs" style={{ color: 'var(--admin-text-muted)' }}>
          admin@rfyglobal.org
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-red-brand/10 hover:text-red-brand"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          <LogOut size={16} />
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
