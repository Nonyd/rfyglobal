'use client'

import { useSession } from 'next-auth/react'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { AdminDashboardShell } from './AdminDashboardShell'

export function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, mounted } = useAdminTheme()
  const { data: session } = useSession()
  const userRole = session?.user?.role ?? 'ADMIN'

  if (!mounted) {
    return (
      <div className="admin-layout flex h-screen" style={{ background: 'var(--a-bg)' }}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`admin-layout${theme === 'dark' ? ' admin-dark' : ''} flex h-screen overflow-hidden`}
      style={{ background: 'var(--a-bg)' }}
    >
      <AdminDashboardShell toggleTheme={toggleTheme} theme={theme} userRole={userRole}>
        {children}
      </AdminDashboardShell>
    </div>
  )
}
