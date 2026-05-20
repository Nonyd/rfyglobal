import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { AboutClient } from '@/components/about/AboutClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { getContentMany } from '@/lib/content'
import { ABOUT_CMS_KEYS } from '@/lib/cms-keys'
import { getPageMetadata } from '@/lib/cms-metadata'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'About — Room For You with Minister Yadah',
    'Learn about Room For You — a Christian community movement founded by Minister Yadah and SonsHub Media. Our vision: Jesus to Nations. Our mission: building community through worship, prayer, and the Word.',
    '/about',
  )
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
    'https://instagram.com/rfyglobal',
    'https://youtube.com/@yadah',
    'https://x.com/rfyglobal',
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
  const content = await getContentMany([...ABOUT_CMS_KEYS])

  return (
    <PublicPageShell mainClassName="pb-0">
      <JsonLd data={yadahPersonSchema} />
      <AboutClient content={content} />
    </PublicPageShell>
  )
}
