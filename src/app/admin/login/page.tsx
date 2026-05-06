import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import Image from 'next/image'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: 'var(--admin-bg)' }}>
      <div className="w-full max-w-md p-8 border shadow-sm md:p-10" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo-mark-dark.png"
            alt="Room For You"
            width={60}
            height={60}
            className="h-14 w-auto"
          />
        </div>
        <h1 className="font-display text-2xl text-center mb-1 font-semibold" style={{ color: 'var(--admin-text)' }}>Admin Dashboard</h1>
        <p className="font-body text-sm text-center mb-8" style={{ color: 'var(--admin-text-muted)' }}>Sign in to manage Room For You</p>
        <Suspense
          fallback={<p className="text-center font-body text-sm" style={{ color: 'var(--admin-text-muted)' }}>Loading sign-in…</p>}
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
