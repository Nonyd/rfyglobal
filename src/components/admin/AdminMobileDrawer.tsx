'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, LogOut, Moon, Sun } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { NAV_GROUPS, navItemVisible } from './AdminSidebar'

interface AdminMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminMobileDrawer({ isOpen, onClose }: AdminMobileDrawerProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useAdminTheme()
  const { data: session } = useSession()
  const userRole = session?.user?.role ?? 'ADMIN'

  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => navItemVisible(item, userRole)),
  })).filter((group) => group.items.length > 0)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="admin-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            key="admin-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 lg:hidden flex flex-col"
            style={{
              width: 'min(280px, 85vw)',
              background: 'var(--a-surface)',
              borderRight: '1px solid var(--a-border)',
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--a-border)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme === 'dark' ? '/images/logo-white.png' : '/images/logo-dark.png'}
                alt="Room For You"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {visibleGroups.map((section) => (
                <div key={section.label} className="mb-4">
                  <p
                    className="px-3 mb-1 font-body text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.href, item.exact)
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2.5 font-body text-sm transition-all"
                          style={{
                            background: active ? 'var(--a-gold-active)' : 'transparent',
                            color: active ? 'var(--a-gold)' : 'var(--a-text-secondary)',
                            borderLeft: active ? '2px solid var(--a-gold)' : '2px solid transparent',
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

            <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: 'var(--a-border)' }}>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2.5 font-body text-sm transition-all"
                style={{ color: 'var(--a-text-secondary)' }}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex items-center gap-3 w-full px-3 py-2.5 font-body text-sm transition-all"
                style={{ color: 'var(--a-text-muted)' }}
              >
                <LogOut size={15} />
                Sign Out
              </button>

              {session?.user && (
                <div
                  className="flex items-center gap-3 px-3 py-2 mt-2 border-t"
                  style={{ borderColor: 'var(--a-border)' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-body text-xs font-bold shrink-0"
                    style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
                  >
                    {session.user.name?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-xs font-medium truncate" style={{ color: 'var(--a-text)' }}>
                      {session.user.name ?? 'Admin'}
                    </p>
                    <p className="font-body text-[10px] truncate" style={{ color: 'var(--a-text-muted)' }}>
                      {session.user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
