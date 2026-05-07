import { Hero } from '@/components/landing/Hero'
import { ScriptureStrip } from '@/components/landing/ScriptureStrip'
import { VisionSection } from '@/components/landing/VisionSection'
import { ConfessionReveal } from '@/components/landing/ConfessionReveal'
import { FromTheShepherd } from '@/components/landing/FromTheShepherd'
import { CommunityHighlights } from '@/components/landing/CommunityHighlights'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/layout/Footer'
import { getContentMany } from '@/lib/content'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const content = await getContentMany([
    'landing.vision.heading',
    'landing.vision.subheading',
    'landing.vision.text',
    'landing.cta.headline',
    'landing.cta.subtext',
    'landing.cta.button',
    'shepherd.quote',
    'shepherd.name',
    'shepherd.title',
    'shepherd.portrait',
    'shepherd.image',
    'shepherd.link',
    'highlights.1.title',
    'highlights.1.desc',
    'highlights.2.title',
    'highlights.2.desc',
    'highlights.3.title',
    'highlights.3.desc',
    'highlights.4.title',
    'highlights.4.desc',
  ])

  return (
    <main>
      <Hero />
      <ScriptureStrip />
      <VisionSection content={content} />
      <ConfessionReveal />
      <FromTheShepherd content={content} />
      <CommunityHighlights content={content} />
      <CTASection content={content} />
      <Footer />
    </main>
  )
}
