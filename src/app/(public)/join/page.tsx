import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { JoinPageClient } from '@/components/join/JoinPageClient'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join the Community — Room For You',
  description:
    'Join Room For You — a community of young men and women singing songs of salvation, studying the Word, and getting others saved.',
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
