import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function UnsubscribedPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="label-text mb-6">Room For You</p>
          <h1 className="font-display text-4xl text-snow mb-4">Unsubscribed</h1>
          <div className="gold-line max-w-[80px] mx-auto mb-6 opacity-40" />
          <p className="font-body text-mist leading-relaxed">
            You have been unsubscribed from Room For You emails. You can re-join the community at any time.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
