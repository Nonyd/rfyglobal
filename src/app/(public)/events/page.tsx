import type { Metadata } from 'next'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
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
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader
        eyebrow="Room For You"
        title="Events"
        subtitle="Monthly physical meetings across cities. Come as you are."
      />

      <EventsClientPage events={events} cities={cities} />
    </PublicPageShell>
  )
}
