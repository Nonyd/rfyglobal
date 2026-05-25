import { Hero } from '@/components/landing/Hero'
import { ScriptureStrip } from '@/components/landing/ScriptureStrip'
import { StatsSection } from '@/components/landing/StatsSection'
import { VisionSection } from '@/components/landing/VisionSection'
import { ConfessionReveal } from '@/components/landing/ConfessionReveal'
import { FromTheShepherd } from '@/components/landing/FromTheShepherd'
import { CommunityHighlights } from '@/components/landing/CommunityHighlights'
import { HomeGallerySlide } from '@/components/landing/HomeGallerySlide'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/layout/Footer'
import { getContentMany } from '@/lib/content'
import { HOME_CMS_KEYS } from '@/lib/cms-keys'
import { getHomeGallerySlides } from '@/lib/gallery-home'
import { getPageMetadata } from '@/lib/cms-metadata'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Room For You — A Christian Community with Minister Yadah',
    'Room For You is a global Christian community founded by Minister Yadah. Monthly gatherings in Abuja, Lagos, and cities worldwide. Worship. Prayer. Bible Study. There is room for you.',
    '/',
  )
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [content, gallerySlides] = await Promise.all([
    getContentMany([...HOME_CMS_KEYS]),
    getHomeGallerySlides(),
  ])

  return (
    <main>
      <Hero content={content} />
      <ScriptureStrip />
      {content['stats.enabled'] !== 'false' ? <StatsSection content={content} /> : null}
      <VisionSection content={content} />
      <ConfessionReveal content={content} />
      <FromTheShepherd content={content} />
      <CommunityHighlights content={content} />
      <HomeGallerySlide slides={gallerySlides} content={content} />
      <CTASection content={content} />
      <Footer />
    </main>
  )
}
