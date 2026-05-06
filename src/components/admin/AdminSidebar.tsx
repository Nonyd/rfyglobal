'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  GraduationCap,
  Calendar,
  Images,
  ClipboardList,
  Settings2,
  Plug,
  Heart,
  Database,
  LogOut,
  Users,
  Zap,
  UserCog,
  History,
} from 'lucide-react'
import { canAccess } from '@/lib/permissions'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

type NavGroup = { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Members', href: '/admin/members', icon: Users },
      { label: 'Activity', href: '/admin/activity', icon: History },
    ],
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
      { label: 'Automation', href: '/admin/automation', icon: Zap },
      { label: 'Integrations', href: '/admin/integrations', icon: Plug },
      { label: 'Partnership', href: '/admin/partner', icon: Heart },
      { label: 'Demo Data', href: '/admin/demo', icon: Database },
      { label: 'Users', href: '/admin/users', icon: UserCog },
    ],
  },
]

function navItemVisible(item: NavItem, userRole: string): boolean {
  if (item.href === '/admin') return true
  if (item.href === '/admin/users') return userRole === 'SUPER_ADMIN'
  const moduleKey = item.href.replace('/admin/', '').split('/')[0]
  return canAccess(userRole, moduleKey)
}

interface AdminSidebarProps {
  theme: 'light' | 'dark'
  userRole: string
}

export function AdminSidebar({ theme, userRole }: AdminSidebarProps) {
  const pathname = usePathname()

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => navItemVisible(item, userRole)),
  })).filter((group) => group.items.length > 0)

  return (
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 border-r overflow-y-auto"
      style={{
        background: 'var(--a-sidebar)',
        borderColor: 'var(--a-border)',
      }}
    >
      <div className="p-5 border-b" style={{ borderColor: 'var(--a-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center rounded"
            style={{ background: theme === 'dark' ? 'var(--a-gold-active)' : 'var(--a-border)' }}
          >
            <Image
              src={theme === 'dark' ? '/images/logo-white.png' : '/images/logo-mark-dark.png'}
              alt="RFY"
              width={24}
              height={24}
              className="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <div>
            <p className="font-display text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
              Room For You
            </p>
            <p
              className="font-body text-[10px] uppercase tracking-widest"
              style={{ color: 'var(--a-text-muted)' }}
            >
              Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-6 pt-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p
              className="px-3 mb-1 text-[10px] font-body font-semibold tracking-[0.12em] uppercase"
              style={{ color: 'var(--a-text-muted)' }}
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
                    className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-body font-medium transition-all duration-150 group"
                    style={{
                      background: isActive ? 'var(--a-gold-active)' : 'transparent',
                      color: isActive ? 'var(--a-gold)' : 'var(--a-text-secondary)',
                      borderLeft: isActive ? '2px solid var(--a-gold)' : '2px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--a-sidebar-hover)'
                        e.currentTarget.style.color = 'var(--a-text)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--a-text-secondary)'
                      }
                    }}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--a-border)' }}>
        <div className="flex items-center justify-between">
          <p
            className="font-body text-xs truncate flex-1 mr-2"
            style={{ color: 'var(--a-text-muted)' }}
          >
            admin@rfyglobal.org
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="p-1.5 rounded transition-colors"
            title="Sign out"
            style={{ color: 'var(--a-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
