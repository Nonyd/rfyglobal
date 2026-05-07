import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <div
      className="admin-layout min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--a-bg)' }}
    >
      <div className="mb-10 flex w-full max-w-sm flex-col items-center gap-4">
        <Image
          src="/images/logo-dark.png"
          alt="Room For You"
          width={240}
          height={120}
          className="mx-auto h-28 w-auto object-contain"
          priority
        />
        <Link
          href="/"
          className="font-body text-sm tracking-wide transition-opacity hover:opacity-80"
          style={{ color: 'var(--a-gold)' }}
        >
          ← Back to website
        </Link>
      </div>

      <div
        className="w-full max-w-sm p-8 border rounded-sm"
        style={{
          background: 'var(--a-surface)',
          borderColor: 'var(--a-border)',
          boxShadow: 'var(--a-shadow-md)',
        }}
      >
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
