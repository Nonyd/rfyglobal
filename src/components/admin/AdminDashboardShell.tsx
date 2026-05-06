'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { Toaster } from 'react-hot-toast'

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
        <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopbar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid var(--admin-border)',
            fontFamily: 'General Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#D4A847', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#D0021B', secondary: '#FFFFFF' } },
        }}
      />
    </>
  )
}
