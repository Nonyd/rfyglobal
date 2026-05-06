import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-gold-subtle p-8 bg-black-soft">
        <h1 className="font-display text-2xl text-gold mb-2 text-center">Admin sign in</h1>
        <p className="font-body text-white/50 text-sm text-center mb-8">
          Room For You — authorized access only
        </p>
        <Suspense
          fallback={
            <p className="font-body text-center text-white/50 text-sm">Loading sign-in…</p>
          }
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
