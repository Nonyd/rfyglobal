import { Suspense } from 'react'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { PaymentVerifyContent } from '@/components/partnership/PaymentVerifyContent'

export default function PaymentVerifyPage() {
  return (
    <PublicPageShell mainClassName="flex min-h-[calc(100vh-4rem)] items-center justify-center pb-16 pt-6">
      <Suspense
        fallback={
          <div className="w-full max-w-lg py-24 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="mt-6 font-body text-text-secondary">Loading…</p>
          </div>
        }
      >
        <PaymentVerifyContent />
      </Suspense>
    </PublicPageShell>
  )
}
