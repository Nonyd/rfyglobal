import type { Metadata } from 'next'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { EventsClientPage } from '@/components/events/EventsClientPage'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events — Gospel Gatherings with Room For You',
  description:
    'Monthly gospel community gatherings hosted by Room For You with Minister Yadah. Physical meetings across Abuja, Lagos, and cities worldwide. Free to attend — come as you are.',
  alternates: { canonical: 'https://rfyglobal.org/events' },
  openGraph: {
    title: 'Gospel Events — Room For You with Minister Yadah',
    description: 'Monthly community gatherings across cities. Worship, prayer, and the Word. Free to attend.',
    url: 'https://rfyglobal.org/events',
  },
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
