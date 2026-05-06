import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { EventsClientPage } from '@/components/events/EventsClientPage'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events — Room For You',
  description: 'Upcoming Room For You community meetings across cities.',
}

export default async function EventsPage() {
  const events = await db.event.findMany({
    where: { isActive: true, date: { gte: new Date() } },
    orderBy: { date: 'asc' },
  })

  const cities = Array.from(new Set(events.map((e) => e.city))).sort()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pb-16 pt-24">
        <div className="mx-auto mb-16 max-w-7xl px-6 text-center">
          <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Room For You</p>
          <h1 className="mb-4 font-display text-4xl text-white lg:text-6xl">Events</h1>
          <p className="mx-auto max-w-xl font-body text-white/50">
            Monthly physical meetings across cities. Come as you are.
          </p>
          <div className="mx-auto mt-8 h-px max-w-xs bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <EventsClientPage events={events} cities={cities} />
      </main>
      <Footer />
    </>
  )
}
