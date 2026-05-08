import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { AboutClient } from '@/components/about/AboutClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { getContentMany } from '@/lib/content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Room For You with Minister Yadah',
  description:
    'Learn about Room For You — a Christian community movement founded by Minister Yadah and SonsHub Media. Our vision: Jesus to Nations. Our mission: building community through worship, prayer, and the Word.',
  alternates: { canonical: 'https://rfyglobal.org/about' },
  openGraph: {
    title: "About Room For You — Minister Yadah's Community Ministry",
    description:
      'Room For You was born out of a conviction that every young person deserves a community where they are known and called into purpose.',
    url: 'https://rfyglobal.org/about',
  },
}

export const dynamic = 'force-dynamic'

const yadahPersonSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Minister Yadah',
  alternateName: ['Yadah', 'Yadah Kukeurim Daniel'],
  jobTitle: 'Gospel Music Minister',
  description:
    'International gospel music minister with over 100 million streams globally. Founder of Room For You Christian community.',
  url: 'https://yadahworld.com',
  image: 'https://rfyglobal.org/images/logo-dark.png',
  sameAs: [
    'https://instagram.com/iamyadah',
    'https://youtube.com/@yadah',
    'https://yadahworld.com',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'SonsHub Media',
  },
  founder: {
    '@type': 'Organization',
    name: 'Room For You',
    url: 'https://rfyglobal.org',
  },
  performerIn: {
    '@type': 'Organization',
    name: 'Room For You',
  },
  knowsAbout: [
    'Gospel music',
    'Christian ministry',
    'Evangelical outreach',
    'Worship',
    'Bible teaching',
  ],
  nationality: {
    '@type': 'Country',
    name: 'Nigeria',
  },
}

export default async function AboutPage() {
  const content = await getContentMany([
    'about.hero.headline1',
    'about.hero.headline2',
    'about.vision.text',
    'about.mission.heading',
    'about.mission.scripture',
    'about.mission.text',
    'about.yadah.bio',
    'about.yadah.image',
    'about.yadah.musicLink',
    'about.cta.headline',
    'about.cta.subtext',
  ])

  return (
    <PublicPageShell mainClassName="pb-0">
      <JsonLd data={yadahPersonSchema} />
      <AboutClient content={content} />
    </PublicPageShell>
  )
}
