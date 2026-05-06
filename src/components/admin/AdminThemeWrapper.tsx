'use client'

import { useAdminTheme } from '@/hooks/useAdminTheme'
import { AdminDashboardShell } from './AdminDashboardShell'

export function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, mounted } = useAdminTheme()

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
      <AdminDashboardShell toggleTheme={toggleTheme} theme={theme}>
        {children}
      </AdminDashboardShell>
    </div>
  )
}
