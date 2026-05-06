import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SingleEventClient } from '@/components/events/SingleEventClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await db.event.findUnique({
    where: { slug: params.slug, isActive: true },
  })
  return {
    title: event ? `${event.title} — Room For You` : 'Event',
    description: event?.description ?? undefined,
    openGraph: event?.imageUrl ? { images: [event.imageUrl] } : undefined,
  }
}

export default async function SingleEventPage({
  params,
}: {
  params: { slug: string }
}) {
  const event = await db.event.findUnique({
    where: { slug: params.slug, isActive: true },
  })

  if (!event) notFound()

  const otherEvents = await db.event.findMany({
    where: {
      isActive: true,
      date: { gte: new Date() },
      id: { not: event.id },
    },
    orderBy: { date: 'asc' },
    take: 3,
  })

  return (
    <>
      <Navbar />
      <SingleEventClient event={event} otherEvents={otherEvents} />
      <Footer />
    </>
  )
}
