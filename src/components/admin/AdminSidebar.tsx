'use client'

import Link from 'next/link'
import Image from 'next/image'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Scripture', href: '/admin/scripture', icon: BookOpen },
  { label: 'Forms', href: '/admin/forms', icon: ClipboardList },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Study', href: '/admin/study', icon: GraduationCap },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Gallery', href: '/admin/gallery', icon: Images },
  { label: 'Site CMS', href: '/admin/cms', icon: Settings2 },
  { label: 'Partnership', href: '/admin/partner', icon: Heart },
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
      <div
        className="p-6 border-b"
        style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#0A0A0A' }}
      >
        <Image
          src="/images/logo-white.svg"
          alt="Room For You"
          width={100}
          height={32}
          className="h-8 w-auto"
        />
        <p
          className="text-[10px] tracking-widest uppercase mt-2 font-body"
          style={{ color: 'rgba(201,168,76,0.6)' }}
        >
          Admin Dashboard
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-all duration-200 border-l-2',
                isActive
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-red-brand transition-colors w-full"
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
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          'flex flex-col w-64 shrink-0 border-r z-50 transition-transform duration-200 ease-out',
          'fixed inset-y-0 left-0 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          borderColor: 'rgba(201,168,76,0.15)',
          background: '#0A0A0A',
        }}
      >
        <div className="flex items-center justify-end p-2 lg:hidden border-b border-white/10">
          <button
            type="button"
            onClick={onMobileClose}
            className="p-2 text-white/50 hover:text-white"
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
