import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getPaystackCredentials } from '@/lib/credentials'
import { ensureDefaultEventFields } from '@/lib/event-form-fields'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SingleEventClient } from '@/components/events/SingleEventClient'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await db.event.findFirst({
    where: {
      OR: [{ slug: params.slug }, { id: params.slug }],
    },
  })

  if (!event) {
    return {
      title: 'Event — Room For You',
      description: 'A Room For You community gathering.',
    }
  }

  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return {
    title: `${event.title} — Room For You`,
    description:
      event.description ??
      `Join Room For You for ${event.title}${event.city ? ` in ${event.city}` : ''}${eventDate ? ` on ${eventDate}` : ''}. Free to attend.`,
    openGraph: {
      title: event.title,
      description: event.description ?? `A Room For You gathering in ${event.city ?? 'your city'}.`,
      images: event.imageUrl
        ? [{ url: event.imageUrl, width: 1200, height: 630 }]
        : [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
      url: `https://rfyglobal.org/events/${params.slug}`,
      type: 'website',
    },
    alternates: { canonical: `https://rfyglobal.org/events/${params.slug}` },
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

  const [otherEvents, fields, paystack] = await Promise.all([
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
    getPaystackCredentials(),
  ])

  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description ?? `A Room For You community gathering in ${event.city ?? 'your city'}.`,
    startDate: event.date?.toISOString(),
    location: {
      '@type': 'Place',
      name: event.venue ?? event.city ?? 'TBD',
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city ?? '',
        addressCountry: 'NG',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Room For You',
      url: 'https://rfyglobal.org',
    },
    performer: {
      '@type': 'Person',
      name: 'Minister Yadah',
    },
    image: event.imageUrl ?? DEFAULT_OG_IMAGE,
    url: `https://rfyglobal.org/events/${event.slug ?? event.id}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
      url: `https://rfyglobal.org/events/${event.slug ?? event.id}`,
    },
  }

  return (
    <>
      <Navbar />
      <JsonLd data={eventSchema} />
      <SingleEventClient
        event={event}
        otherEvents={otherEvents}
        fields={fields}
        paystackEnabled={paystack?.isActive ?? false}
      />
      <Footer />
    </>
  )
}
