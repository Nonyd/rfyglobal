import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { EventPaymentVerifyContent } from '@/components/events/EventPaymentVerifyContent'

export default function EventPaymentVerifyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void px-4 pb-24 pt-28">
        <Suspense
          fallback={
            <div className="mx-auto max-w-lg py-24 text-center font-body text-sm text-mist">
              Loading…
            </div>
          }
        >
          <EventPaymentVerifyContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
