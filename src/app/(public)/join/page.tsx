import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { JoinPageClient } from '@/components/join/JoinPageClient'
import { db } from '@/lib/db'
import { getContentMany } from '@/lib/content'
import { JOIN_CMS_KEYS } from '@/lib/cms-keys'
import { getPageMetadata } from '@/lib/cms-metadata'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Join — Become Part of Room For You',
    'Join the Room For You community with Minister Yadah. Free membership. Daily Word. Monthly gatherings. Prayer support. There is room for you here.',
    '/join',
  )
}

export default async function JoinPage() {
  const [extraFields, settings, content] = await Promise.all([
    db.joinFormField.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
    db.automationSettings.findFirst(),
    getContentMany([...JOIN_CMS_KEYS]),
  ])

  const whatsappUrl = settings?.whatsappChannelUrl ?? ''

  return (
    <>
      <Navbar />
      <JoinPageClient extraFields={extraFields} whatsappUrl={whatsappUrl} content={content} />
      <Footer />
    </>
  )
}
