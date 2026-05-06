import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { BrandLogo } from '@/components/brand/BrandLogo'

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-6 py-16">
      <div className="mb-10">
        <BrandLogo variant="onDark" width={200} height={64} href="/" priority />
      </div>
      <div className="admin-card w-full max-w-md border border-gold-subtle/40 bg-black-soft p-8 md:p-10">
        <h1 className="mb-2 text-center font-display text-2xl text-gold">Admin sign in</h1>
        <p className="mb-8 text-center font-body text-sm text-cream/55">Room For You — authorized access only</p>
        <Suspense
          fallback={<p className="text-center font-body text-sm text-cream/50">Loading sign-in…</p>}
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
