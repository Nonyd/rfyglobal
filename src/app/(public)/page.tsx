import { Hero } from '@/components/landing/Hero'
import { FeaturedEvent } from '@/components/landing/FeaturedEvent'
import { ScriptureStrip } from '@/components/landing/ScriptureStrip'
import { StatsSection } from '@/components/landing/StatsSection'
import { VisionSection } from '@/components/landing/VisionSection'
import { ConfessionReveal } from '@/components/landing/ConfessionReveal'
import { FromTheShepherd } from '@/components/landing/FromTheShepherd'
import { CommunityHighlights } from '@/components/landing/CommunityHighlights'
import { GalleryStrip } from '@/components/landing/GalleryStrip'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/layout/Footer'
import { getContentMany } from '@/lib/content'
import { HOME_CMS_KEYS } from '@/lib/cms-keys'
import { db } from '@/lib/db'
import { getPageMetadata } from '@/lib/cms-metadata'
import { ensureDefaultEventFields } from '@/lib/event-form-fields'
import { getPaystackCredentials } from '@/lib/credentials'
import type { Metadata } from 'next'
import type { EventFormField } from '@prisma/client'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Room For You — A Christian Community with Minister Yadah',
    'Room For You is a global Christian community founded by Minister Yadah. Monthly gatherings in Abuja, Lagos, and cities worldwide. Worship. Prayer. Bible Study. There is room for you.',
    '/',
  )
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const now = new Date()

  const [content, galleryImages, nextEvent] = await Promise.all([
    getContentMany([...HOME_CMS_KEYS]),
    db.galleryImage
      .findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        take: 14,
        select: { id: true, url: true, caption: true },
      })
      .catch(() => []),
    db.event
      .findFirst({
        where: {
          isActive: true,
          date: { gte: now },
        },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          time: true,
          city: true,
          venue: true,
          imageUrl: true,
          slug: true,
          registrationFeeNgn: true,
          registrationFeeUsd: true,
        },
      })
      .catch(() => null),
  ])

  let registrationFields: EventFormField[] = []
  let paystackEnabled = false
  if (nextEvent) {
    await ensureDefaultEventFields(nextEvent.id)
    const [fields, paystack] = await Promise.all([
      db.eventFormField.findMany({
        where: { eventId: nextEvent.id, isActive: true },
        orderBy: { order: 'asc' },
      }),
      getPaystackCredentials(),
    ])
    registrationFields = fields
    paystackEnabled = paystack?.isActive ?? false
  }

  return (
    <main>
      <Hero content={content} />
      <ScriptureStrip />
      {nextEvent ? (
        <FeaturedEvent
          event={nextEvent}
          fields={registrationFields}
          paystackEnabled={paystackEnabled}
        />
      ) : null}
      {content['stats.enabled'] !== 'false' ? <StatsSection content={content} /> : null}
      <VisionSection content={content} />
      <ConfessionReveal content={content} />
      <FromTheShepherd content={content} />
      <CommunityHighlights content={content} />
      <GalleryStrip
        images={galleryImages}
        eyebrow={content['landing.gallery.eyebrow'] || 'Gallery'}
        titleBefore={content['landing.gallery.title'] || 'Moments from'}
        titleItalic={content['landing.gallery.titleAccent'] || 'our gatherings'}
        ctaHref="/gallery"
        ctaLabel={content['landing.gallery.cta'] || 'View all photos'}
      />
      <CTASection content={content} />
      <Footer />
    </main>
  )
}
