'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { Toaster } from 'react-hot-toast'

interface AdminDashboardShellProps {
  children: React.ReactNode
  toggleTheme: () => void
  theme: 'light' | 'dark'
  userRole: string
}

export function AdminDashboardShell({
  children,
  toggleTheme,
  theme,
  userRole,
}: AdminDashboardShellProps) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <AdminSidebar theme={theme} userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AdminTopbar toggleTheme={toggleTheme} theme={theme} />
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ background: 'var(--a-bg)' }}
        >
          {children}
        </main>
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--a-surface)',
            color: 'var(--a-text)',
            border: '1px solid var(--a-gold-border)',
            fontFamily: 'General Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#C9A84C', secondary: 'var(--a-bg)' } },
          error: { iconTheme: { primary: 'var(--a-red)', secondary: '#FFFFFF' } },
        }}
      />
    </div>
  )
}
