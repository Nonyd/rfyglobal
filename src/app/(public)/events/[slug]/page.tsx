import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ensureDefaultEventFields } from '@/lib/event-form-fields'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SingleEventClient } from '@/components/events/SingleEventClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await db.event.findFirst({
    where: {
      isActive: true,
      OR: [{ slug: params.slug }, { id: params.slug }],
    },
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
  const event = await db.event.findFirst({
    where: {
      isActive: true,
      OR: [{ slug: params.slug }, { id: params.slug }],
    },
  })

  if (!event) notFound()

  await ensureDefaultEventFields(event.id)

  const [otherEvents, fields] = await Promise.all([
    db.event.findMany({
      where: {
        isActive: true,
        date: { gte: new Date() },
        id: { not: event.id },
      },
      orderBy: { date: 'asc' },
      take: 3,
    }),
    db.eventFormField.findMany({
      where: { eventId: event.id, isActive: true },
      orderBy: { order: 'asc' },
    }),
  ])

  return (
    <>
      <Navbar />
      <SingleEventClient event={event} otherEvents={otherEvents} fields={fields} />
      <Footer />
    </>
  )
}
