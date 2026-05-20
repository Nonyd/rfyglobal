import type { Metadata } from 'next'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { EventsClientPage } from '@/components/events/EventsClientPage'
import { db } from '@/lib/db'
import { getContentMany } from '@/lib/content'
import { getPageMetadata, pageHeaderFromContent } from '@/lib/cms-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Events — Gospel Gatherings with Room For You',
    'Monthly gospel community gatherings hosted by Room For You with Minister Yadah. Physical meetings across Abuja, Lagos, and cities worldwide. Free to attend — come as you are.',
    '/events',
  )
}

export default async function EventsPage() {
  const [events, cms] = await Promise.all([
    db.event.findMany({
    where: { isActive: true, date: { gte: new Date() } },
    orderBy: { date: 'asc' },
  }),
    getContentMany(['pages.events.eyebrow', 'pages.events.title', 'pages.events.subtitle']),
  ])

  const cities = Array.from(new Set(events.map((e) => e.city))).sort()
  const header = pageHeaderFromContent(cms, 'events')

  return (
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader {...header} />

      <EventsClientPage events={events} cities={cities} />
    </PublicPageShell>
  )
}
