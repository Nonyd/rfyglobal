import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { JoinPageClient } from '@/components/join/JoinPageClient'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join — Become Part of Room For You',
  description:
    'Join the Room For You community with Minister Yadah. Free membership. Daily Word. Monthly gatherings. Prayer support. There is room for you here.',
  alternates: { canonical: 'https://rfyglobal.org/join' },
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
