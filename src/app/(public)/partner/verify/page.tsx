import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PaymentVerifyContent } from '@/components/partnership/PaymentVerifyContent'

export default function PaymentVerifyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <Suspense
          fallback={
            <div className="max-w-lg w-full text-center py-24">
              <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-body text-white/50 mt-6">Loading…</p>
            </div>
          }
        >
          <PaymentVerifyContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
