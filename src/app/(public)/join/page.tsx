import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { JoinPageClient } from '@/components/join/JoinPageClient'
import { db } from '@/lib/db'
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join — Become Part of Room For You',
  description:
    'Join the Room For You community with Minister Yadah. Free membership. Daily Word. Monthly gatherings. Prayer support. There is room for you here.',
  alternates: { canonical: 'https://rfyglobal.org/join' },
  openGraph: {
    title: 'Join — Become Part of Room For You',
    description:
      'Join the Room For You community with Minister Yadah. Free membership. Daily Word. Monthly gatherings. Prayer support. There is room for you here.',
    url: 'https://rfyglobal.org/join',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Room For You — A Christian Community with Minister Yadah',
      },
    ],
  },
}

export default async function JoinPage() {
  const extraFields = await db.joinFormField.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })

  const settings = await db.automationSettings.findFirst()
  const whatsappUrl = settings?.whatsappChannelUrl ?? ''

  return (
    <>
      <Navbar />
      <JoinPageClient extraFields={extraFields} whatsappUrl={whatsappUrl} />
      <Footer />
    </>
  )
}
