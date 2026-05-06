import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AboutClient } from '@/components/about/AboutClient'
import { getContentMany } from '@/lib/content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Room For You',
  description:
    'Room For You is a worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations.',
  openGraph: {
    title: 'About Room For You',
    description:
      'Building a community of young men and women who sing songs of salvation, study the Word, and get others saved.',
    url: 'https://rfyglobal.org/about',
  },
}

export const dynamic = 'force-dynamic'

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
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <AboutClient content={content} />
      </main>
      <Footer />
    </>
  )
}
