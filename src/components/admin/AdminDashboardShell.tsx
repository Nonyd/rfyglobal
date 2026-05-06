'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { Toaster } from 'react-hot-toast'

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <div className="flex h-screen bg-black overflow-hidden">
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
            background: '#111',
            color: '#FAFAFA',
            border: '1px solid rgba(201,168,76,0.3)',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#0A0A0A' } },
          error: { iconTheme: { primary: '#D0021B', secondary: '#FAFAFA' } },
        }}
      />
    </>
  )
}
