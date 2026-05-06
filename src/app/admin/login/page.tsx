import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <div
      className="admin-layout min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--a-bg)' }}
    >
      <div
        className="w-full max-w-sm p-8 border rounded-sm"
        style={{
          background: 'var(--a-surface)',
          borderColor: 'var(--a-border)',
          boxShadow: 'var(--a-shadow-md)',
        }}
      >
        <div className="flex justify-center mb-8">
          <div
            className="w-14 h-14 rounded flex items-center justify-center"
            style={{ background: 'var(--a-gold-light)', border: '1px solid var(--a-gold-border)' }}
          >
            <span className="font-display text-xl font-bold" style={{ color: 'var(--a-gold)' }}>
              RFY
            </span>
          </div>
        </div>
        <h1 className="font-display text-2xl font-semibold text-center mb-1" style={{ color: 'var(--a-text)' }}>
          Welcome back
        </h1>
        <p className="font-body text-sm text-center mb-8" style={{ color: 'var(--a-text-muted)' }}>
          Sign in to manage Room For You
        </p>
        <Suspense
          fallback={<p className="text-center font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>Loading sign-in…</p>}
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
